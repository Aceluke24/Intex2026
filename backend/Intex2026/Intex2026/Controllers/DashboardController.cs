using System.Globalization;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
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
    private static readonly TimeSpan DashboardCacheTtl = TimeSpan.FromSeconds(60);

    private sealed record RecordingRow(int RecordingId, int ResidentId, string SessionType, DateOnly SessionDate);
    private sealed record VisitationRow(int VisitationId, int ResidentId, string VisitType, DateOnly VisitDate);
    private sealed record DonationRow(int DonationId, string DonationType, DateOnly DonationDate, decimal? Amount, decimal? EstimatedValue);

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
            if (!isAuthenticated)
            {
                _logger.LogWarning("No auth user, returning limited dashboard data.");
                var fallbackStats = await _cache.GetOrCreateAsync("dashboard:anon:stats:v1", async entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = DashboardCacheTtl;
                    return await BuildHighLevelStatsAsync(ct);
                });
                return Ok(new
                {
                    stats = fallbackStats,
                    isAuthenticated = false
                });
            }

            string FormatDisplayDate(DateOnly d) => d.ToString("MMM d, yyyy", CultureInfo.CurrentCulture);
            var cachedPayload = await _cache.GetOrCreateAsync("dashboard:auth:payload:v1", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = DashboardCacheTtl;

            var today = DateOnly.FromDateTime(DateTime.Today);
            var in14 = today.AddDays(14);
            var thisWeekEnd = today.AddDays(7);

            // Run independent aggregates in parallel. Avoid full-table materialization.
            var activeResidentsCountTask = _db.Residents.AsNoTracking()
                .Where(r => r.CaseStatus == "Active")
                .CountAsync(ct);

            var highRiskCountTask = _db.Residents.AsNoTracking()
                .Where(r => r.CaseStatus == "Active")
                .Where(r => (r.CurrentRiskLevel ?? "").Trim() == "High" || (r.CurrentRiskLevel ?? "").Trim() == "Critical")
                .CountAsync(ct);

            var upcomingVisits14Task = _db.HomeVisitations.AsNoTracking()
                .Where(v => v.VisitDate >= today && v.VisitDate <= in14)
                .CountAsync(ct);

            var visitsThisWeekTask = _db.HomeVisitations.AsNoTracking()
                .Where(v => v.VisitDate >= today && v.VisitDate <= thisWeekEnd)
                .CountAsync(ct);

            var donationTotalCountTask = _db.Donations.AsNoTracking().CountAsync(ct);

            var donationCountsBySupporterTask = _db.Donations.AsNoTracking()
                .Where(d => d.SupporterId.HasValue)
                .GroupBy(d => d.SupporterId!.Value)
                .Select(g => g.Count())
                .ToListAsync(ct);

            var safehouseCountTask = _db.Safehouses.AsNoTracking().CountAsync(ct);

            // Build a small "overview" list without loading all residents/safehouses.
            var residentsOverviewTask = (from r in _db.Residents.AsNoTracking()
                    join s in _db.Safehouses.AsNoTracking() on r.SafehouseId equals s.SafehouseId into sh
                    from s in sh.DefaultIfEmpty()
                    where r.CaseStatus == "Active"
                    orderby r.ResidentId descending
                    select new
                    {
                        r.ResidentId,
                        Code = string.IsNullOrWhiteSpace(r.InternalCode) ? r.CaseControlNo : r.InternalCode,
                        SafehouseName = s != null ? s.Name : null,
                        r.CurrentRiskLevel,
                        r.DateOfAdmission
                    })
                .Take(6)
                .ToListAsync(ct);

            var donationActivityTask = BuildDonationActivityAsync(ct);
            var donationSumsTask = BuildDonationSumsAsync(ct);
            var residentSparkTask = BuildResidentSparkAsync(ct);

            var reintegrationCountsTask = _db.Residents.AsNoTracking()
                .Where(r => r.CaseStatus == "Active")
                .Where(r => !string.IsNullOrWhiteSpace(r.ReintegrationStatus) && r.ReintegrationStatus != "Not Started")
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Completed = g.Count(r => r.ReintegrationStatus == "Completed")
                })
                .FirstOrDefaultAsync(ct);

            // Recent activity cards should be fast: only pull small slices.
            var flaggedRecordingsTask = _db.ProcessRecordings.AsNoTracking()
                .Where(r => r.ConcernsFlagged)
                .OrderByDescending(r => r.SessionDate)
                .Select(r => new RecordingRow(r.RecordingId, r.ResidentId, r.SessionType, r.SessionDate))
                .Take(5)
                .ToListAsync(ct);

            var followupVisitsTask = _db.HomeVisitations.AsNoTracking()
                .Where(v => v.FollowUpNeeded)
                .OrderByDescending(v => v.VisitDate)
                .Select(v => new VisitationRow(v.VisitationId, v.ResidentId, v.VisitType, v.VisitDate))
                .Take(5)
                .ToListAsync(ct);

            var latestDonationsTask = _db.Donations.AsNoTracking()
                .OrderByDescending(d => d.DonationDate)
                .Select(d => new DonationRow(d.DonationId, d.DonationType, d.DonationDate, d.Amount, d.EstimatedValue))
                .Take(5)
                .ToListAsync(ct);

            await Task.WhenAll(
                activeResidentsCountTask,
                highRiskCountTask,
                upcomingVisits14Task,
                visitsThisWeekTask,
                donationTotalCountTask,
                donationCountsBySupporterTask,
                safehouseCountTask,
                residentsOverviewTask,
                donationActivityTask,
                donationSumsTask,
                residentSparkTask,
                reintegrationCountsTask,
                flaggedRecordingsTask,
                followupVisitsTask,
                latestDonationsTask);

            var activeTotal = activeResidentsCountTask.Result;
            var highRiskCount = highRiskCountTask.Result;
            var upcomingVisits = upcomingVisits14Task.Result;
            var visitsThisWeek = visitsThisWeekTask.Result;
            var donationCount = donationTotalCountTask.Result;

            var donationCountsBySupporter = donationCountsBySupporterTask.Result;
            var repeatDonorCount = donationCountsBySupporter.Count(x => x >= 2);
            var donorDen = donationCountsBySupporter.Count;
            double? retPct = donorDen > 0 ? Math.Round(repeatDonorCount / (double)donorDen * 100, 1) : null;

            var reintegrationCounts = reintegrationCountsTask.Result;
            var withReintTotal = reintegrationCounts?.Total ?? 0;
            var completed = reintegrationCounts?.Completed ?? 0;
            int? ratePct = withReintTotal > 0 ? (int)Math.Round(completed / (double)withReintTotal * 100) : null;

            var donationSums = donationSumsTask.Result;
            var curSum = donationSums.CurSum;
            var priorSum = donationSums.PriorSum;
            var donationTrend = donationSums.DonationTrend;
            var donationTrendLabel = donationSums.DonationTrendLabel;
            var residentSpark = residentSparkTask.Result;

            var donationActivity = donationActivityTask.Result.Activity;
            var donationSpark = donationActivityTask.Result.Spark;

            var donationInsight = "";
            if (donationActivity.Count >= 2)
            {
                var a = donationActivity[^2];
                var b = donationActivity[^1];
                donationInsight =
                    $"Last month ({a.Month}) total was {FormatMoneyCompact((decimal)a.Total)} vs {FormatMoneyCompact((decimal)b.Total)} in {b.Month}.";
            }
            if (string.IsNullOrEmpty(donationInsight))
            {
                donationInsight = donationCount == 0
                    ? "No donations recorded yet — totals will appear as gifts are logged."
                    : "Totals combine monetary gifts and estimated in-kind value by donation month.";
            }

            // Fetch last-session dates only for the small set of residents in the overview list.
            var overviewRows = residentsOverviewTask.Result;
            var overviewResidentIds = overviewRows.Select(x => x.ResidentId).ToList();
            var lastSessionByResident = await _db.ProcessRecordings.AsNoTracking()
                .Where(r => overviewResidentIds.Contains(r.ResidentId))
                .GroupBy(r => r.ResidentId)
                .Select(g => new { ResidentId = g.Key, Last = g.Max(x => x.SessionDate) })
                .ToDictionaryAsync(x => x.ResidentId, x => x.Last, ct);

            var residentsOverview = overviewRows
                .Select(r =>
                {
                    var lastRec = lastSessionByResident.GetValueOrDefault(r.ResidentId);
                    var last = lastRec != default ? lastRec : r.DateOfAdmission;
                    return new ResidentRowDto(
                        r.Code,
                        r.SafehouseName,
                        MapRiskToStatus(r.CurrentRiskLevel),
                        FormatDisplayDate(last));
                })
                .ToList();

            var activityItems = BuildActivityItems(
                flaggedRecordingsTask.Result,
                followupVisitsTask.Result,
                latestDonationsTask.Result,
                FormatDisplayDate);

            var priorityCallouts = BuildPriorityCallouts(highRiskCount, visitsThisWeek, curSum, priorSum, donationCount);
            var insights = new List<string>
            {
                highRiskCount > 0
                    ? $"{highRiskCount} active resident{(highRiskCount == 1 ? "" : "s")} {(highRiskCount == 1 ? "has" : "have")} High or Critical current risk."
                    : "No active residents are currently marked High or Critical risk.",
                donationCount > 0
                    ? $"{FormatMoneyCompact(donationSums.AllTimeSum)} total value across {donationCount} logged donation{(donationCount == 1 ? "" : "s")}."
                    : "No donations logged yet — financial insights will populate as gifts are recorded."
            };

        var primaryMetric = new DashboardMetricDto(
            "residents",
            "Active residents",
            activeTotal.ToString(),
            "Current active census",
            "neutral",
            "users");

        var supportingMetrics = new List<DashboardMetricDto>
        {
            new("donations", "Donations this month", FormatMoneyCompact(curSum), donationTrendLabel, donationTrend, "heart"),
            new("retention", "Donor retention", retPct.HasValue ? $"{retPct:F1}%" : "—",
                donorDen > 0 ? $"{repeatDonorCount} repeat of {donorDen} donors" : "No donations yet",
                "neutral", "percent"),
            new("conferences", "Upcoming visits (14 days)", upcomingVisits.ToString(),
                "Home visitations on the calendar", upcomingVisits > 0 ? "up" : "neutral", "calendar")
        };

        var reintegrationMetric = new DashboardMetricDto(
            "reintegration",
            "Reintegration success rate",
            ratePct.HasValue ? $"{ratePct}%" : "—",
                withReintTotal > 0
                    ? $"{completed} completed of {withReintTotal} with reintegration activity"
                : "No reintegration activity recorded",
            "neutral",
            "percent");

        var liveContext = new LiveContextDto(
            activeTotal,
            safehouseCountTask.Result,
            FormatMoneyCompact(curSum),
            priorSum > 0
                ? (curSum >= priorSum ? "trending at or above last month" : "softening versus last month")
                : "building your baseline",
            retPct.HasValue
                ? $"{retPct:F1}% — {repeatDonorCount} repeat of {donorDen} donors"
                : "—");

        var snapshotMetrics = new SnapshotMetricsDto(
            activeTotal,
            highRiskCount,
            visitsThisWeek,
            FormatMoneyCompact(curSum),
            retPct,
                donationCount);

            var stats = await BuildHighLevelStatsAsync(ct);

                return new DashboardResponseDto(
                    primaryMetric,
                    supportingMetrics,
                    reintegrationMetric,
                    donationSpark,
                    residentSpark,
                    activityItems,
                    priorityCallouts,
                    liveContext,
                    snapshotMetrics,
                    donationActivity,
                    donationInsight,
                    residentsOverview,
                    insights,
                    stats,
                    true);
            });
            return Ok(cachedPayload);
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

    private static string MapRiskToStatus(string? level)
    {
        var l = (level ?? "").Trim();
        if (l == "Low") return "Stable";
        if (l is "High" or "Critical") return "At Risk";
        return "Progressing";
    }

    private static decimal DonationMoneyValue(Donation d)
    {
        if (d.DonationType == "Monetary") return d.Amount ?? 0;
        if (d.DonationType == "InKind") return d.EstimatedValue ?? d.Amount ?? 0;
        return d.Amount ?? d.EstimatedValue ?? 0;
    }

    private static decimal DonationMoneyValue(string donationType, decimal? amount, decimal? estimatedValue)
    {
        if (donationType == "Monetary") return amount ?? 0;
        if (donationType == "InKind") return estimatedValue ?? amount ?? 0;
        return amount ?? estimatedValue ?? 0;
    }

    private static string FormatMoneyCompact(decimal n)
    {
        if (n >= 1_000_000) return $"${(double)n / 1_000_000:F1}M";
        if (n >= 1000) return $"${(double)n / 1000:F1}k";
        return $"${n:F0}";
    }

    private static List<AttentionItemDto> BuildActivityItems(
        List<RecordingRow> recordings,
        List<VisitationRow> visitations,
        List<DonationRow> donations,
        Func<DateOnly, string> formatDisplayDate)
    {
        var pool = new List<(long Ts, AttentionItemDto Item)>();
        foreach (var rec in recordings)
        {
            pool.Add((rec.SessionDate.ToDateTime(TimeOnly.MinValue).Ticks,
                new AttentionItemDto(
                    $"rec-{rec.RecordingId}",
                    "Process recording flagged",
                    $"Resident #{rec.ResidentId} — {rec.SessionType} on {formatDisplayDate(rec.SessionDate)}",
                    "review")));
        }
        foreach (var v in visitations)
        {
            pool.Add((v.VisitDate.ToDateTime(TimeOnly.MinValue).Ticks,
                new AttentionItemDto(
                    $"vis-{v.VisitationId}",
                    "Follow-up needed — home visit",
                    $"{v.VisitType} on {formatDisplayDate(v.VisitDate)} (resident #{v.ResidentId})",
                    "soon")));
        }
        foreach (var d in donations)
        {
            pool.Add((d.DonationDate.ToDateTime(TimeOnly.MinValue).Ticks,
                new AttentionItemDto(
                    $"don-{d.DonationId}",
                    "Donation recorded",
                    $"{FormatMoneyCompact(DonationMoneyValue(d.DonationType, d.Amount, d.EstimatedValue))} — {d.DonationType} on {formatDisplayDate(d.DonationDate)}",
                    "review")));
        }
        pool.Sort((a, b) => b.Ts.CompareTo(a.Ts));
        var items = pool.Take(5).Select(x => x.Item).ToList();
        if (items.Count == 0)
        {
            items.Add(new AttentionItemDto(
                "empty",
                "No recent activity",
                "Add process recordings, visitations, or donations to see them here.",
                "review"));
        }
        return items;
    }

    private sealed record DonationSumsDto(decimal CurSum, decimal PriorSum, string DonationTrend, string DonationTrendLabel, decimal AllTimeSum);

    private async Task<DonationSumsDto> BuildDonationSumsAsync(CancellationToken ct)
    {
        var todayDate = DateTime.Today;
        var curStart = new DateOnly(todayDate.Year, todayDate.Month, 1);
        var nextStart = curStart.AddMonths(1);
        var priorStart = curStart.AddMonths(-1);

        var moneyExpr = _db.Donations.AsNoTracking().Select(d => new
        {
            d.DonationDate,
            Value =
                d.DonationType == "Monetary"
                    ? (d.Amount ?? 0)
                    : d.DonationType == "InKind"
                        ? (d.EstimatedValue ?? d.Amount ?? 0)
                        : (d.Amount ?? d.EstimatedValue ?? 0)
        });

        var sums = await moneyExpr
            .GroupBy(_ => 1)
            .Select(g => new
            {
                All = g.Sum(x => x.Value),
                Cur = g.Where(x => x.DonationDate >= curStart && x.DonationDate < nextStart).Sum(x => x.Value),
                Prior = g.Where(x => x.DonationDate >= priorStart && x.DonationDate < curStart).Sum(x => x.Value),
            })
            .FirstOrDefaultAsync(ct);

        var curSum = sums?.Cur ?? 0;
        var priorSum = sums?.Prior ?? 0;
        var allTimeSum = sums?.All ?? 0;

        var donationTrend = "neutral";
        var donationTrendLabel = "No prior month to compare";
        if (priorSum > 0)
        {
            var pct = (double)((curSum - priorSum) / priorSum * 100);
            donationTrend = pct >= 0 ? "up" : "down";
            donationTrendLabel = $"{(pct >= 0 ? "+" : "")}{pct:F1}% vs prior month";
        }
        else if (curSum > 0)
        {
            donationTrendLabel = "First gifts this period";
        }

        return new DonationSumsDto(curSum, priorSum, donationTrend, donationTrendLabel, allTimeSum);
    }

    private async Task<(List<DonationMonthDto> Activity, List<double> Spark)> BuildDonationActivityAsync(CancellationToken ct)
    {
        var todayDate = DateTime.Today;
        var start = new DateOnly(todayDate.Year, todayDate.Month, 1).AddMonths(-6); // include prior month for returning donor calc
        var end = new DateOnly(todayDate.Year, todayDate.Month, 1).AddMonths(1);

        var rows = await _db.Donations.AsNoTracking()
            .Where(d => d.DonationDate >= start && d.DonationDate < end)
            .Select(d => new
            {
                d.DonationDate,
                d.SupporterId,
                Value =
                    d.DonationType == "Monetary"
                        ? (d.Amount ?? 0)
                        : d.DonationType == "InKind"
                            ? (d.EstimatedValue ?? d.Amount ?? 0)
                            : (d.Amount ?? d.EstimatedValue ?? 0)
            })
            .ToListAsync(ct);

        var donationSpark = new List<double>();
        var donationActivity = new List<DonationMonthDto>();

        for (var i = 5; i >= 0; i--)
        {
            var monthStart = new DateTime(todayDate.Year, todayDate.Month, 1).AddMonths(-i);
            var monthKey = $"{monthStart.Year}-{monthStart.Month:00}";
            var priorMonth = monthStart.AddMonths(-1);
            var priorKey = $"{priorMonth.Year}-{priorMonth.Month:00}";

            var monthRows = rows.Where(x => $"{x.DonationDate.Year}-{x.DonationDate.Month:00}" == monthKey).ToList();
            var priorRows = rows.Where(x => $"{x.DonationDate.Year}-{x.DonationDate.Month:00}" == priorKey).ToList();

            var total = monthRows.Sum(x => x.Value);
            var donorIds = monthRows.Where(x => x.SupporterId.HasValue).Select(x => x.SupporterId!.Value).ToHashSet();
            var priorDonorIds = priorRows.Where(x => x.SupporterId.HasValue).Select(x => x.SupporterId!.Value).ToHashSet();

            var returningDonors = donorIds.Count(id => priorDonorIds.Contains(id));
            var newDonors = Math.Max(0, donorIds.Count - returningDonors);

            donationActivity.Add(new DonationMonthDto(
                monthStart.ToString("MMM", CultureInfo.CurrentCulture),
                (double)Math.Round(total, 2),
                newDonors,
                returningDonors));
            donationSpark.Add((double)total);
        }

        return (donationActivity, donationSpark);
    }

    private async Task<List<double>> BuildResidentSparkAsync(CancellationToken ct)
    {
        var todayDate = DateTime.Today;
        var start = new DateTime(todayDate.Year, todayDate.Month, 1).AddMonths(-5);
        var end = new DateTime(todayDate.Year, todayDate.Month, 1).AddMonths(1);
        var startOnly = DateOnly.FromDateTime(start);
        var endOnly = DateOnly.FromDateTime(end);

        var admissions = await _db.Residents.AsNoTracking()
            .Where(r => r.CaseStatus == "Active")
            .Where(r => r.DateOfAdmission >= startOnly && r.DateOfAdmission < endOnly)
            .Select(r => r.DateOfAdmission)
            .ToListAsync(ct);

        var spark = new List<double>();
        for (var i = 5; i >= 0; i--)
        {
            var mStart = new DateTime(todayDate.Year, todayDate.Month, 1).AddMonths(-i);
            var mEnd = mStart.AddMonths(1);
            var mStartOnly = DateOnly.FromDateTime(mStart);
            var mEndOnly = DateOnly.FromDateTime(mEnd);
            var count = admissions.Count(d => d >= mStartOnly && d < mEndOnly);
            spark.Add(count);
        }
        return spark;
    }

    private static List<PriorityCalloutDto> BuildPriorityCallouts(
        int highRiskCount,
        int visitsThisWeek,
        decimal curSum,
        decimal priorSum,
        int donationCount)
    {
        return new List<PriorityCalloutDto>
        {
            new(
                "p1",
                highRiskCount > 0
                    ? $"{highRiskCount} active {(highRiskCount == 1 ? "case is" : "cases are")} High or Critical risk"
                    : "No High/Critical risk cases in active census",
                highRiskCount > 0
                    ? "Prioritize safety planning and staffing touchpoints for these residents."
                    : "Continue routine monitoring for Medium and Low risk cases.",
                "left"),
            new(
                "p2",
                visitsThisWeek > 0
                    ? $"{visitsThisWeek} home visitation{(visitsThisWeek == 1 ? "" : "s")} in the next 7 days"
                    : "No home visitations scheduled in the next 7 days",
                visitsThisWeek > 0
                    ? "Confirm logistics and resident notifications for field visits."
                    : "Consider scheduling follow-ups where case plans require them.",
                "right"),
            new(
                "p3",
                curSum >= priorSum
                    ? "Donation volume is at or above the prior month"
                    : "Donation volume is below the prior month",
                donationCount > 0
                    ? $"{donationCount} donation record{(donationCount == 1 ? "" : "s")} on file — keep nurturing recurring supporters."
                    : "Log donations to see trends here.",
                "left")
        };
    }

    private sealed record DashboardResponseDto(
        DashboardMetricDto PrimaryMetric,
        List<DashboardMetricDto> SupportingMetrics,
        DashboardMetricDto ReintegrationMetric,
        List<double> DonationSpark,
        List<double> ResidentSpark,
        List<AttentionItemDto> ActivityItems,
        List<PriorityCalloutDto> PriorityCallouts,
        LiveContextDto LiveContext,
        SnapshotMetricsDto SnapshotMetrics,
        List<DonationMonthDto> DonationActivity,
        string DonationInsight,
        List<ResidentRowDto> ResidentsOverview,
        List<string> Insights,
        HighLevelStatsDto Stats,
        bool IsAuthenticated);

    private sealed record DashboardMetricDto(
        string Key,
        string Label,
        string Value,
        string TrendLabel,
        string Trend,
        string Icon);

    private sealed record DonationMonthDto(string Month, double Total, int NewDonors, int ReturningDonors);

    private sealed record AttentionItemDto(string Id, string Title, string Detail, string Severity);

    private sealed record PriorityCalloutDto(string Id, string Headline, string Supporting, string Align);

    private sealed record LiveContextDto(
        int ResidentCount,
        int SafehouseCount,
        string DonationMonthLabel,
        string DonationTrendPhrase,
        string RetentionLabel);

    private sealed record SnapshotMetricsDto(
        int ActiveResidents,
        int HighCriticalRiskCount,
        int UpcomingVisits7Days,
        string MonthlyDonations,
        double? RepeatDonorRate,
        int TotalDonationsCount);

    private sealed record ResidentRowDto(string Id, string? Safehouse, string Status, string LastSession);

    private sealed record HighLevelStatsDto(
        int TotalResidents,
        int ActiveCases,
        int HighRiskCases,
        decimal TotalDonationsThisMonth,
        int ActiveSafehouses,
        double? AvgHealthScore,
        double? AvgEducationProgress,
        int RecentIncidents);

    private async Task<HighLevelStatsDto> BuildHighLevelStatsAsync(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var nextMonthStart = monthStart.AddMonths(1);

        var totalResidentsTask = _db.Residents.AsNoTracking().CountAsync(ct);
        var activeCasesTask = _db.Residents.AsNoTracking().CountAsync(r => r.CaseStatus == "Active", ct);
        var highRiskCasesTask = _db.Residents.AsNoTracking()
            .CountAsync(r => r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical", ct);
        var totalDonationsTask = _db.Donations.AsNoTracking()
            .Where(d => d.DonationDate >= monthStart && d.DonationDate < nextMonthStart)
            .SumAsync(d =>
                d.DonationType == "Monetary"
                    ? (d.Amount ?? 0)
                    : d.DonationType == "InKind"
                        ? (d.EstimatedValue ?? d.Amount ?? 0)
                        : (d.Amount ?? d.EstimatedValue ?? 0), ct);
        var activeSafehousesTask = _db.Safehouses.AsNoTracking().CountAsync(s => s.Status == "Active", ct);
        var metricsTask = _db.SafehouseMonthlyMetrics.AsNoTracking()
            .Where(m => m.MonthStart == monthStart)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                AvgHealth = g.Average(x => (double?)x.AvgHealthScore),
                AvgEducation = g.Average(x => (double?)x.AvgEducationProgress)
            })
            .FirstOrDefaultAsync(ct);
        var recentIncidentsTask = _db.IncidentReports.AsNoTracking()
            .CountAsync(i => i.IncidentDate >= monthStart && i.IncidentDate < nextMonthStart, ct);

        await Task.WhenAll(
            totalResidentsTask,
            activeCasesTask,
            highRiskCasesTask,
            totalDonationsTask,
            activeSafehousesTask,
            metricsTask,
            recentIncidentsTask);

        return new HighLevelStatsDto(
            totalResidentsTask.Result,
            activeCasesTask.Result,
            highRiskCasesTask.Result,
            totalDonationsTask.Result,
            activeSafehousesTask.Result,
            metricsTask.Result?.AvgHealth,
            metricsTask.Result?.AvgEducation,
            recentIncidentsTask.Result);
    }
}
