using System.Globalization;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/programs-dashboard")]
[Authorize(Roles = "Admin")]
public class ProgramsDashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProgramsDashboardController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var residents = await _db.Residents.AsNoTracking().ToListAsync(ct);
        var recordings = await _db.ProcessRecordings.AsNoTracking().ToListAsync(ct);
        var visitations = await _db.HomeVisitations.AsNoTracking().ToListAsync(ct);
        var donations = await _db.Donations.AsNoTracking().ToListAsync(ct);
        var expenses = await _db.Expenses.AsNoTracking().ToListAsync(ct);
        var incidents = await LoadIncidentsAsync(ct);
        var safehouses = await _db.Safehouses.AsNoTracking().ToListAsync(ct);
        var healthRecords = await _db.HealthWellbeingRecords
            .AsNoTracking()
            .Select(h => new HealthRecordSnapshot
            {
                ResidentId = h.ResidentId,
                RecordDate = h.RecordDate,
                GeneralHealthScore = h.GeneralHealthScore,
            })
            .ToListAsync(ct);
        var educationRecords = await _db.EducationRecords.AsNoTracking().ToListAsync(ct);
        var goals = await _db.OrganizationalGoals.AsNoTracking().Include(g => g.Safehouse).ToListAsync(ct);

        // KPI cards
        var activeResidents = residents.Count(r => r.CaseStatus == "Active");
        var highRiskResidents = residents.Count(r =>
            r.CaseStatus == "Active" &&
            (r.CurrentRiskLevel ?? "").Trim() is "High" or "Critical");

        var withReint = residents.Where(r =>
            !string.IsNullOrWhiteSpace(r.ReintegrationStatus) && r.ReintegrationStatus != "Not Started").ToList();
        var completedReint = withReint.Count(r => r.ReintegrationStatus == "Completed");
        var reintegrationRate = withReint.Count > 0 ? Math.Round(completedReint / (double)withReint.Count * 100, 1) : 0.0;

        var sessionsThisMonth = recordings.Count(r => r.SessionDate >= monthStart && r.SessionDate <= monthEnd);
        var visitsThisMonth = visitations.Count(v => v.VisitDate >= monthStart && v.VisitDate <= monthEnd);

        // Goal progress: compute CurrentValue for each active goal
        var activeGoals = goals.Where(g => g.PeriodStart <= today && g.PeriodEnd >= today).ToList();
        var goalProgress = activeGoals.Select(g =>
        {
            var current = ComputeGoalCurrent(g, residents, recordings, visitations, donations, expenses, incidents, ct);
            return new
            {
                g.GoalId,
                g.GoalCategory,
                g.Description,
                SafehouseName = g.Safehouse?.Name,
                g.SafehouseId,
                g.TargetValue,
                CurrentValue = current,
                PercentComplete = g.TargetValue > 0 ? Math.Round(current / (double)g.TargetValue * 100, 1) : 0.0,
                g.PeriodStart,
                g.PeriodEnd,
            };
        }).ToList();

        // Safehouse comparison table
        var safehouseTable = safehouses.Where(s => s.Status == "Active").Select(s =>
        {
            var sResidents = residents.Where(r => r.SafehouseId == s.SafehouseId && r.CaseStatus == "Active").ToList();
            var latestHealth = healthRecords
                .Where(h => sResidents.Any(r => r.ResidentId == h.ResidentId))
                .GroupBy(h => h.ResidentId)
                .Select(g => g.OrderByDescending(h => h.RecordDate).First())
                .ToList();
            var avgHealth = latestHealth.Count > 0
                ? Math.Round((double)latestHealth.Average(h => h.GeneralHealthScore ?? 0), 2)
                : 0.0;

            var latestEdu = educationRecords
                .Where(e => sResidents.Any(r => r.ResidentId == e.ResidentId))
                .GroupBy(e => e.ResidentId)
                .Select(g => g.OrderByDescending(e => e.RecordDate).First())
                .ToList();
            var avgEdu = latestEdu.Count > 0
                ? Math.Round((double)latestEdu.Average(e => e.ProgressPercent ?? 0), 1)
                : 0.0;

            var incidentsMonth = incidents.Count(i => i.SafehouseId == s.SafehouseId && i.IncidentDate >= monthStart && i.IncidentDate <= monthEnd);
            var sessionsMonth = recordings.Count(r => sResidents.Any(res => res.ResidentId == r.ResidentId) && r.SessionDate >= monthStart && r.SessionDate <= monthEnd);

            return new
            {
                s.SafehouseId,
                s.Name,
                s.Region,
                ActiveResidents = sResidents.Count,
                s.CapacityGirls,
                AvgHealthScore = avgHealth,
                AvgEducationProgress = avgEdu,
                IncidentsThisMonth = incidentsMonth,
                SessionsThisMonth = sessionsMonth,
            };
        }).ToList();

        // Monthly admissions vs closures (last 12 months)
        var months = BuildMonths(today, 12);
        var monthlyAdmissions = months.Select(m => new
        {
            m.Label,
            Count = residents.Count(r => r.DateOfAdmission >= m.Start && r.DateOfAdmission <= m.End),
        }).ToList();
        var monthlyClosures = months.Select(m => new
        {
            m.Label,
            Count = residents.Count(r => r.DateClosed.HasValue && r.DateClosed.Value >= m.Start && r.DateClosed.Value <= m.End),
        }).ToList();

        // Reintegration funnel
        var reintegrationFunnel = new[]
        {
            new { Status = "Not Started", Count = residents.Count(r => r.ReintegrationStatus == "Not Started" || string.IsNullOrWhiteSpace(r.ReintegrationStatus)) },
            new { Status = "In Progress", Count = residents.Count(r => r.ReintegrationStatus == "In Progress") },
            new { Status = "On Hold", Count = residents.Count(r => r.ReintegrationStatus == "On Hold") },
            new { Status = "Completed", Count = residents.Count(r => r.ReintegrationStatus == "Completed") },
        };

        // Risk distribution (last 6 months)
        var riskMonths = BuildMonths(today, 6);
        var riskTrend = riskMonths.Select(m =>
        {
            // residents whose DateOfAdmission <= month end and (DateClosed is null or DateClosed >= month start)
            var active = residents.Where(r =>
                r.DateOfAdmission <= m.End &&
                (!r.DateClosed.HasValue || r.DateClosed.Value >= m.Start)).ToList();
            return new
            {
                m.Label,
                Low = active.Count(r => (r.CurrentRiskLevel ?? "").Trim() == "Low"),
                Medium = active.Count(r => (r.CurrentRiskLevel ?? "").Trim() == "Medium"),
                High = active.Count(r => (r.CurrentRiskLevel ?? "").Trim() == "High"),
                Critical = active.Count(r => (r.CurrentRiskLevel ?? "").Trim() == "Critical"),
            };
        }).ToList();

        // Unresolved incidents
        var unresolvedIncidents = incidents
            .Where(i => !i.Resolved)
            .OrderByDescending(i => i.Severity == "High" ? 2 : i.Severity == "Medium" ? 1 : 0)
            .ThenByDescending(i => i.IncidentDate)
            .Select(i => new
            {
                i.IncidentId,
                ResidentCode = i.ResidentCode ?? $"ID-{i.ResidentId}",
                i.SafehouseName,
                i.IncidentType,
                i.Severity,
                i.IncidentDate,
                i.FollowUpRequired,
                i.Description,
            })
            .Take(20)
            .ToList();

        return Ok(new
        {
            kpis = new
            {
                activeResidents,
                highRiskResidents,
                reintegrationRate,
                sessionsThisMonth,
                visitsThisMonth,
            },
            goalProgress,
            safehouseTable,
            monthlyAdmissions,
            monthlyClosures,
            reintegrationFunnel,
            riskTrend,
            unresolvedIncidents,
        });
    }

    [HttpPatch("incidents/{id:int}/resolve")]
    public async Task<IActionResult> ResolveIncident(int id, CancellationToken ct)
    {
        var incident = await _db.IncidentReports.FirstOrDefaultAsync(i => i.IncidentId == id, ct);
        if (incident == null)
            return NotFound();
        incident.Resolved = true;
        incident.ResolutionDate = DateOnly.FromDateTime(DateTime.Today);
        await _db.SaveChangesAsync(ct);
        return Ok(new { ok = true, incidentId = id });
    }

    private static double ComputeGoalCurrent(OrganizationalGoal g, List<Resident> residents,
        List<ProcessRecording> recordings, List<HomeVisitation> visitations, List<Donation> donations,
        List<Expense> expenses, List<IncidentSnapshot> incidents,
        CancellationToken _)
    {
        var normalizedCategory = NormalizeGoalCategory(g.GoalCategory);
        return normalizedCategory switch
        {
            "admissions" => residents.Count(r =>
                r.DateOfAdmission >= g.PeriodStart && r.DateOfAdmission <= g.PeriodEnd &&
                (!g.SafehouseId.HasValue || r.SafehouseId == g.SafehouseId)),
            "homevisits" => visitations.Count(v =>
                v.VisitDate >= g.PeriodStart && v.VisitDate <= g.PeriodEnd &&
                (!g.SafehouseId.HasValue || residents.Any(r => r.ResidentId == v.ResidentId && r.SafehouseId == g.SafehouseId))),
            "processrecordings" => recordings.Count(r =>
                r.SessionDate >= g.PeriodStart && r.SessionDate <= g.PeriodEnd &&
                (!g.SafehouseId.HasValue || residents.Any(res => res.ResidentId == r.ResidentId && res.SafehouseId == g.SafehouseId))),
            "reintegrations" => residents.Count(r =>
                r.ReintegrationStatus == "Completed" &&
                r.DateClosed.HasValue && r.DateClosed.Value >= g.PeriodStart && r.DateClosed.Value <= g.PeriodEnd &&
                (!g.SafehouseId.HasValue || r.SafehouseId == g.SafehouseId)),
            "incidentresolutions" => incidents.Count(i =>
                i.Resolved && i.ResolutionDate.HasValue && i.ResolutionDate.Value >= g.PeriodStart && i.ResolutionDate.Value <= g.PeriodEnd &&
                (!g.SafehouseId.HasValue || i.SafehouseId == g.SafehouseId)),
            "monetarydonations" => (double)donations
                .Where(d => d.DonationType == "Monetary" && d.DonationDate >= g.PeriodStart && d.DonationDate <= g.PeriodEnd)
                .Sum(d => d.Amount ?? 0),
            "expenses" => (double)expenses
                .Where(e => e.ExpenseDate >= g.PeriodStart && e.ExpenseDate <= g.PeriodEnd)
                .Sum(e => e.Amount),
            _ => 0,
        };
    }

    private static string NormalizeGoalCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return string.Empty;

        return new string(category
            .Where(ch => !char.IsWhiteSpace(ch) && ch != '_' && ch != '-')
            .ToArray())
            .ToLowerInvariant();
    }

    private static List<(string Label, DateOnly Start, DateOnly End)> BuildMonths(DateOnly today, int count)
    {
        var result = new List<(string, DateOnly, DateOnly)>();
        for (var i = count - 1; i >= 0; i--)
        {
            var d = today.AddMonths(-i);
            var start = new DateOnly(d.Year, d.Month, 1);
            var end = start.AddMonths(1).AddDays(-1);
            var label = start.ToString("MMM yyyy", CultureInfo.InvariantCulture);
            result.Add((label, start, end));
        }
        return result;
    }

    private async Task<List<IncidentSnapshot>> LoadIncidentsAsync(CancellationToken ct)
    {
        if (_db.Database.IsSqlServer())
        {
            var sqlRows = await _db.Database.SqlQueryRaw<IncidentSqlRow>("""
                SELECT
                    i.IncidentId,
                    i.ResidentId,
                    i.SafehouseId,
                    i.IncidentDate,
                    i.IncidentType,
                    i.Severity,
                    i.Description,
                    i.ResolutionDate,
                    CAST(CASE WHEN ISNULL(i.Resolved, 0) = 0 THEN 0 ELSE 1 END AS bit) AS Resolved,
                    CAST(CASE WHEN ISNULL(i.FollowUpRequired, 0) = 0 THEN 0 ELSE 1 END AS bit) AS FollowUpRequired,
                    r.InternalCode AS ResidentCode,
                    s.Name AS SafehouseName
                FROM IncidentReports i
                LEFT JOIN Residents r ON r.ResidentId = i.ResidentId
                LEFT JOIN Safehouses s ON s.SafehouseId = i.SafehouseId
                """)
                .ToListAsync(ct);

            return sqlRows.Select(row => new IncidentSnapshot
            {
                IncidentId = row.IncidentId,
                ResidentId = row.ResidentId,
                SafehouseId = row.SafehouseId,
                IncidentDate = row.IncidentDate,
                IncidentType = row.IncidentType,
                Severity = row.Severity,
                Description = row.Description,
                Resolved = row.Resolved,
                ResolutionDate = row.ResolutionDate,
                FollowUpRequired = row.FollowUpRequired,
                ResidentCode = row.ResidentCode,
                SafehouseName = row.SafehouseName,
            }).ToList();
        }

        return await _db.IncidentReports
            .AsNoTracking()
            .Include(i => i.Resident)
            .Include(i => i.Safehouse)
            .Select(i => new IncidentSnapshot
            {
                IncidentId = i.IncidentId,
                ResidentId = i.ResidentId,
                SafehouseId = i.SafehouseId,
                IncidentDate = i.IncidentDate,
                IncidentType = i.IncidentType,
                Severity = i.Severity,
                Description = i.Description,
                Resolved = i.Resolved,
                ResolutionDate = i.ResolutionDate,
                FollowUpRequired = i.FollowUpRequired,
                ResidentCode = i.Resident != null ? i.Resident.InternalCode : null,
                SafehouseName = i.Safehouse != null ? i.Safehouse.Name : null,
            })
            .ToListAsync(ct);
    }

    private sealed class IncidentSnapshot
    {
        public int IncidentId { get; init; }
        public int ResidentId { get; init; }
        public int SafehouseId { get; init; }
        public DateOnly IncidentDate { get; init; }
        public string IncidentType { get; init; } = string.Empty;
        public string Severity { get; init; } = string.Empty;
        public string? Description { get; init; }
        public bool Resolved { get; init; }
        public DateOnly? ResolutionDate { get; init; }
        public bool FollowUpRequired { get; init; }
        public string? ResidentCode { get; init; }
        public string? SafehouseName { get; init; }
    }

    private sealed class IncidentSqlRow
    {
        public int IncidentId { get; init; }
        public int ResidentId { get; init; }
        public int SafehouseId { get; init; }
        public DateOnly IncidentDate { get; init; }
        public string IncidentType { get; init; } = string.Empty;
        public string Severity { get; init; } = string.Empty;
        public string? Description { get; init; }
        public bool Resolved { get; init; }
        public DateOnly? ResolutionDate { get; init; }
        public bool FollowUpRequired { get; init; }
        public string? ResidentCode { get; init; }
        public string? SafehouseName { get; init; }
    }

    private sealed class HealthRecordSnapshot
    {
        public int ResidentId { get; init; }
        public DateOnly RecordDate { get; init; }
        public decimal? GeneralHealthScore { get; init; }
    }
}
