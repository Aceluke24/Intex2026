using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Intex2026.Migrations.AppDb
{
    /// <inheritdoc />
    public partial class HomeVisitationsVisitDateIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_HomeVisitations_VisitDate",
                table: "HomeVisitations",
                column: "VisitDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HomeVisitations_VisitDate",
                table: "HomeVisitations");
        }
    }
}
