# jobs/score_resident_risk.py
"""
Score residents using the trained resident risk escalation model.

This script computes risk probabilities for each active resident
based on the most recent valid snapshot and writes results to Azure SQL.

Intended to be run on a schedule (e.g., weekly).
"""

import os
import json
from pathlib import Path
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
import joblib
import pyodbc


# =========================
# CONFIG
# =========================
DATA_DIR = Path("ML pipelines/lighthouse_csv_files")
ARTIFACT_DIR = Path("artifacts/resident_risk")
METADATA_PATH = ARTIFACT_DIR / "metadata.json"

SQL_TABLE = "ml.resident_risk_scores"

LOOKBACK_DAYS = 90
LOOKAHEAD_DAYS = 30
RISK_THRESHOLD = 0.30   # same threshold used in notebook


# =========================
# LOAD RAW DATA
# =========================
def load_raw_tables():
    residents = pd.read_csv(DATA_DIR / "residents.csv")
    incidents = pd.read_csv(DATA_DIR / "incident_reports.csv")
    sessions = pd.read_csv(DATA_DIR / "process_recordings.csv")
    health = pd.read_csv(DATA_DIR / "health_wellbeing_records.csv")
    education = pd.read_csv(DATA_DIR / "education_records.csv")
    visitations = pd.read_csv(DATA_DIR / "home_visitations.csv")

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

    return residents, incidents, sessions, health, education, visitations


# =========================
# SNAPSHOT SELECTION
# =========================
def build_latest_snapshots(residents, incidents):
    """
    For each resident, select the most recent snapshot date
    with sufficient history (LOOKBACK_DAYS).
    """

    incidents["is_serious"] = (
        (incidents["severity"] == "High")
        | incidents["incident_type"].isin(["RunawayAttempt", "SelfHarm"])
    )

    # Latest possible snapshot that still allows a lookahead window
    max_snap = incidents["incident_date"].max() - timedelta(days=LOOKAHEAD_DAYS)
    latest_snap = max_snap.normalize().replace(day=1)

    rows = []
    for _, r in residents.iterrows():
        admit = r["date_of_admission"]
        if pd.isna(admit):
            continue
        if latest_snap >= admit + timedelta(days=LOOKBACK_DAYS):
            rows.append({
                "resident_id": r["resident_id"],
                "snapshot_date": latest_snap,
            })

    return pd.DataFrame(rows)


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

        # ── Sessions ─────────────────────────────
        s = window(sessions, "session_date", rid, snap)
        f["sess_count_90d"] = len(s)
        f["sess_concern_rate"] = s["concerns_flagged"].mean() if len(s) else 0
        f["sess_distress_rate"] = (
            s["emotional_state_observed"].isin(_DISTRESSED).mean() if len(s) else 0
        )
        f["sess_mean_duration"] = s["session_duration_minutes"].mean() if len(s) else 0
        f["sess_referral_rate"] = s["referral_made"].mean() if len(s) else 0

        # ── Health ───────────────────────────────
        h = window(health, "record_date", rid, snap)
        if len(h):
            h = h.sort_values("record_date").iloc[-1]
            f["health_score"] = h["general_health_score"]
            f["sleep_score"] = h["sleep_quality_score"]
            f["nutrition_score"] = h["nutrition_score"]
            f["energy_score"] = h["energy_level_score"]
        else:
            f.update({
                "health_score": np.nan,
                "sleep_score": np.nan,
                "nutrition_score": np.nan,
                "energy_score": np.nan,
            })

        # ── Education ────────────────────────────
        e = window(education, "record_date", rid, snap)
        if len(e):
            e = e.sort_values("record_date").iloc[-1]
            f["attendance_rate"] = e["attendance_rate"]
            f["progress_pct"] = e["progress_percent"]
        else:
            f["attendance_rate"] = np.nan
            f["progress_pct"] = np.nan

        # ── Visitations ──────────────────────────
        v = window(visitations, "visit_date", rid, snap)
        f["visit_count_90d"] = len(v)
        f["visit_safety_concern_rate"] = v["safety_concerns_noted"].mean() if len(v) else 0
        f["visit_uncooperative_rate"] = (
            v["family_cooperation_level"].eq("Uncooperative").mean() if len(v) else 0
        )
        f["visit_unfavorable_rate"] = (
            v["visit_outcome"].eq("Unfavorable").mean() if len(v) else 0
        )

        # ── Past incidents ───────────────────────
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
# SCORING
# =========================
def score():
    model = joblib.load(ARTIFACT_DIR / "model.sav")

    residents, incidents, sessions, health, education, visitations = load_raw_tables()
    snapshots = build_latest_snapshots(residents, incidents)
    features = build_features(
        snapshots, residents, incidents,
        sessions, health, education, visitations
    )

    df = pd.concat([snapshots.reset_index(drop=True), features], axis=1)

    static = residents[[
        "resident_id",
        "sub_cat_trafficked", "sub_cat_physical_abuse", "sub_cat_sexual_abuse",
        "sub_cat_osaec", "sub_cat_at_risk",
        "has_special_needs", "is_pwd",
    ]]
    df = df.merge(static, on="resident_id", how="left")

    X = df.drop(columns=["resident_id", "snapshot_date"]).fillna(
        df.drop(columns=["resident_id", "snapshot_date"]).median()
    )

    probs = model.predict_proba(X)[:, 1]
    flags = (probs >= RISK_THRESHOLD).astype(int)

    scored = pd.DataFrame({
        "resident_id": df["resident_id"],
        "risk_probability": probs,
        "risk_flag": flags,
    })

    return scored


