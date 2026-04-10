using System.Globalization;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(AppDbContext db, ILogger<DashboardController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        try
        {
            var activeResidents = await _db.Residents
                .AsNoTracking()
                .Where(r => r.CaseStatus == "Active")
                .ToListAsync(ct);

        var donations = await _db.Donations.AsNoTracking().ToListAsync(ct);
        var visitations = await _db.HomeVisitations.AsNoTracking().ToListAsync(ct);
        var recordings = await _db.ProcessRecordings.AsNoTracking().ToListAsync(ct);
        var safehouses = await _db.Safehouses.AsNoTracking().OrderBy(s => s.SafehouseCode).ToListAsync(ct);

        var houseById = safehouses.ToDictionary(s => s.SafehouseId, s => s.Name);

        var today = DateOnly.FromDateTime(DateTime.Today);
        var in14 = today.AddDays(14);
        var thisWeekEnd = today.AddDays(7);

        var upcomingVisits = visitations.Count(v =>
        {
            var vd = v.VisitDate;
            return vd >= today && vd <= in14;
        });

        var highRiskCount = activeResidents.Count(r =>
        {
            var x = (r.CurrentRiskLevel ?? "").Trim();
            return x is "High" or "Critical";
        });

        var lastSessionByResident = new Dictionary<int, DateOnly>();
        foreach (var rec in recordings)
        {
            if (!lastSessionByResident.TryGetValue(rec.ResidentId, out var cur) || rec.SessionDate > cur)
                lastSessionByResident[rec.ResidentId] = rec.SessionDate;
        }

        string FormatDisplayDate(DateOnly d) => d.ToString("MMM d, yyyy", CultureInfo.CurrentCulture);

        var residentsOverview = activeResidents
            .Take(6)
            .Select(r =>
            {
                var lastRec = lastSessionByResident.GetValueOrDefault(r.ResidentId);
                var last = lastRec != default ? lastRec : r.DateOfAdmission;
                return new ResidentRowDto(
                    string.IsNullOrWhiteSpace(r.InternalCode) ? r.CaseControlNo : r.InternalCode,
                    houseById.GetValueOrDefault(r.SafehouseId),
                    MapRiskToStatus(r.CurrentRiskLevel),
                    FormatDisplayDate(last));
            })
            .ToList();

        var activeTotal = activeResidents.Count;

        var donationSpark = new List<double>();
        var donationActivity = new List<DonationMonthDto>();
        var todayDate = DateTime.Today;
        for (var i = 5; i >= 0; i--)
        {
            var d = new DateTime(todayDate.Year, todayDate.Month, 1).AddMonths(-i);
            var key = $"{d.Year}-{d.Month:00}";
            var monthDonations = donations.Where(x => $"{x.DonationDate.Year}-{x.DonationDate.Month:00}" == key).ToList();
            var total = monthDonations.Sum(DonationMoneyValue);
            var donorIds = monthDonations.Select(x => x.SupporterId).ToHashSet();
            var priorMonth = d.AddMonths(-1);
            var priorKey = $"{priorMonth.Year}-{priorMonth.Month:00}";
            var priorDonations = donations.Where(x => $"{x.DonationDate.Year}-{x.DonationDate.Month:00}" == priorKey).ToList();
            var priorDonorIds = priorDonations.Select(x => x.SupporterId).ToHashSet();
            var returningDonors = donorIds.Count(id => priorDonorIds.Contains(id));
            var newDonors = Math.Max(0, donorIds.Count - returningDonors);
            donationActivity.Add(new DonationMonthDto(
                d.ToString("MMM", CultureInfo.CurrentCulture),
                (double)Math.Round(total, 2),
                newDonors,
                returningDonors));
            donationSpark.Add((double)total);
        }

        var curMonthKey = $"{todayDate.Year}-{todayDate.Month:00}";
        var priorMonthDate = todayDate.AddMonths(-1);
        var priorMonthKey = $"{priorMonthDate.Year}-{priorMonthDate.Month:00}";

        decimal SumMonth(string key) => donations
            .Where(x => $"{x.DonationDate.Year}-{x.DonationDate.Month:00}" == key)
            .Sum(DonationMoneyValue);

        var curSum = SumMonth(curMonthKey);
        var priorSum = SumMonth(priorMonthKey);
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

        var residentSpark = new List<double>();
        for (var i = 5; i >= 0; i--)
        {
            var d = new DateTime(todayDate.Year, todayDate.Month, 1).AddMonths(-i);
            var next = d.AddMonths(1);
            var dOnly = DateOnly.FromDateTime(d);
            var nextOnly = DateOnly.FromDateTime(next);
            var count = activeResidents.Count(r =>
            {
                var ad = r.DateOfAdmission;
                return ad >= dOnly && ad < nextOnly;
            });
            residentSpark.Add(count);
        }

        var donationCountsBySupporter = donations
            .Where(d => d.SupporterId.HasValue)
            .GroupBy(d => d.SupporterId!.Value)
            .ToDictionary(g => g.Key, g => g.Count());
        var repeatDonorCount = donationCountsBySupporter.Count(kv => kv.Value >= 2);
        var donorDen = donationCountsBySupporter.Count;
        double? retPct = donorDen > 0 ? Math.Round(repeatDonorCount / (double)donorDen * 100, 1) : null;

        var withReint = activeResidents.Where(r =>
            !string.IsNullOrWhiteSpace(r.ReintegrationStatus) && r.ReintegrationStatus != "Not Started").ToList();
        var completed = withReint.Count(r => r.ReintegrationStatus == "Completed");
        int? ratePct = withReint.Count > 0
            ? (int)Math.Round(completed / (double)withReint.Count * 100)
            : null;

        var visitsThisWeek = visitations.Count(v => v.VisitDate >= today && v.VisitDate <= thisWeekEnd);

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
            donationInsight = donations.Count == 0
                ? "No donations recorded yet — totals will appear as gifts are logged."
                : "Totals combine monetary gifts and estimated in-kind value by donation month.";
        }

        var activityItems = BuildActivityItems(recordings, visitations, donations, FormatDisplayDate);
        var priorityCallouts = BuildPriorityCallouts(highRiskCount, visitsThisWeek, curSum, priorSum, donations.Count);
        var insights = new List<string>
        {
            highRiskCount > 0
                ? $"{highRiskCount} active resident{(highRiskCount == 1 ? "" : "s")} {(highRiskCount == 1 ? "has" : "have")} High or Critical current risk."
                : "No active residents are currently marked High or Critical risk.",
            donations.Count > 0
                ? $"{FormatMoneyCompact(donations.Sum(DonationMoneyValue))} total value across {donations.Count} logged donation{(donations.Count == 1 ? "" : "s")}."
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
            withReint.Count > 0
                ? $"{completed} completed of {withReint.Count} with reintegration activity"
                : "No reintegration activity recorded",
            "neutral",
            "percent");

        var liveContext = new LiveContextDto(
            activeTotal,
            safehouses.Count,
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
            donations.Count);

            return Ok(new DashboardResponseDto(
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
                insights));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building dashboard payload");
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

    private static string FormatMoneyCompact(decimal n)
    {
        if (n >= 1_000_000) return $"${(double)n / 1_000_000:F1}M";
        if (n >= 1000) return $"${(double)n / 1000:F1}k";
        return $"${n:F0}";
    }

    private static List<AttentionItemDto> BuildActivityItems(
        List<ProcessRecording> recordings,
        List<HomeVisitation> visitations,
        List<Donation> donations,
        Func<DateOnly, string> formatDisplayDate)
    {
        var pool = new List<(long Ts, AttentionItemDto Item)>();
        foreach (var rec in recordings.Where(r => r.ConcernsFlagged))
        {
            pool.Add((rec.SessionDate.ToDateTime(TimeOnly.MinValue).Ticks,
                new AttentionItemDto(
                    $"rec-{rec.RecordingId}",
                    "Process recording flagged",
                    $"Resident #{rec.ResidentId} — {rec.SessionType} on {formatDisplayDate(rec.SessionDate)}",
                    "review")));
        }
        foreach (var v in visitations.Where(x => x.FollowUpNeeded))
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
                    $"{FormatMoneyCompact(DonationMoneyValue(d))} — {d.DonationType} on {formatDisplayDate(d.DonationDate)}",
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
        List<string> Insights);

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
}
