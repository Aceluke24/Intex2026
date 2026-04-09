# jobs/train_donor_retention.py
"""
Train the Donor Retention (Repeat Giving) model and save artifacts.

This script is intended to be run on a schedule (e.g., weekly).
It produces a versioned model artifact along with metadata and metrics.
"""

import json
from datetime import datetime

import joblib
import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.metrics import roc_auc_score, average_precision_score


# =========================
# CONFIG
# =========================
DATA_DIR = "ML pipelines/lighthouse_csv_files"
ARTIFACT_DIR = "artifacts/donor_retention"

HORIZON_DAYS = 180
RANDOM_STATE = 42

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
# DATA LOADING
# =========================
def load_data():
    donations = pd.read_csv(f"{DATA_DIR}/donations.csv", parse_dates=["donation_date"])
    allocations = pd.read_csv(f"{DATA_DIR}/donation_allocations.csv")
    supporters = pd.read_csv(f"{DATA_DIR}/supporters.csv")

    # --- replicate notebook filtering ---
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
    donations["days_to_next_donation"] = (
        donations["next_donation_date"] - donations["donation_date"]
    ).dt.days
    donations["days_since_last_donation"] = (
        donations["donation_date"]
        - donations.groupby("supporter_id")["donation_date"].shift(1)
    ).dt.days

    # Allocate aggregation
    alloc_by_donation = allocations.groupby("donation_id").agg(
        num_allocations=("amount_allocated", "count"),
        total_amount_allocated=("amount_allocated", "sum"),
    )
    donations = donations.merge(
        alloc_by_donation, on="donation_id", how="left"
    )

    donations["pct_donation_allocated"] = (
        donations["total_amount_allocated"] / donations["donation_value"]
    )

    donations["allocation_concentration"] = (
        allocations.groupby("donation_id")["amount_allocated"]
        .apply(lambda x: (x / x.sum()).max())
        .reindex(donations["donation_id"])
        .values
    )

    donations = donations.merge(
        supporters, on="supporter_id", how="left"
    )

    # Non‑monetary history
    donations["is_non_monetary"] = donations["donation_type"].ne("Monetary")
    donations["prior_non_monetary_count"] = (
        donations.groupby("supporter_id")["is_non_monetary"].cumsum()
        - donations["is_non_monetary"].astype(int)
    )
    donations["prior_donation_index"] = donations.groupby("supporter_id").cumcount()

    return donations


# =========================
# TARGET ENGINEERING
# =========================
def build_labels(df):
    dataset_end = df["donation_date"].max()
    has_next = df["next_donation_date"].notna()
    window_days = (dataset_end - df["donation_date"]).dt.days

    eligible = has_next | (window_days >= HORIZON_DAYS)
    df = df.loc[eligible].copy()

    df["repeat_within_h"] = 0
    df.loc[has_next & (df["days_to_next_donation"] <= HORIZON_DAYS),
           "repeat_within_h"] = 1

    return df


# =========================
# TRAINING
# =========================
def train():
    df = load_data()
    df = build_labels(df)

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["repeat_within_h"].astype(int)

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline([
                ("imp", SimpleImputer(strategy="median")),
                ("scale", StandardScaler()),
            ]), NUMERIC_FEATURES),
            ("cat", Pipeline([
                ("imp", SimpleImputer(strategy="most_frequent")),
                ("oh", OneHotEncoder(handle_unknown="ignore", max_categories=30)),
            ]), CATEGORICAL_FEATURES),
        ]
    )

    model = Pipeline(
        steps=[
            ("prep", preprocessor),
            ("clf", LogisticRegression(
                class_weight="balanced",
                solver="saga",
                max_iter=5000,
                random_state=RANDOM_STATE,
            )),
        ]
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
# SAVE ARTIFACTS
# =========================
def save(model, metrics):
    import os
    os.makedirs(ARTIFACT_DIR, exist_ok=True)

    joblib.dump(model, f"{ARTIFACT_DIR}/model.sav")

    metadata = {
        "model_name": "donor_retention",
        "trained_at": datetime.utcnow().isoformat(),
        "horizon_days": HORIZON_DAYS,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
    }

    with open(f"{ARTIFACT_DIR}/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    with open(f"{ARTIFACT_DIR}/metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)


if __name__ == "__main__":
    model, metrics = train()
    save(model, metrics)
    print("Donor retention model trained and artifacts saved.")