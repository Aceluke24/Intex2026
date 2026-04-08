using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Intex2026.Migrations.AppDb
{
    /// <inheritdoc />
    public partial class AddExpenseAndOrganizationalGoal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Expenses')
                BEGIN
                    CREATE TABLE [Expenses] (
                        [ExpenseId] int NOT NULL IDENTITY(1,1),
                        [SafehouseId] int NULL,
                        [ProgramArea] nvarchar(max) NOT NULL DEFAULT '',
                        [Category] nvarchar(max) NOT NULL DEFAULT '',
                        [Amount] decimal(18,2) NOT NULL DEFAULT 0,
                        [ExpenseDate] date NOT NULL,
                        [Description] nvarchar(max) NULL,
                        [RecordedBy] nvarchar(max) NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_Expenses] PRIMARY KEY ([ExpenseId]),
                        CONSTRAINT [FK_Expenses_Safehouses_SafehouseId] FOREIGN KEY ([SafehouseId])
                            REFERENCES [Safehouses] ([SafehouseId]) ON DELETE SET NULL
                    );
                    CREATE INDEX [IX_Expenses_SafehouseId] ON [Expenses] ([SafehouseId]);
                END
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OrganizationalGoals')
                BEGIN
                    CREATE TABLE [OrganizationalGoals] (
                        [GoalId] int NOT NULL IDENTITY(1,1),
                        [GoalCategory] nvarchar(max) NOT NULL DEFAULT '',
                        [SafehouseId] int NULL,
                        [TargetValue] decimal(18,2) NOT NULL DEFAULT 0,
                        [PeriodStart] date NOT NULL,
                        [PeriodEnd] date NOT NULL,
                        [Description] nvarchar(max) NULL,
                        [CreatedBy] nvarchar(max) NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_OrganizationalGoals] PRIMARY KEY ([GoalId]),
                        CONSTRAINT [FK_OrganizationalGoals_Safehouses_SafehouseId] FOREIGN KEY ([SafehouseId])
                            REFERENCES [Safehouses] ([SafehouseId]) ON DELETE SET NULL
                    );
                    CREATE INDEX [IX_OrganizationalGoals_SafehouseId] ON [OrganizationalGoals] ([SafehouseId]);
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Expenses");
            migrationBuilder.DropTable(name: "OrganizationalGoals");
        }
    }
}
