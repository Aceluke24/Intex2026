#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys

import certifi
import pytds


def connect(args):
    return pytds.connect(
        server=args.server,
        database=args.database,
        user=args.user,
        password=args.password,
        cafile=certifi.where(),
        validate_host=True,
        autocommit=False,
    )


def exec_sql(cur, sql: str):
    print("SQL>", " ".join(sql.split()))
    cur.execute(sql)


def ensure_sequence(cur, seq_name: str, start_with: int):
    exec_sql(
        cur,
        f"""
IF OBJECT_ID('{seq_name}', 'SO') IS NULL
    EXEC('CREATE SEQUENCE {seq_name} AS INT START WITH 1 INCREMENT BY 1');
ALTER SEQUENCE {seq_name} RESTART WITH {start_with};
""",
    )


def ensure_default(cur, table: str, column: str, constraint_name: str, default_expr: str):
    cur.execute(
        """
SELECT dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.default_object_id = dc.object_id
JOIN sys.tables t ON t.object_id = c.object_id
WHERE t.name = %s AND c.name = %s
""",
        (table, column),
    )
    if cur.fetchone():
        return
    exec_sql(cur, f"ALTER TABLE dbo.[{table}] ADD CONSTRAINT [{constraint_name}] DEFAULT ({default_expr}) FOR [{column}];")


def alter_column(cur, table: str, column: str, definition: str):
    exec_sql(cur, f"ALTER TABLE dbo.[{table}] ALTER COLUMN [{column}] {definition};")


def max_plus_one(cur, table: str, column: str) -> int:
    cur.execute(f"SELECT COALESCE(MAX([{column}]), 0) + 1 FROM dbo.[{table}]")
    return int(cur.fetchone()[0])


def ensure_column(cur, table: str, column: str, definition: str):
    cur.execute(
        """
SELECT 1
FROM sys.columns c
JOIN sys.tables t ON t.object_id = c.object_id
WHERE t.name = %s AND c.name = %s
""",
        (table, column),
    )
    if cur.fetchone():
        return
    exec_sql(cur, f"ALTER TABLE dbo.[{table}] ADD [{column}] {definition};")


def normalize_supporters(cur):
    ensure_sequence(cur, "dbo.Seq_Supporters", max_plus_one(cur, "Supporters", "SupporterId"))
    ensure_default(cur, "Supporters", "SupporterId", "DF_Supporters_SupporterId", "NEXT VALUE FOR dbo.Seq_Supporters")
    for col in [
        ("SupporterType", "nvarchar(max) NOT NULL"),
        ("DisplayName", "nvarchar(max) NOT NULL"),
        ("OrganizationName", "nvarchar(max) NULL"),
        ("FirstName", "nvarchar(max) NULL"),
        ("LastName", "nvarchar(max) NULL"),
        ("RelationshipType", "nvarchar(max) NOT NULL"),
        ("Region", "nvarchar(max) NULL"),
        ("Country", "nvarchar(max) NULL"),
        ("Email", "nvarchar(max) NULL"),
        ("Phone", "nvarchar(max) NULL"),
        ("Status", "nvarchar(max) NOT NULL"),
        ("AcquisitionChannel", "nvarchar(max) NULL"),
        ("CreatedAt", "nvarchar(max) NOT NULL"),
    ]:
        alter_column(cur, "Supporters", col[0], col[1])


def normalize_donations(cur):
    ensure_sequence(cur, "dbo.Seq_Donations", max_plus_one(cur, "Donations", "DonationId"))
    ensure_default(cur, "Donations", "DonationId", "DF_Donations_DonationId", "NEXT VALUE FOR dbo.Seq_Donations")
    for col in [
        ("DonationType", "nvarchar(max) NOT NULL"),
        ("ChannelSource", "nvarchar(max) NOT NULL"),
        ("CurrencyCode", "nvarchar(max) NULL"),
        ("ImpactUnit", "nvarchar(max) NULL"),
        ("CampaignName", "nvarchar(max) NULL"),
        ("Notes", "nvarchar(max) NULL"),
    ]:
        alter_column(cur, "Donations", col[0], col[1])
    alter_column(cur, "Donations", "IsRecurring", "bit NOT NULL")
    ensure_default(cur, "Donations", "IsRecurring", "DF_Donations_IsRecurring", "0")


def normalize_process_recordings(cur):
    ensure_sequence(cur, "dbo.Seq_ProcessRecordings", max_plus_one(cur, "ProcessRecordings", "RecordingId"))
    ensure_default(cur, "ProcessRecordings", "RecordingId", "DF_ProcessRecordings_RecordingId", "NEXT VALUE FOR dbo.Seq_ProcessRecordings")
    for col in [
        ("SocialWorker", "nvarchar(max) NOT NULL"),
        ("SessionType", "nvarchar(max) NOT NULL"),
        ("EmotionalStateObserved", "nvarchar(max) NOT NULL"),
        ("EmotionalStateEnd", "nvarchar(max) NULL"),
        ("SessionNarrative", "nvarchar(max) NULL"),
        ("InterventionsApplied", "nvarchar(max) NULL"),
        ("FollowUpActions", "nvarchar(max) NULL"),
        ("NotesRestricted", "nvarchar(max) NULL"),
    ]:
        alter_column(cur, "ProcessRecordings", col[0], col[1])
    for col in ["ProgressNoted", "ConcernsFlagged", "ReferralMade"]:
        alter_column(cur, "ProcessRecordings", col, "bit NOT NULL")
        ensure_default(cur, "ProcessRecordings", col, f"DF_ProcessRecordings_{col}", "0")


