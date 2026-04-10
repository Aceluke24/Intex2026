# jobs/train_reintegration_analysis.py
"""
Train the Resident Reintegration Explanatory Model.

This script reproduces the FINAL explanatory logistic regression model
used to analyze drivers of successful resident reintegration.

This is a BATCH ANALYTICAL PIPELINE:
- It does NOT score individuals live
- It does NOT write to Azure SQL
- It DOES produce interpretable odds ratios for leadership
"""

import json
import re
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import joblib
import statsmodels.api as sm
from sklearn.preprocessing import StandardScaler


# =========================
# CONFIG
# =========================
DATA_DIR = Path("ML pipelines/lighthouse_csv_files")
ARTIFACT_DIR = Path("artifacts/reintegration")


# =========================
# LOAD DATA
# =========================
def load_raw_tables():
    residents     = pd.read_csv(DATA_DIR / "residents.csv")
    sessions      = pd.read_csv(DATA_DIR / "process_recordings.csv")
    education     = pd.read_csv(DATA_DIR / "education_records.csv")
    visitations   = pd.read_csv(DATA_DIR / "home_visitations.csv")
    interventions = pd.read_csv(DATA_DIR / "intervention_plans.csv")
    health        = pd.read_csv(DATA_DIR / "health_wellbeing_records.csv")
    incidents     = pd.read_csv(DATA_DIR / "incident_reports.csv")

    return residents, sessions, education, visitations, interventions, health, incidents


# =========================
# FEATURE ENGINEERING HELPERS
# =========================
def parse_age(s):
    if pd.isna(s):
        return np.nan
    m = re.match(r"(\d+)\s*Years?\s*(\d+)\s*months?", str(s), re.IGNORECASE)
    return int(m.group(1)) + int(m.group(2)) / 12 if m else np.nan


def parse_stay(s):
    if pd.isna(s):
        return np.nan
    m = re.match(r"(\d+)\s*Years?\s*(\d+)\s*months?", str(s), re.IGNORECASE)
    return int(m.group(1)) * 12 + int(m.group(2)) if m else np.nan


# =========================
# DATASET CONSTRUCTION
# =========================
def build_dataset():
    residents, sessions, education, visitations, interventions, health, incidents = load_raw_tables()

    # Target variable
    residents["successful_reintegration"] = (
        residents["reintegration_status"].eq("Completed").astype(int)
    )

    # Parse demographic features
    residents["age_at_admission"] = residents["age_upon_admission"].apply(parse_age)
    residents["stay_months"] = residents["length_of_stay"].apply(parse_stay)

    risk_map = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
    residents["initial_risk_numeric"] = (
        residents["initial_risk_level"].map(risk_map).fillna(1)
    )

    # ── Process recordings ──────────────────────────────────
    sess = (
        sessions.groupby("resident_id")
        .agg(
            sess_count=("recording_id", "count"),
            sess_progress_rate=("progress_noted", "mean"),
            sess_concern_rate=("concerns_flagged", "mean"),
            sess_referral_rate=("referral_made", "mean"),
            sess_mean_duration=("session_duration_minutes", "mean"),
        )
        .reset_index()
    )

    DISTRESSED = {"Angry", "Anxious", "Distressed", "Withdrawn", "Sad"}
    distress = (
        sessions.assign(
            distressed=sessions["emotional_state_observed"].isin(DISTRESSED).astype(int)
        )
        .groupby("resident_id")["distressed"]
        .mean()
        .rename("sess_distress_rate")
        .reset_index()
    )

    sess = sess.merge(distress, on="resident_id", how="left")

    # ── Education ───────────────────────────────────────────
    edu = (
        education.groupby("resident_id")
        .agg(
            edu_mean_attendance=("attendance_rate", "mean"),
            edu_mean_progress=("progress_percent", "mean"),
            edu_completed_courses=("completion_status", lambda x: (x == "Completed").sum()),
        )
        .reset_index()
    )

    # ── Home visitations ────────────────────────────────────
    vis = (
        visitations.groupby("resident_id")
        .agg(
            visit_count=("visitation_id", "count"),
            visit_favorable_rate=("visit_outcome", lambda x: (x == "Favorable").mean()),
            visit_safety_concern_rate=("safety_concerns_noted", "mean"),
            visit_cooperative_rate=(
                "family_cooperation_level",
                lambda x: x.isin(["Cooperative", "Highly Cooperative"]).mean(),
            ),
        )
        .reset_index()
    )

    # ── Intervention plans ─────────────────────────────────
    intv = (
        interventions.groupby("resident_id")
        .agg(
            intv_achieved_count=("status", lambda x: (x == "Achieved").sum()),
            intv_total=("plan_id", "count"),
        )
        .reset_index()
    )
    intv["intv_achieved_rate"] = intv["intv_achieved_count"] / intv["intv_total"].replace(0, np.nan)

    # ── Health ─────────────────────────────────────────────
    hlt = (
        health.groupby("resident_id")
        .agg(
            health_mean=("general_health_score", "mean"),
            sleep_mean=("sleep_quality_score", "mean"),
            nutrition_mean=("nutrition_score", "mean"),
            energy_mean=("energy_level_score", "mean"),
        )
        .reset_index()
    )

    # ── Incidents ──────────────────────────────────────────
    incidents["is_serious"] = (
        (incidents["severity"] == "High")
        | incidents["incident_type"].isin(["RunawayAttempt", "SelfHarm"])
    )

    inc = (
        incidents.groupby("resident_id")
        .agg(
            incident_count=("incident_id", "count"),
            serious_incident_count=("is_serious", "sum"),
        )
        .reset_index()
    )

    # ── Merge all features ─────────────────────────────────
    base_cols = [
        "resident_id", "successful_reintegration",
        "age_at_admission", "stay_months", "initial_risk_numeric",
        "sub_cat_trafficked", "sub_cat_physical_abuse", "sub_cat_sexual_abuse",
        "sub_cat_at_risk", "has_special_needs",
        "family_solo_parent", "family_is_4ps", "family_informal_settler",
    ]

    df = residents[base_cols]
    for tbl in [sess, edu, vis, intv, hlt, inc]:
        df = df.merge(tbl, on="resident_id", how="left")

    # Clean missing values
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.fillna(df.median(numeric_only=True))

    for c in df.select_dtypes(include="bool"):
        df[c] = df[c].astype(int)

    return df


