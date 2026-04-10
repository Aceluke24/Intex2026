using Intex2026.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<DashboardController> _logger;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan DashboardCacheTtl = TimeSpan.FromSeconds(90);

    public DashboardController(AppDbContext db, ILogger<DashboardController> logger, IMemoryCache cache)
    {
        _db = db;
        _logger = logger;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        try
        {
            var isAuthenticated = User.Identity?.IsAuthenticated == true;
            var cacheKey = $"dashboard:command-center:v2:auth:{isAuthenticated}";
            var payload = await _cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = DashboardCacheTtl;
                var today = DateOnly.FromDateTime(DateTime.Today);
                var weekOut = today.AddDays(7);
                var monthStart = new DateOnly(today.Year, today.Month, 1);
                var nextMonthStart = monthStart.AddMonths(1);
                var priorMonthStart = monthStart.AddMonths(-1);
                var last30 = today.AddDays(-30);
                var last7 = today.AddDays(-7);
                var lastMonthSameDay = monthStart.AddMonths(-1);

                var riskSummaryTask = _db.Residents.AsNoTracking()
                    .Where(r => r.CaseStatus == "Active")
                    .GroupBy(r => (r.CurrentRiskLevel ?? "Unknown").Trim())
                    .Select(g => new RiskLevelCountDto(g.Key, g.Count()))
                    .ToListAsync(ct);

                var activeResidentsTask = _db.Residents.AsNoTracking()
                    .CountAsync(r => r.CaseStatus == "Active", ct);

                var upcomingVisitsTask = _db.HomeVisitations.AsNoTracking()
                    .CountAsync(v => v.VisitDate >= today && v.VisitDate <= weekOut, ct);

                var overdueVisitsTask = _db.HomeVisitations.AsNoTracking()
                    .CountAsync(v => v.VisitDate < today && v.FollowUpNeeded, ct);

                var supporterDonationCountsTask = _db.Donations.AsNoTracking()
                    .Where(d => d.SupporterId.HasValue)
                    .GroupBy(d => d.SupporterId!.Value)
                    .Select(g => g.Count())
                    .ToListAsync(ct);

                var activeDonors30Task = _db.Donations.AsNoTracking()
                    .Where(d => d.SupporterId.HasValue && d.DonationDate >= last30 && d.DonationDate <= today)
                    .Select(d => d.SupporterId!.Value)
                    .Distinct()
                    .CountAsync(ct);

                var donationsMonthTask = _db.Donations.AsNoTracking()
                    .Where(d => d.DonationDate >= monthStart && d.DonationDate < nextMonthStart)
                    .Select(d => new
                    {
                        d.DonationType,
                        Monetary = d.Amount ?? 0,
                        Value = d.DonationType == "Monetary"
                            ? (d.Amount ?? 0)
                            : d.DonationType == "InKind"
                                ? (d.EstimatedValue ?? d.Amount ?? 0)
                                : (d.Amount ?? d.EstimatedValue ?? 0)
                    })
                    .ToListAsync(ct);

                var nearCapacityTask = _db.Safehouses.AsNoTracking()
                    .Where(s => s.CapacityGirls > 0 && ((double)s.CurrentOccupancy / s.CapacityGirls) >= 0.9)
                    .OrderByDescending(s => (double)s.CurrentOccupancy / s.CapacityGirls)
                    .Select(s => new SafehouseCapacityRowDto(
                        s.SafehouseId,
                        s.Name,
                        s.CurrentOccupancy,
                        s.CapacityGirls,
                        Math.Round((double)s.CurrentOccupancy / s.CapacityGirls, 2)))
                    .Take(8)
                    .ToListAsync(ct);

                var incidents7Task = _db.IncidentReports.AsNoTracking()
                    .CountAsync(i => i.IncidentDate >= last7 && i.IncidentDate <= today, ct);

                var unresolvedIncidentsTask = _db.IncidentReports.AsNoTracking()
                    .CountAsync(i => !i.Resolved, ct);

                var incidentSeverityTask = _db.IncidentReports.AsNoTracking()
                    .GroupBy(i => (i.Severity ?? "Unknown").Trim())
                    .Select(g => new RiskLevelCountDto(g.Key, g.Count()))
                    .ToListAsync(ct);

                var interventionTotalsTask = _db.InterventionPlans.AsNoTracking()
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        Total = g.Count(),
                        InProgress = g.Count(x => x.Status == "In Progress"),
                        Achieved = g.Count(x => x.Status == "Achieved"),
                        Overdue = g.Count(x => x.TargetDate < today && x.Status != "Achieved")
                    })
                    .FirstOrDefaultAsync(ct);

                var wellbeingAvgTask = _db.HealthWellbeingRecords.AsNoTracking()
                    .Where(h => h.RecordDate >= last30 && h.RecordDate <= today)
                    .AverageAsync(h => (double?)h.GeneralHealthScore, ct);

                var educationAvgTask = _db.EducationRecords.AsNoTracking()
                    .Where(e => e.RecordDate >= last30 && e.RecordDate <= today)
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        AvgProgress = g.Average(x => (double?)x.ProgressPercent),
                        AvgAttendance = g.Average(x => (double?)x.AttendanceRate)
                    })
                    .FirstOrDefaultAsync(ct);

                var riskTransitionsTask = _db.Residents.AsNoTracking()
                    .CountAsync(r =>
                        r.CaseStatus == "Active" &&
                        (r.InitialRiskLevel == "High" || r.InitialRiskLevel == "Critical") &&
                        (r.CurrentRiskLevel == "Low" || r.CurrentRiskLevel == "Medium"), ct);

                var incidentsPriorTask = _db.IncidentReports.AsNoTracking()
                    .CountAsync(i => i.IncidentDate >= lastMonthSameDay && i.IncidentDate < monthStart, ct);

                var donationsPriorTask = _db.Donations.AsNoTracking()
                    .Where(d => d.DonationDate >= priorMonthStart && d.DonationDate < monthStart)
                    .Select(d => d.DonationType == "Monetary"
                        ? (d.Amount ?? 0)
                        : d.DonationType == "InKind"
                            ? (d.EstimatedValue ?? d.Amount ?? 0)
                            : (d.Amount ?? d.EstimatedValue ?? 0))
                    .SumAsync(ct);

                await Task.WhenAll(
                    riskSummaryTask,
                    activeResidentsTask,
                    upcomingVisitsTask,
                    overdueVisitsTask,
                    supporterDonationCountsTask,
                    activeDonors30Task,
                    donationsMonthTask,
                    nearCapacityTask,
                    incidents7Task,
                    unresolvedIncidentsTask,
                    incidentSeverityTask,
                    interventionTotalsTask,
                    wellbeingAvgTask,
                    educationAvgTask,
                    riskTransitionsTask,
                    incidentsPriorTask,
                    donationsPriorTask);

                var donationBySupporter = supporterDonationCountsTask.Result;
                var repeatDonorCount = donationBySupporter.Count(x => x >= 2);
                var donorBase = donationBySupporter.Count;
                var repeatRate = donorBase > 0 ? Math.Round(repeatDonorCount / (double)donorBase * 100, 1) : (double?)null;

                var monthDonations = donationsMonthTask.Result;
                var monetaryThisMonth = monthDonations
                    .Where(d => d.DonationType == "Monetary")
                    .Sum(x => x.Monetary);
                var inKindThisMonth = monthDonations
                    .Where(d => d.DonationType == "InKind")
                    .Sum(x => x.Value);
                var timeThisMonth = monthDonations
                    .Where(d => d.DonationType is "Time" or "Skills" or "SocialMedia")
                    .Sum(x => x.Value);
                var totalImpactThisMonth = monetaryThisMonth + inKindThisMonth + timeThisMonth;

                var intervention = interventionTotalsTask.Result;
                var totalPlans = intervention?.Total ?? 0;
                var inProgressPct = totalPlans > 0 ? Math.Round((intervention?.InProgress ?? 0) / (double)totalPlans * 100, 1) : 0;
                var achievedPct = totalPlans > 0 ? Math.Round((intervention?.Achieved ?? 0) / (double)totalPlans * 100, 1) : 0;

                var currentIncidents = incidents7Task.Result;
                var priorIncidents = incidentsPriorTask.Result;
                var incidentMom = priorIncidents > 0
                    ? Math.Round((currentIncidents - priorIncidents) / (double)priorIncidents * 100, 1)
                    : (double?)null;

                var donationCurrent = totalImpactThisMonth;
                var donationPrior = donationsPriorTask.Result;
                var donationMom = donationPrior > 0
                    ? Math.Round((double)((donationCurrent - donationPrior) / donationPrior * 100), 1)
                    : (double?)null;

                var insights = new List<string>
                {
                    $"{riskTransitionsTask.Result} residents moved to lower risk levels.",
                    $"{nearCapacityTask.Result.Count} safehouses are above 90% occupancy.",
                    incidentMom.HasValue
                        ? $"Incidents {(incidentMom.Value >= 0 ? "increased" : "decreased")} {Math.Abs(incidentMom.Value):F1}% vs prior period."
                        : "Insufficient prior incident baseline for trend.",
                    donationMom.HasValue
                        ? $"Total impact value {(donationMom.Value >= 0 ? "up" : "down")} {Math.Abs(donationMom.Value):F1}% MoM."
                        : "No prior-month donation baseline yet."
                };

                return new DashboardCommandCenterDto(
                    new DashboardKpisDto(
                        new ResidentRiskSummaryDto(
                            activeResidentsTask.Result,
                            riskSummaryTask.Result.OrderByDescending(x => x.Count).ToList(),
                            riskSummaryTask.Result
                                .Where(x => x.Level == "High" || x.Level == "Critical")
                                .Sum(x => x.Count)),
                        new VisitSummaryDto(upcomingVisitsTask.Result, overdueVisitsTask.Result),
                        new DonorHealthSummaryDto(
                            repeatRate,
                            repeatDonorCount,
                            donorBase,
                            activeDonors30Task.Result,
                            monthDonations.Sum(x => x.Value)),
                        new ImpactValueSummaryDto(totalImpactThisMonth, monetaryThisMonth, inKindThisMonth, timeThisMonth),
                        new SafehouseCapacitySummaryDto(nearCapacityTask.Result.Count, nearCapacityTask.Result),
                        new IncidentAlertSummaryDto(currentIncidents, unresolvedIncidentsTask.Result, incidentSeverityTask.Result),
                        new CaseProgressSummaryDto(inProgressPct, achievedPct, intervention?.Overdue ?? 0, totalPlans),
                        new WellbeingSummaryDto(
                            wellbeingAvgTask.Result,
                            wellbeingAvgTask.Result.HasValue && wellbeingAvgTask.Result.Value < 3.0),
                        new EducationSummaryDto(educationAvgTask.Result?.AvgProgress, educationAvgTask.Result?.AvgAttendance)),
                    insights,
                    DateTime.UtcNow,
                    isAuthenticated);
            });

            return Ok(payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Dashboard API error: {Message}", ex.Message);
            return Problem(
                title: "Dashboard data unavailable",
                detail: "Live dashboard data could not be loaded from the database.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private sealed record DashboardCommandCenterDto(
        DashboardKpisDto Kpis,
        List<string> Insights,
        DateTime GeneratedAtUtc,
        bool IsAuthenticated);

    private sealed record DashboardKpisDto(
        ResidentRiskSummaryDto ResidentRiskSummary,
        VisitSummaryDto Visits,
        DonorHealthSummaryDto DonorHealth,
        ImpactValueSummaryDto ImpactValue,
        SafehouseCapacitySummaryDto SafehouseCapacity,
        IncidentAlertSummaryDto Incidents,
        CaseProgressSummaryDto CaseProgress,
        WellbeingSummaryDto Wellbeing,
        EducationSummaryDto Education);

    private sealed record RiskLevelCountDto(string Level, int Count);
    private sealed record ResidentRiskSummaryDto(int ActiveResidents, List<RiskLevelCountDto> ByRiskLevel, int HighCriticalCount);
    private sealed record VisitSummaryDto(int Next7Days, int OverdueFollowUps);
    private sealed record DonorHealthSummaryDto(double? RepeatDonorRate, int RepeatDonors, int TotalDonors, int ActiveDonors30Days, decimal TotalThisMonth);
    private sealed record ImpactValueSummaryDto(decimal TotalThisMonth, decimal MonetaryThisMonth, decimal InKindThisMonth, decimal TimeThisMonth);
    private sealed record SafehouseCapacityRowDto(int SafehouseId, string Name, int CurrentOccupancy, int CapacityGirls, double OccupancyRatio);
    private sealed record SafehouseCapacitySummaryDto(int NearCapacityCount, List<SafehouseCapacityRowDto> NearCapacity);
    private sealed record IncidentAlertSummaryDto(int Last7Days, int UnresolvedCount, List<RiskLevelCountDto> SeverityBreakdown);
    private sealed record CaseProgressSummaryDto(double InProgressPercent, double AchievedPercent, int OverduePlans, int TotalPlans);
    private sealed record WellbeingSummaryDto(double? AvgGeneralHealthScore30Days, bool IsCritical);
    private sealed record EducationSummaryDto(double? AvgProgressPercent, double? AvgAttendanceRate);
}
