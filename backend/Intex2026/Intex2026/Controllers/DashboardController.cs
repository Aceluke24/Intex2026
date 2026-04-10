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
            var canConnect = await _db.Database.CanConnectAsync(ct);
            if (!canConnect)
            {
                _logger.LogError("Dashboard database connectivity check failed.");
                return Problem(
                    title: "Dashboard data unavailable",
                    detail: "Database connection check failed for dashboard queries.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            var isAuthenticated = User.Identity?.IsAuthenticated == true;
            var cacheKey = $"dashboard:command-center:v3:auth:{isAuthenticated}";
            var payload = await _cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = DashboardCacheTtl;
                var today = DateOnly.FromDateTime(DateTime.Today);
                var monthStart = new DateOnly(today.Year, today.Month, 1);
                var nextMonthStart = monthStart.AddMonths(1);

                var hasResidentsTask = _db.Residents.AsNoTracking().AnyAsync(ct);
                var hasVisitsTask = _db.HomeVisitations.AsNoTracking().AnyAsync(ct);
                var hasSupportersTask = _db.Supporters.AsNoTracking().AnyAsync(ct);
                var hasDonationsTask = _db.Donations.AsNoTracking().AnyAsync(ct);
                var hasSafehousesTask = _db.Safehouses.AsNoTracking().AnyAsync(ct);
                var hasIncidentsTask = _db.IncidentReports.AsNoTracking().AnyAsync(ct);

                var residentRiskSummaryRawTask = _db.Residents.AsNoTracking()
                    .Where(r => r.CaseStatus == "Active")
                    .GroupBy(r => string.IsNullOrWhiteSpace(r.CurrentRiskLevel) ? "Unknown" : r.CurrentRiskLevel.Trim())
                    .Select(g => new RiskLevelCountDto(g.Key, g.Count()))
                    .ToListAsync(ct);

                var activeResidentsTask = _db.Residents.AsNoTracking()
                    .CountAsync(r => r.CaseStatus == "Active", ct);

                var upcomingVisitsTask = _db.HomeVisitations.AsNoTracking()
                    .CountAsync(v => v.VisitDate >= today, ct);

                var missedVisitsTask = _db.HomeVisitations.AsNoTracking()
                    .CountAsync(v => v.VisitDate < today && v.FollowUpNeeded, ct);

                var totalSupportersTask = _db.Supporters.AsNoTracking().CountAsync(ct);

                var activeDonorIdsTask = _db.Donations.AsNoTracking()
                    .Where(d => d.SupporterId.HasValue && d.DonationDate >= today.AddDays(-90))
                    .Select(d => d.SupporterId!.Value)
                    .Distinct()
                    .ToListAsync(ct);

                var monthMonetaryTask = _db.Donations.AsNoTracking()
                    .Where(d => d.DonationDate >= monthStart && d.DonationDate < nextMonthStart && d.DonationType == "Monetary")
                    .Select(d => d.Amount ?? 0m)
                    .DefaultIfEmpty(0m)
                    .SumAsync(ct);

                var monthNonMonetaryTask = _db.Donations.AsNoTracking()
                    .Where(d => d.DonationDate >= monthStart && d.DonationDate < nextMonthStart && d.DonationType != "Monetary")
                    .Select(d => d.EstimatedValue ?? 0m)
                    .DefaultIfEmpty(0m)
                    .SumAsync(ct);

                var safehouseCapacityAlertsTask = _db.Safehouses.AsNoTracking()
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

                var incidentAlertsTask = _db.IncidentReports.AsNoTracking()
                    .Where(i => !i.Resolved && i.Severity == "High")
                    .OrderByDescending(i => i.IncidentDate)
                    .Select(i => new IncidentAlertRowDto(
                        i.IncidentId,
                        i.ResidentId,
                        i.SafehouseId,
                        i.IncidentDate,
                        i.IncidentType,
                        i.Severity,
                        i.Description,
                        i.Resolved))
                    .Take(20)
                    .ToListAsync(ct);

                await Task.WhenAll(
                    hasResidentsTask,
                    hasVisitsTask,
                    hasSupportersTask,
                    hasDonationsTask,
                    hasSafehousesTask,
                    hasIncidentsTask,
                    residentRiskSummaryRawTask,
                    activeResidentsTask,
                    upcomingVisitsTask,
                    missedVisitsTask,
                    totalSupportersTask,
                    activeDonorIdsTask,
                    monthMonetaryTask,
                    monthNonMonetaryTask,
                    safehouseCapacityAlertsTask,
                    incidentAlertsTask);

                var riskSummary = NormalizeRiskBreakdown(
                    residentRiskSummaryRawTask.Result,
                    hasResidentsTask.Result);
                var highCriticalCount = riskSummary
                    .Where(x => x.Level is "High" or "Critical")
                    .Sum(x => x.Count);

                var totalSupporters = totalSupportersTask.Result;
                var activeDonors = activeDonorIdsTask.Result.Count;
                var lapsedDonors = Math.Max(0, totalSupporters - activeDonors);

                var monetaryThisMonth = monthMonetaryTask.Result;
                var nonMonetaryThisMonth = monthNonMonetaryTask.Result;
                var totalImpactThisMonth = monetaryThisMonth + nonMonetaryThisMonth;

                _logger.LogInformation(
                    "Dashboard query results: risk={RiskSummary}, upcomingVisits={UpcomingVisits}, missedVisits={MissedVisits}, supporters={TotalSupporters}, activeDonors90d={ActiveDonors90d}, lapsedDonors={LapsedDonors}, monthMonetary={MonthMonetary}, monthNonMonetary={MonthNonMonetary}, safehouseAlerts={SafehouseAlerts}, incidentAlerts={IncidentAlerts}",
                    string.Join(", ", riskSummary.Select(r => $"{r.Level}:{r.Count}")),
                    upcomingVisitsTask.Result,
                    missedVisitsTask.Result,
                    totalSupporters,
                    activeDonors,
                    lapsedDonors,
                    monetaryThisMonth,
                    nonMonetaryThisMonth,
                    safehouseCapacityAlertsTask.Result.Count,
                    incidentAlertsTask.Result.Count);

                return new DashboardCommandCenterDto(
                    new DashboardKpisDto(
                        new ResidentRiskSummaryDto(
                            activeResidentsTask.Result,
                            riskSummary,
                            highCriticalCount),
                        new VisitSummaryDto(
                            hasVisitsTask.Result ? upcomingVisitsTask.Result : 0,
                            hasVisitsTask.Result ? missedVisitsTask.Result : 0),
                        new DonorHealthSummaryDto(
                            hasSupportersTask.Result ? totalSupporters : 0,
                            hasSupportersTask.Result ? activeDonors : 0,
                            hasSupportersTask.Result ? lapsedDonors : 0),
                        new ImpactValueSummaryDto(
                            hasDonationsTask.Result ? totalImpactThisMonth : 0m,
                            hasDonationsTask.Result ? monetaryThisMonth : 0m,
                            hasDonationsTask.Result ? nonMonetaryThisMonth : 0m)),
                    new DashboardChartsDto(
                        new ResidentRiskBreakdownChartDto(riskSummary)),
                    new DashboardAlertsDto(
                        new SafehouseCapacitySummaryDto(
                            hasSafehousesTask.Result ? safehouseCapacityAlertsTask.Result.Count : 0,
                            hasSafehousesTask.Result ? safehouseCapacityAlertsTask.Result : new List<SafehouseCapacityRowDto>()),
                        hasIncidentsTask.Result ? incidentAlertsTask.Result : new List<IncidentAlertRowDto>()),
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

    private static List<RiskLevelCountDto> NormalizeRiskBreakdown(
        List<RiskLevelCountDto> raw,
        bool hasResidents)
    {
        if (!hasResidents)
        {
            return new List<RiskLevelCountDto>();
        }

        var index = raw
            .GroupBy(x => x.Level)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Count), StringComparer.OrdinalIgnoreCase);

        var canonicalLevels = new[] { "Low", "Medium", "High", "Critical", "Unknown" };

        return canonicalLevels
            .Select(level => new RiskLevelCountDto(level, index.TryGetValue(level, out var value) ? value : 0))
            .ToList();
    }

    private sealed record DashboardCommandCenterDto(
        DashboardKpisDto Kpis,
        DashboardChartsDto Charts,
        DashboardAlertsDto Alerts,
        DateTime GeneratedAtUtc,
        bool IsAuthenticated);

    private sealed record DashboardKpisDto(
        ResidentRiskSummaryDto ResidentRiskSummary,
        VisitSummaryDto Visits,
        DonorHealthSummaryDto DonorHealth,
        ImpactValueSummaryDto ImpactValue);

    private sealed record DashboardChartsDto(
        ResidentRiskBreakdownChartDto ResidentRiskBreakdown);

    private sealed record DashboardAlertsDto(
        SafehouseCapacitySummaryDto SafehouseCapacityAlert,
        List<IncidentAlertRowDto> IncidentAlerts);

    private sealed record RiskLevelCountDto(string Level, int Count);
    private sealed record ResidentRiskSummaryDto(int ActiveResidents, List<RiskLevelCountDto> ByRiskLevel, int HighCriticalCount);
    private sealed record VisitSummaryDto(int UpcomingVisits, int MissedVisits);
    private sealed record DonorHealthSummaryDto(int TotalSupporters, int ActiveDonors90Days, int LapsedDonors90Days);
    private sealed record ImpactValueSummaryDto(decimal TotalThisMonth, decimal MonetaryThisMonth, decimal NonMonetaryThisMonth);
    private sealed record ResidentRiskBreakdownChartDto(List<RiskLevelCountDto> Series);
    private sealed record SafehouseCapacityRowDto(int SafehouseId, string Name, int CurrentOccupancy, int CapacityGirls, double OccupancyRatio);
    private sealed record SafehouseCapacitySummaryDto(int NearCapacityCount, List<SafehouseCapacityRowDto> NearCapacity);
    private sealed record IncidentAlertRowDto(
        int IncidentId,
        int ResidentId,
        int SafehouseId,
        DateOnly IncidentDate,
        string IncidentType,
        string Severity,
        string? Description,
        bool Resolved);
}