def normalize_home_visitations(cur):
    ensure_sequence(cur, "dbo.Seq_HomeVisitations", max_plus_one(cur, "HomeVisitations", "VisitationId"))
    ensure_default(cur, "HomeVisitations", "VisitationId", "DF_HomeVisitations_VisitationId", "NEXT VALUE FOR dbo.Seq_HomeVisitations")
    ensure_column(cur, "HomeVisitations", "CoordinationKind", "nvarchar(max) NOT NULL CONSTRAINT [DF_HomeVisitations_CoordinationKind] DEFAULT ('HomeVisit')")
    ensure_column(cur, "HomeVisitations", "VisitTime", "nvarchar(max) NULL")
    for col in [
        ("SocialWorker", "nvarchar(max) NOT NULL"),
        ("VisitType", "nvarchar(max) NOT NULL"),
        ("LocationVisited", "nvarchar(max) NULL"),
        ("FamilyMembersPresent", "nvarchar(max) NULL"),
        ("Purpose", "nvarchar(max) NULL"),
        ("Observations", "nvarchar(max) NULL"),
        ("FamilyCooperationLevel", "nvarchar(max) NULL"),
        ("FollowUpNotes", "nvarchar(max) NULL"),
        ("VisitOutcome", "nvarchar(max) NULL"),
    ]:
        alter_column(cur, "HomeVisitations", col[0], col[1])
    for col in ["SafetyConcernsNoted", "FollowUpNeeded"]:
        alter_column(cur, "HomeVisitations", col, "bit NOT NULL")
        ensure_default(cur, "HomeVisitations", col, f"DF_HomeVisitations_{col}", "0")


def normalize_residents(cur):
    ensure_sequence(cur, "dbo.Seq_Residents", max_plus_one(cur, "Residents", "ResidentId"))
    ensure_default(cur, "Residents", "ResidentId", "DF_Residents_ResidentId", "NEXT VALUE FOR dbo.Seq_Residents")
    for col in [
        ("CaseControlNo", "nvarchar(max) NOT NULL"),
        ("InternalCode", "nvarchar(max) NOT NULL"),
        ("CaseStatus", "nvarchar(max) NOT NULL"),
        ("Sex", "nvarchar(max) NOT NULL"),
        ("BirthStatus", "nvarchar(max) NULL"),
        ("PlaceOfBirth", "nvarchar(max) NULL"),
        ("Religion", "nvarchar(max) NULL"),
        ("CaseCategory", "nvarchar(max) NOT NULL"),
        ("PwdType", "nvarchar(max) NULL"),
        ("SpecialNeedsDiagnosis", "nvarchar(max) NULL"),
        ("AgeUponAdmission", "nvarchar(max) NULL"),
        ("PresentAge", "nvarchar(max) NULL"),
        ("LengthOfStay", "nvarchar(max) NULL"),
        ("ReferralSource", "nvarchar(max) NULL"),
        ("ReferringAgencyPerson", "nvarchar(max) NULL"),
        ("AssignedSocialWorker", "nvarchar(max) NULL"),
        ("InitialCaseAssessment", "nvarchar(max) NULL"),
        ("ReintegrationType", "nvarchar(max) NULL"),
        ("ReintegrationStatus", "nvarchar(max) NULL"),
        ("InitialRiskLevel", "nvarchar(max) NOT NULL"),
        ("CurrentRiskLevel", "nvarchar(max) NOT NULL"),
        ("NotesRestricted", "nvarchar(max) NULL"),
        ("CreatedAt", "nvarchar(max) NOT NULL"),
    ]:
        alter_column(cur, "Residents", col[0], col[1])
    for col in [
        "SubCatOrphaned", "SubCatTrafficked", "SubCatChildLabor", "SubCatPhysicalAbuse",
        "SubCatSexualAbuse", "SubCatOsaec", "SubCatCicl", "SubCatAtRisk",
        "SubCatStreetChild", "SubCatChildWithHiv", "IsPwd", "HasSpecialNeeds",
        "FamilyIs4ps", "FamilySoloParent", "FamilyIndigenous", "FamilyParentPwd", "FamilyInformalSettler",
    ]:
        alter_column(cur, "Residents", col, "bit NOT NULL")
        ensure_default(cur, "Residents", col, f"DF_Residents_{col}", "0")


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize the legacy Azure SQL schema in place.")
    parser.add_argument("--server", default=os.getenv("AZURE_SQL_SERVER", "intex-server.database.windows.net"))
    parser.add_argument("--database", default=os.getenv("AZURE_SQL_DATABASE", "Intex2026"))
    parser.add_argument("--user", default=os.getenv("AZURE_SQL_USER"))
    parser.add_argument("--password", default=os.getenv("AZURE_SQL_PASSWORD"))
    args = parser.parse_args()

    if not args.user or not args.password:
        print("Missing AZURE_SQL_USER or AZURE_SQL_PASSWORD", file=sys.stderr)
        return 2

    conn = connect(args)
    cur = conn.cursor()
    try:
        normalize_supporters(cur)
        normalize_donations(cur)
        normalize_process_recordings(cur)
        normalize_home_visitations(cur)
        normalize_residents(cur)
        conn.commit()
        print("SCHEMA_NORMALIZATION_OK")
        return 0
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
