# jobs/score_donors.py
"""
Score donors using the trained donor retention model.

This script loads the latest trained model artifact and generates
repeat-donation probabilities for recent donations.

Intended to be run on a schedule (e.g., nightly).
"""

import pandas as pd
import joblib
from datetime import datetime


# =========================
# CONFIG
# =========================
DATA_DIR = "ML pipelines/lighthouse_csv_files"
ARTIFACT_DIR = "artifacts/donor_retention"
OUTPUT_PATH = "artifacts/donor_retention/donor_scores.csv"

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

    scored = pd.DataFrame({
        "supporter_id": df["supporter_id"],
        "donation_id": df["donation_id"],
        "donation_date": df["donation_date"],
        "repeat_probability_180d": probs,
        "scored_at": datetime.utcnow().isoformat(),
    })

    return scored


# =========================
# SAVE OUTPUT
# =========================
def save(scored_df):
    scored_df.to_csv(OUTPUT_PATH, index=False)


if __name__ == "__main__":
    scores = score()
    save(scores)
    print(f"Scoring complete. Output written to {OUTPUT_PATH}")