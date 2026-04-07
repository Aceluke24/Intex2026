using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Intex2026.Migrations.AppDb
{
    /// <inheritdoc />
    public partial class VisitationsCoordinationKind : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoordinationKind",
                table: "HomeVisitations",
                type: "TEXT",
                nullable: false,
                defaultValue: "HomeVisit");

            migrationBuilder.AddColumn<string>(
                name: "VisitTime",
                table: "HomeVisitations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE HomeVisitations SET CoordinationKind = 'HomeVisit' WHERE CoordinationKind IS NULL OR CoordinationKind = '';

                INSERT INTO HomeVisitations (ResidentId, VisitDate, CoordinationKind, VisitTime, SocialWorker, VisitType, LocationVisited, FamilyMembersPresent, Purpose, Observations, FamilyCooperationLevel, SafetyConcernsNoted, FollowUpNeeded, FollowUpNotes, VisitOutcome)
                VALUES
                (1, '2026-02-01', 'CaseConference', '10:00 AM', 'SW-04', 'Routine Follow-Up', 'Conference Room A', NULL, 'MDT case conference', 'Reviewed safety, education, and permanency goals.', 'Cooperative', 0, 1, NULL, 'Favorable'),
                (1, '2026-02-20', 'CaseConference', '2:30 PM', 'SW-12', 'Initial Assessment', 'Virtual', NULL, 'Initial permanency conference', 'Stakeholder introductions and case overview.', 'Cooperative', 0, 0, NULL, 'Inconclusive'),
                (2, '2026-03-05', 'CaseConference', '9:00 AM', 'SW-07', 'Reintegration Assessment', 'Barangay Hall', NULL, 'Pre-discharge conference', 'Discussed transition supports.', 'Neutral', 1, 1, NULL, 'Needs Improvement');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM HomeVisitations
                WHERE CoordinationKind = 'CaseConference'
                  AND VisitDate IN ('2026-02-01', '2026-02-20', '2026-03-05');
                """);

            migrationBuilder.DropColumn(
                name: "CoordinationKind",
                table: "HomeVisitations");

            migrationBuilder.DropColumn(
                name: "VisitTime",
                table: "HomeVisitations");
        }
    }
}