# =========================
# DATABASE WRITE
# =========================
def resolve_model_version():
    if os.getenv("MODEL_VERSION"):
        return os.getenv("MODEL_VERSION")[:50]
    meta = json.loads(METADATA_PATH.read_text())
    return meta.get("trained_at", "")[:50]


def get_sql_connection_string():
    required = ["AZURE_SQL_SERVER", "AZURE_SQL_DB", "AZURE_SQL_USER", "AZURE_SQL_PASSWORD"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        raise RuntimeError(f"Missing env vars: {', '.join(missing)}")

    return (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={os.getenv('AZURE_SQL_SERVER')};"
        f"DATABASE={os.getenv('AZURE_SQL_DB')};"
        f"UID={os.getenv('AZURE_SQL_USER')};"
        f"PWD={os.getenv('AZURE_SQL_PASSWORD')};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )


def upsert_scores(scored_df, model_version):
    scored_at = datetime.now(timezone.utc).replace(tzinfo=None)

    rows = [
        (
            int(r.resident_id),
            float(r.risk_probability),
            int(r.risk_flag),
            scored_at,
            model_version,
        )
        for r in scored_df.itertuples(index=False)
    ]

    merge_sql = f"""
MERGE INTO {SQL_TABLE} AS target
USING (VALUES (?, ?, ?, ?, ?)) AS source (
    resident_id,
    risk_probability,
    risk_flag,
    scored_at,
    model_version
)
ON target.resident_id = source.resident_id
WHEN MATCHED THEN
    UPDATE SET
        risk_probability = source.risk_probability,
        risk_flag = source.risk_flag,
        scored_at = source.scored_at,
        model_version = source.model_version
WHEN NOT MATCHED THEN
    INSERT (
        resident_id,
        risk_probability,
        risk_flag,
        scored_at,
        model_version
    )
    VALUES (
        source.resident_id,
        source.risk_probability,
        source.risk_flag,
        source.scored_at,
        source.model_version
    );
"""

    conn_str = get_sql_connection_string()
    with pyodbc.connect(conn_str) as conn:
        with conn.cursor() as cur:
            cur.fast_executemany = True
            cur.executemany(merge_sql, rows)
        conn.commit()

    return len(rows)


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    scores = score()
    version = resolve_model_version()
    upserted = upsert_scores(scores, version)
    print(f"Scoring complete. Upserted {upserted} rows into {SQL_TABLE}.")