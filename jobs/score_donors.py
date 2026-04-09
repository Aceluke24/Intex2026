# jobs/score_donors.py
"""
Score donors using the trained donor retention model.

This script loads the latest trained model artifact and generates
repeat-donation probabilities for recent donations.

Intended to be run on a schedule (e.g., nightly).
"""

import pandas as pd
import joblib
import os
import json
from datetime import datetime, timezone

import pyodbc


# =========================
# CONFIG
# =========================
DATA_DIR = "ML pipelines/lighthouse_csv_files"
ARTIFACT_DIR = "artifacts/donor_retention"
OUTPUT_PATH = "artifacts/donor_retention/donor_scores.csv"
METADATA_PATH = "artifacts/donor_retention/metadata.json"

SQL_TABLE = "ml.donor_scores"

HORIZON_DAYS = 180

NUMERIC_FEATURES = [
    "donation_value",
    "days_since_last_donation",
    "prior_non_monetary_count",
    "prior_donation_index",
    "num_allocations",
    "pct_donation_allocated",
    "allocation_concentration",
    "is_recurring",
]

CATEGORICAL_FEATURES = [
    "donation_type",
    "channel_source",
    "campaign_name",
    "supporter_type",
    "region",
    "country",
    "relationship_type",
    "status",
    "acquisition_channel",
]


# =========================
# DATA LOADING (INFERENCE)
# =========================
def load_recent_data():
    donations = pd.read_csv(f"{DATA_DIR}/donations.csv", parse_dates=["donation_date"])
    allocations = pd.read_csv(f"{DATA_DIR}/donation_allocations.csv")
    supporters = pd.read_csv(f"{DATA_DIR}/supporters.csv")

    # donation value logic (must match training)
    donations["donation_value"] = donations["amount"].where(
        donations["amount"].notna(), donations["estimated_value"]
    )
    donations = donations[
        donations["donation_value"].notna() & (donations["donation_value"] > 0)
    ]

    donations = donations.sort_values(["supporter_id", "donation_date"])

    donations["next_donation_date"] = donations.groupby("supporter_id")[
        "donation_date"
    ].shift(-1)

    donations["days_since_last_donation"] = (
        donations["donation_date"]
        - donations.groupby("supporter_id")["donation_date"].shift(1)
    ).dt.days

    # allocation aggregation
    alloc_agg = allocations.groupby("donation_id").agg(
        num_allocations=("amount_allocated", "count"),
        total_amount_allocated=("amount_allocated", "sum"),
    )
    donations = donations.merge(alloc_agg, on="donation_id", how="left")

    donations["pct_donation_allocated"] = (
        donations["total_amount_allocated"] / donations["donation_value"]
    )

    donations["allocation_concentration"] = (
        allocations.groupby("donation_id")["amount_allocated"]
        .apply(lambda x: (x / x.sum()).max())
        .reindex(donations["donation_id"])
        .values
    )

    # supporter attributes
    donations = donations.merge(
        supporters, on="supporter_id", how="left"
    )

    # non-monetary history
    donations["is_non_monetary"] = donations["donation_type"].ne("Monetary")
    donations["prior_non_monetary_count"] = (
        donations.groupby("supporter_id")["is_non_monetary"].cumsum()
        - donations["is_non_monetary"].astype(int)
    )
    donations["prior_donation_index"] = donations.groupby("supporter_id").cumcount()

    return donations


# =========================
# SCORING
# =========================
def score():
    model = joblib.load(f"{ARTIFACT_DIR}/model.sav")

    df = load_recent_data()

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]

    probs = model.predict_proba(X)[:, 1]

    scored = pd.DataFrame(
        {
        "supporter_id": df["supporter_id"],
        "donation_id": df["donation_id"],
        "donation_date": df["donation_date"],
        "repeat_probability_180d": probs,
        }
    )

    # Keep one score per supporter using the latest donation event.
    scored = (
        scored.sort_values(["supporter_id", "donation_date", "donation_id"])
        .drop_duplicates(subset=["supporter_id"], keep="last")
        .reset_index(drop=True)
    )

    return scored


# =========================
# SAVE OUTPUT
# =========================
def resolve_model_version():
    model_version = os.getenv("MODEL_VERSION")
    if model_version:
        return model_version[:50]

    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    trained_at = metadata.get("trained_at")
    if trained_at:
        return str(trained_at)[:50]

    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_sql_connection_string():
    required_env = [
        "AZURE_SQL_SERVER",
        "AZURE_SQL_DB",
        "AZURE_SQL_USER",
        "AZURE_SQL_PASSWORD",
    ]

    missing = [name for name in required_env if not os.getenv(name)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    server = os.getenv("AZURE_SQL_SERVER")
    database = os.getenv("AZURE_SQL_DB")
    user = os.getenv("AZURE_SQL_USER")
    password = os.getenv("AZURE_SQL_PASSWORD")

    return (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={user};"
        f"PWD={password};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )


def upsert_scores(scored_df, model_version):
    scored_at_utc = datetime.now(timezone.utc).replace(tzinfo=None)

    rows = [
        (
            int(row.supporter_id),
            int(row.donation_id),
            float(row.repeat_probability_180d),
            scored_at_utc,
            model_version,
        )
        for row in scored_df.itertuples(index=False)
    ]

    merge_sql = f"""
MERGE INTO {SQL_TABLE} AS target
USING (VALUES (?, ?, ?, ?, ?)) AS source (
    supporter_id,
    donation_id,
    repeat_probability_180d,
    scored_at,
    model_version
)
ON target.supporter_id = source.supporter_id
WHEN MATCHED THEN
    UPDATE SET
        donation_id = source.donation_id,
        repeat_probability_180d = source.repeat_probability_180d,
        scored_at = source.scored_at,
        model_version = source.model_version
WHEN NOT MATCHED THEN
    INSERT (
        supporter_id,
        donation_id,
        repeat_probability_180d,
        scored_at,
        model_version
    )
    VALUES (
        source.supporter_id,
        source.donation_id,
        source.repeat_probability_180d,
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


def save(scored_df, model_version):
    save_df = scored_df.copy()
    save_df["model_version"] = model_version
    save_df["scored_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    save_df.to_csv(OUTPUT_PATH, index=False)


if __name__ == "__main__":
    scores = score()
    version = resolve_model_version()
    upserted = upsert_scores(scores, version)

    if os.getenv("SAVE_LOCAL_CSV", "false").lower() == "true":
        save(scores, version)
        print(f"Scoring complete. Upserted {upserted} rows into {SQL_TABLE}. CSV written to {OUTPUT_PATH}")
    else:
        print(f"Scoring complete. Upserted {upserted} rows into {SQL_TABLE}")