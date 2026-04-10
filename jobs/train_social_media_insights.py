# jobs/train_social_media_insights.py
"""
Train an Explanatory Model for Social Media Posts and Donation Referrals.

This script fits a Negative Binomial regression to identify which
controllable post characteristics are associated with higher donation
referrals.

This is an EXPLANATORY analytics pipeline:
- No live scoring
- No Azure SQL writes
- Produces interpretable IRRs for leadership
"""

import json
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf
import joblib


# =========================
# CONFIG
# =========================
DATA_DIR = Path("ML pipelines/lighthouse_csv_files")
ARTIFACT_DIR = Path("artifacts/social_media_insights")


# =========================
# LOAD + PREP DATA
# =========================
def load_and_prepare():
    posts = pd.read_csv(DATA_DIR / "social_media_posts.csv")

    posts["call_to_action_type"] = posts["call_to_action_type"].fillna("None")

    # Cyclical hour encoding
    posts["hour_sin"] = np.sin(2 * np.pi * posts["post_hour"] / 24)
    posts["hour_cos"] = np.cos(2 * np.pi * posts["post_hour"] / 24)

    # Controls
    posts["log_followers"] = np.log1p(posts["follower_count_at_post"])
    posts["is_weekend"] = posts["day_of_week"].isin(["Saturday", "Sunday"]).astype(int)

    # Enforce types
    cat_features = [
        "platform", "post_type", "media_type", "sentiment_tone",
        "call_to_action_type", "content_topic",
    ]
    bool_features = ["has_call_to_action", "features_resident_story", "is_boosted"]

    for col in cat_features:
        posts[col] = posts[col].astype("category")
    for col in bool_features:
        posts[col] = posts[col].astype(int)

    return posts


# =========================
# TRAIN MODEL
# =========================
def train():
    df = load_and_prepare()

    formula = (
        "donation_referrals ~ "
        "C(platform, Treatment(reference='LinkedIn')) + "
        "C(post_type, Treatment(reference='ThankYou')) + "
        "C(media_type, Treatment(reference='Text')) + "
        "C(sentiment_tone, Treatment(reference='Informative')) + "
        "C(call_to_action_type, Treatment(reference='None')) + "
        "C(content_topic, Treatment(reference='Gratitude')) + "
        "features_resident_story + has_call_to_action + "
        "is_boosted + is_weekend + "
        "caption_length + num_hashtags + mentions_count + "
        "hour_sin + hour_cos + log_followers"
    )

    model = smf.negativebinomial(formula, data=df).fit(disp=False, maxiter=500)

    params = model.params.drop("alpha", errors="ignore")
    conf = model.conf_int().drop("alpha", errors="ignore")
    pvals = model.pvalues.drop("alpha", errors="ignore")

    irr = pd.DataFrame({
        "IRR": np.exp(params),
        "CI_low": np.exp(conf[0]),
        "CI_high": np.exp(conf[1]),
        "p_value": pvals,
        "significant": pvals < 0.05,
    }).sort_values("IRR", ascending=False)

    metrics = {
        "aic": float(model.aic),
        "bic": float(model.bic),
        "log_likelihood": float(model.llf),
        "n_posts": int(model.nobs),
    }

    return model, irr, metrics


# =========================
# SAVE ARTIFACTS
# =========================
def save(model, irr, metrics):
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, ARTIFACT_DIR / "model.sav")
    irr.to_csv(ARTIFACT_DIR / "irr_table.csv")

    (ARTIFACT_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps({
        "model_name": "social_media_negative_binomial",
        "trained_at": datetime.utcnow().isoformat(),
        "target": "donation_referrals",
    }, indent=2))


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    model, irr, metrics = train()
    save(model, irr, metrics)
    print("✅ Social media explanatory model trained and artifacts saved.")