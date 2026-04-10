-- Least-privilege permissions for ML scoring principal on ML output tables.
-- Replace placeholders before executing in Azure SQL:
--   <ML_PRINCIPAL_NAME>
--   <ML_PRINCIPAL_PASSWORD>

-- Optional: create a dedicated contained user for ML scoring.
-- Use this if the current ML credential is over-privileged (e.g., db_owner/dbo).
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '<ML_PRINCIPAL_NAME>')
BEGIN
	EXEC('CREATE USER [<ML_PRINCIPAL_NAME>] WITH PASSWORD = ''<ML_PRINCIPAL_PASSWORD>'';');
END;

GRANT SELECT, INSERT, UPDATE ON OBJECT::ml.donor_scores TO [<ML_PRINCIPAL_NAME>];
REVOKE ALTER, CONTROL, TAKE OWNERSHIP ON OBJECT::ml.donor_scores FROM [<ML_PRINCIPAL_NAME>];

GRANT SELECT, INSERT, UPDATE ON OBJECT::ml.resident_risk_scores TO [<ML_PRINCIPAL_NAME>];
REVOKE ALTER, CONTROL, TAKE OWNERSHIP ON OBJECT::ml.resident_risk_scores FROM [<ML_PRINCIPAL_NAME>];

-- Optional hardening if the principal was previously over-privileged.
IF IS_ROLEMEMBER('db_owner', '<ML_PRINCIPAL_NAME>') = 1
BEGIN
	ALTER ROLE db_owner DROP MEMBER [<ML_PRINCIPAL_NAME>];
END;

-- Verification: required permissions should be 1.
EXECUTE AS USER = '<ML_PRINCIPAL_NAME>';
SELECT
	HAS_PERMS_BY_NAME('ml.donor_scores', 'OBJECT', 'SELECT') AS can_select,
	HAS_PERMS_BY_NAME('ml.donor_scores', 'OBJECT', 'INSERT') AS can_insert,
	HAS_PERMS_BY_NAME('ml.donor_scores', 'OBJECT', 'UPDATE') AS can_update;

SELECT
	HAS_PERMS_BY_NAME('ml.resident_risk_scores', 'OBJECT', 'SELECT') AS can_select,
	HAS_PERMS_BY_NAME('ml.resident_risk_scores', 'OBJECT', 'INSERT') AS can_insert,
	HAS_PERMS_BY_NAME('ml.resident_risk_scores', 'OBJECT', 'UPDATE') AS can_update;
REVERT;

-- Verification: elevated privileges should be absent.
SELECT
	IS_ROLEMEMBER('db_owner', '<ML_PRINCIPAL_NAME>') AS is_db_owner;

EXECUTE AS USER = '<ML_PRINCIPAL_NAME>';
SELECT
	HAS_PERMS_BY_NAME('ml.donor_scores', 'OBJECT', 'ALTER') AS can_alter,
	HAS_PERMS_BY_NAME('ml.donor_scores', 'OBJECT', 'CONTROL') AS can_control;

SELECT
	HAS_PERMS_BY_NAME('ml.resident_risk_scores', 'OBJECT', 'ALTER') AS can_alter,
	HAS_PERMS_BY_NAME('ml.resident_risk_scores', 'OBJECT', 'CONTROL') AS can_control;
REVERT;
