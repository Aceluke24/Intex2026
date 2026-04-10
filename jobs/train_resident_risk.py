# jobs/train_resident_risk.py
"""
Train the Resident Risk Escalation model and save artifacts.

Predicts whether a resident will experience a serious incident
(runaway attempt, self-harm, or high-severity incident)
within the next 30 days.

This is the production training job corresponding to the notebook:
'Predicting Resident Risk Escalation'.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, average_precision_score


# =========================
# CONFIG
# =========================
DATA_DIR = Path("ML pipelines/lighthouse_csv_files")
ARTIFACT_DIR = Path("artifacts/resident_risk")

LOOKBACK_DAYS = 90
LOOKAHEAD_DAYS = 30
RANDOM_STATE = 42


# =========================
# LOAD DATA
# =========================
def load_raw_tables():
    residents = pd.read_csv(DATA_DIR / "residents.csv")
    incidents = pd.read_csv(DATA_DIR / "incident_reports.csv")
    sessions = pd.read_csv(DATA_DIR / "process_recordings.csv")
    health = pd.read_csv(DATA_DIR / "health_wellbeing_records.csv")
    education = pd.read_csv(DATA_DIR / "education_records.csv")
    visitations = pd.read_csv(DATA_DIR / "home_visitations.csv")
    interventions = pd.read_csv(DATA_DIR / "intervention_plans.csv")

    incidents["incident_date"] = pd.to_datetime(incidents["incident_date"])
    sessions["session_date"] = pd.to_datetime(sessions["session_date"])
    health["record_date"] = pd.to_datetime(health["record_date"])
    education["record_date"] = pd.to_datetime(education["record_date"])
    visitations["visit_date"] = pd.to_datetime(visitations["visit_date"])
    residents["date_of_admission"] = pd.to_datetime(
        residents["date_of_admission"], errors="coerce"
    )
    residents["date_of_birth"] = pd.to_datetime(
        residents["date_of_birth"], errors="coerce"
    )

    return residents, incidents, sessions, health, education, visitations, interventions


# =========================
# SNAPSHOT + TARGET
# =========================
def build_snapshots(residents, incidents):
    incidents["is_serious"] = (
        (incidents["severity"] == "High")
        | incidents["incident_type"].isin(["RunawayAttempt", "SelfHarm"])
    )

    snapshot_dates = pd.date_range(
        "2023-07-01",
        incidents["incident_date"].max() - timedelta(days=LOOKAHEAD_DAYS),
        freq="MS",
    )

    rows = []
    for _, r in residents.iterrows():
        admit = r["date_of_admission"]
        if pd.isna(admit):
            continue
        for snap in snapshot_dates:
            if snap >= admit + timedelta(days=LOOKBACK_DAYS):
                rows.append({"resident_id": r["resident_id"], "snapshot_date": snap})

    snapshots = pd.DataFrame(rows)

    serious = incidents[incidents["is_serious"]][
        ["resident_id", "incident_date"]
    ].copy()

    def has_escalation(row):
        future = serious[
            (serious["resident_id"] == row["resident_id"])
            & (serious["incident_date"] > row["snapshot_date"])
            & (serious["incident_date"] <= row["snapshot_date"] + timedelta(days=LOOKAHEAD_DAYS))
        ]
        return int(len(future) > 0)

    snapshots["escalation_next_30d"] = snapshots.apply(has_escalation, axis=1)
    return snapshots


# =========================
# FEATURE ENGINEERING
# =========================
def window(df, date_col, rid, snap):
    start = snap - timedelta(days=LOOKBACK_DAYS)
    return df[
        (df["resident_id"] == rid)
        & (df[date_col] >= start)
        & (df[date_col] < snap)
    ]


_DISTRESSED = {"Angry", "Anxious", "Distressed", "Withdrawn", "Sad"}


def build_features(snapshots, residents, incidents, sessions, health, education, visitations):
    feats = []

    for _, row in snapshots.iterrows():
        rid, snap = row["resident_id"], row["snapshot_date"]
        f = {}

        s = window(sessions, "session_date", rid, snap)
        f["sess_count_90d"] = len(s)
        f["sess_concern_rate"] = s["concerns_flagged"].mean() if len(s) else 0
        f["sess_distress_rate"] = (
            s["emotional_state_observed"].isin(_DISTRESSED).mean() if len(s) else 0
        )
        f["sess_mean_duration"] = s["session_duration_minutes"].mean() if len(s) else 0
        f["sess_referral_rate"] = s["referral_made"].mean() if len(s) else 0

        h = window(health, "record_date", rid, snap)
        if len(h):
            h = h.sort_values("record_date").iloc[-1]
            f["health_score"] = h["general_health_score"]
            f["sleep_score"] = h["sleep_quality_score"]
            f["nutrition_score"] = h["nutrition_score"]
            f["energy_score"] = h["energy_level_score"]
        else:
            f.update({k: np.nan for k in ["health_score","sleep_score","nutrition_score","energy_score"]})

        e = window(education, "record_date", rid, snap)
        if len(e):
            e = e.sort_values("record_date").iloc[-1]
            f["attendance_rate"] = e["attendance_rate"]
            f["progress_pct"] = e["progress_percent"]
        else:
            f["attendance_rate"] = np.nan
            f["progress_pct"] = np.nan

        v = window(visitations, "visit_date", rid, snap)
        f["visit_count_90d"] = len(v)
        f["visit_safety_concern_rate"] = v["safety_concerns_noted"].mean() if len(v) else 0
        f["visit_uncooperative_rate"] = (
            v["family_cooperation_level"].eq("Uncooperative").mean() if len(v) else 0
        )
        f["visit_unfavorable_rate"] = (
            v["visit_outcome"].eq("Unfavorable").mean() if len(v) else 0
        )

        past_inc = incidents[
            (incidents["resident_id"] == rid)
            & (incidents["incident_date"] < snap)
        ]
        f["prior_incidents_total"] = len(past_inc)
        f["prior_incidents_serious"] = past_inc["is_serious"].sum()
        f["days_since_last_incident"] = (
            (snap - past_inc["incident_date"].max()).days
            if len(past_inc) else 999
        )
        f["incidents_90d"] = len(window(incidents, "incident_date", rid, snap))

        feats.append(f)

    return pd.DataFrame(feats)


# =========================
# TRAIN
# =========================
def train():
    res, inc, sess, hlth, edu, vis, _ = load_raw_tables()
    snaps = build_snapshots(res, inc)
    feats = build_features(snaps, res, inc, sess, hlth, edu, vis)

    df = pd.concat([snaps.reset_index(drop=True), feats], axis=1)

    static = res[[
        "resident_id",
        "sub_cat_trafficked", "sub_cat_physical_abuse", "sub_cat_sexual_abuse",
        "sub_cat_osaec", "sub_cat_at_risk",
        "has_special_needs", "is_pwd"
    ]]
    df = df.merge(static, on="resident_id", how="left")

    y = df["escalation_next_30d"].astype(int)
    X = df.drop(columns=["resident_id", "snapshot_date", "escalation_next_30d"])
    X = X.fillna(X.median())

    model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        min_samples_leaf=5,
        random_state=RANDOM_STATE,
    )
    model.fit(X, y)

    probs = model.predict_proba(X)[:, 1]
    metrics = {
        "roc_auc": float(roc_auc_score(y, probs)),
        "pr_auc": float(average_precision_score(y, probs)),
        "n_training_rows": int(len(y)),
    }

    return model, metrics


# =========================
# SAVE
# =========================
def save(model, metrics):
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, ARTIFACT_DIR / "model.sav")

    metadata = {
        "model_name": "resident_risk_escalation",
        "trained_at": datetime.utcnow().isoformat(),
        "lookahead_days": LOOKAHEAD_DAYS,
    }

    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2))
    (ARTIFACT_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    model, metrics = train()
    save(model, metrics)
    print("Resident risk model trained and artifacts saved.")