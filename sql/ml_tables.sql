CREATE TABLE ml_donor_scores (
    supporter_id INT NOT NULL,
    donation_id INT NOT NULL,
    repeat_probability_180d FLOAT NOT NULL,
    scored_at DATETIME2 NOT NULL,
    model_version NVARCHAR(50) NOT NULL,

    CONSTRAINT PK_ml_donor_scores PRIMARY KEY (supporter_id)
);
