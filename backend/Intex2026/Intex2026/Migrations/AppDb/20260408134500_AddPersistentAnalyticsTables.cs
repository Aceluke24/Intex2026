using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Intex2026.Migrations.AppDb
{
    public partial class AddPersistentAnalyticsTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DonorAnalytics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DonorId = table.Column<int>(type: "int", nullable: false),
                    RiskScore = table.Column<decimal>(type: "decimal(9,6)", nullable: false),
                    LifetimeValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonorAnalytics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ResidentAnalytics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ResidentId = table.Column<int>(type: "int", nullable: false),
                    ProgressScore = table.Column<decimal>(type: "decimal(9,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResidentAnalytics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SocialAnalytics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Platform = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    EngagementRate = table.Column<decimal>(type: "decimal(9,6)", nullable: false),
                    BestPostTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialAnalytics", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DonorAnalytics_DonorId",
                table: "DonorAnalytics",
                column: "DonorId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ResidentAnalytics_ResidentId",
                table: "ResidentAnalytics",
                column: "ResidentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SocialAnalytics_Platform",
                table: "SocialAnalytics",
                column: "Platform",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "DonorAnalytics");
            migrationBuilder.DropTable(name: "ResidentAnalytics");
            migrationBuilder.DropTable(name: "SocialAnalytics");
        }
    }
}