# =========================
# TRAIN MODEL
# =========================
def train():
    df = build_dataset()

    y = df["successful_reintegration"]
    X = df.drop(columns=["resident_id", "successful_reintegration"])

    # Remove zero-variance columns
    stds = X.std()
    X = X[stds[stds > 0].index]

    # Final safety cleanup
    X = X.replace([np.inf, -np.inf], np.nan).dropna(axis=0)
    y = y.loc[X.index]

    # Scale features
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(
        scaler.fit_transform(X),
        columns=X.columns,
        index=X.index,
    )

    X_scaled = sm.add_constant(X_scaled)

    model = sm.Logit(y, X_scaled).fit(disp=False, maxiter=500, method="bfgs")

    params = model.params.drop("const")
    conf = model.conf_int().drop("const")
    pvals = model.pvalues.drop("const")

    odds = pd.DataFrame({
        "odds_ratio": np.exp(params),
        "ci_low": np.exp(conf[0]),
        "ci_high": np.exp(conf[1]),
        "p_value": pvals,
        "significant": pvals < 0.05,
    }).sort_values("odds_ratio", ascending=False)

    metrics = {
        "pseudo_r2_mcfadden": float(model.prsquared),
        "n_observations": int(model.nobs),
        "aic": float(model.aic),
        "bic": float(model.bic),
    }

    return model, scaler, odds, metrics, list(X.columns)


# =========================
# SAVE ARTIFACTS
# =========================
def save(model, scaler, odds, metrics, features):
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(
        {"model": model, "scaler": scaler},
        ARTIFACT_DIR / "model.sav",
    )

    odds.to_csv(ARTIFACT_DIR / "odds_ratios.csv")
    odds[["odds_ratio"]].to_csv(ARTIFACT_DIR / "coefficients.csv")

    (ARTIFACT_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps({
        "model_name": "reintegration_explanatory_logistic_regression",
        "trained_at": datetime.utcnow().isoformat(),
        "features": features,
    }, indent=2))


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    model, scaler, odds, metrics, features = train()
    save(model, scaler, odds, metrics, features)
    print("✅ Reintegration explanatory model trained and artifacts saved.")