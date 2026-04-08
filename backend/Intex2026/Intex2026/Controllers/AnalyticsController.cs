using System.Globalization;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize(Roles = "Admin")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AnalyticsController(AppDbContext db) => _db = db;

    [HttpGet("donors")]
    public async Task<IActionResult> Donors(CancellationToken ct)
    {
        var supporters = await _db.Supporters
            .AsNoTracking()
            .Where(s => s.Status == "Active")
            .ToListAsync(ct);
        var donations = await _db.Donations.AsNoTracking().ToListAsync(ct);
        var allocations = await _db.DonationAllocations.AsNoTracking().ToListAsync(ct);
        var residents = await _db.Residents.AsNoTracking().ToListAsync(ct);

        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var donationsBySupporter = donations.GroupBy(d => d.SupporterId).ToDictionary(g => g.Key, g => g.OrderBy(x => x.DonationDate).ToList());
        var allocationsByDonation = allocations.GroupBy(a => a.DonationId).ToDictionary(g => g.Key, g => g.ToList());
        var highRiskBySafehouse = residents
            .Where(r => r.CaseStatus == "Active" && (r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical"))
            .GroupBy(r => r.SafehouseId)
            .ToDictionary(g => g.Key, g => g.Count());

        var rows = new List<DonorInsightRowDto>();
        foreach (var supporter in supporters)
        {
            var gifts = donationsBySupporter.GetValueOrDefault(supporter.SupporterId, new List<Donation>());
            if (gifts.Count == 0) continue;

            var lastDonation = gifts[^1].DonationDate;
            var daysSinceLastDonation = now.DayNumber - lastDonation.DayNumber;
            var donationCount = gifts.Count;
            var nonMonetaryCount = gifts.Count(g => g.DonationType != "Monetary");
            var totalValue = gifts.Sum(DonationMoneyValue);
            var firstCampaign = gifts.FirstOrDefault(g => !string.IsNullOrWhiteSpace(g.CampaignName))?.CampaignName ?? "Unknown";
            var recurringCount = gifts.Count(g => g.IsRecurring);

            var supporterAllocationRows = gifts
                .SelectMany(g => allocationsByDonation.GetValueOrDefault(g.DonationId, new List<DonationAllocation>()))
                .ToList();
            var allocatedSum = supporterAllocationRows.Sum(a => a.AmountAllocated);
            var pctAllocated = totalValue > 0 ? Math.Min(1.0, (double)(allocatedSum / totalValue)) : 0.0;
            var fullySpecified = pctAllocated >= 0.95;
            var affectedHighRiskResidents = supporterAllocationRows
                .Select(a => highRiskBySafehouse.GetValueOrDefault(a.SafehouseId))
                .Sum();

            var lapseRisk = Math.Clamp(daysSinceLastDonation / 365.0, 0.0, 1.0);
            var repeatProtection = Math.Min(0.30, (donationCount - 1) * 0.04);
            var engagementProtection = Math.Min(0.20, nonMonetaryCount * 0.05);
            var allocationProtection = fullySpecified ? 0.12 : pctAllocated * 0.08;
            var recurringProtection = recurringCount > 0 ? 0.10 : 0.0;
            var riskScore = Math.Clamp(0.15 + lapseRisk - repeatProtection - engagementProtection - allocationProtection - recurringProtection, 0.01, 0.99);

            var campaignLift = firstCampaign == "Unknown" ? 1.0 : 1.08;
            var ltvEstimate = Math.Round((double)(totalValue * (decimal)campaignLift), 2);
            var status = riskScore >= 0.70
                ? "At Risk"
                : (riskScore <= 0.35 && ltvEstimate >= 10000 ? "High Potential" : "Active");

            var outreach = status switch
            {
                "At Risk" => "Send stewardship update and re-engagement check-in.",
                "High Potential" => "Ask for recurring gift or campaign leadership support.",
                _ => "Share resident impact outcome and thank-you touchpoint."
            };

            rows.Add(new DonorInsightRowDto(
                supporter.SupporterId,
                supporter.DisplayName,
                status,
                Math.Round(riskScore, 3),
                ltvEstimate,
                daysSinceLastDonation,
                Math.Round(pctAllocated, 3),
                outreach,
                affectedHighRiskResidents));
        }

        var sortedRows = rows
            .OrderByDescending(r => r.RiskScore)
            .ThenByDescending(r => r.LtvEstimate)
            .Take(40)
            .ToList();

        var retentionTrend = BuildDonorRetentionTrend(donations);
        var donationFrequency = sortedRows
            .GroupBy(r => r.Status)
            .Select(g => new DonationFrequencyDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        return Ok(new DonorAnalyticsDto(
            sortedRows,
            retentionTrend,
            donationFrequency,
            $"Impact linkage: {sortedRows.Sum(x => x.ImpactedHighRiskResidents)} high-risk resident allocations tied to currently scored supporters."));
    }

    [HttpGet("residents")]
    public async Task<IActionResult> Residents(CancellationToken ct)
    {
        var residents = await _db.Residents.AsNoTracking().Where(r => r.CaseStatus == "Active").ToListAsync(ct);
        var recordings = await _db.ProcessRecordings.AsNoTracking().ToListAsync(ct);
        var visitations = await _db.HomeVisitations.AsNoTracking().ToListAsync(ct);
        var incidents = await _db.IncidentReports.AsNoTracking().ToListAsync(ct);

        var recByResident = recordings.GroupBy(r => r.ResidentId).ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.SessionDate).ToList());
        var visitsByResident = visitations.GroupBy(v => v.ResidentId).ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.VisitDate).ToList());
        var incidentsByResident = incidents.GroupBy(i => i.ResidentId).ToDictionary(g => g.Key, g => g.ToList());

        var rows = new List<ResidentInsightRowDto>();
        var timelinePool = new List<(DateOnly Date, ResidentTimelineEventDto Event)>();
        foreach (var resident in residents)
        {
            var recs = recByResident.GetValueOrDefault(resident.ResidentId, new List<ProcessRecording>());
            var visits = visitsByResident.GetValueOrDefault(resident.ResidentId, new List<HomeVisitation>());
            var incs = incidentsByResident.GetValueOrDefault(resident.ResidentId, new List<IncidentReport>());
            var unresolvedIncidents = incs.Count(i => !i.Resolved);
            var concerns = recs.Count(r => r.ConcernsFlagged);
            var progressNotes = recs.Count(r => r.ProgressNoted);
            var followupsNeeded = visits.Count(v => v.FollowUpNeeded || v.SafetyConcernsNoted);

            var baseScore = 55.0;
            if (resident.CurrentRiskLevel == "Low") baseScore += 20;
            else if (resident.CurrentRiskLevel == "Medium") baseScore += 8;
            else if (resident.CurrentRiskLevel == "High") baseScore -= 12;
            else if (resident.CurrentRiskLevel == "Critical") baseScore -= 22;

            baseScore += Math.Min(20, progressNotes * 3);
            baseScore -= Math.Min(22, concerns * 4);
            baseScore -= Math.Min(18, unresolvedIncidents * 5);
            baseScore -= Math.Min(12, followupsNeeded * 3);
            if (resident.ReintegrationStatus == "Completed") baseScore += 10;
            if (resident.ReintegrationStatus == "On Hold") baseScore -= 7;

            var progressScore = Math.Clamp(Math.Round(baseScore, 1), 0, 100);
            var status = progressScore switch
            {
                >= 72 => "Ready for Reintegration",
                >= 45 => "Improving",
                _ => "At Risk"
            };

            rows.Add(new ResidentInsightRowDto(
                resident.ResidentId,
                string.IsNullOrWhiteSpace(resident.InternalCode) ? resident.CaseControlNo : resident.InternalCode,
                status,
                progressScore,
                concerns,
                unresolvedIncidents));

            timelinePool.AddRange(recs.Take(3).Select(r => (r.SessionDate, new ResidentTimelineEventDto(
                resident.ResidentId,
                string.IsNullOrWhiteSpace(resident.InternalCode) ? resident.CaseControlNo : resident.InternalCode,
                r.SessionDate.ToString("MMM d, yyyy", CultureInfo.CurrentCulture),
                "Process Recording",
                r.ConcernsFlagged ? "Concern flagged in session." : "Session completed with notes."))));

            timelinePool.AddRange(visits.Take(2).Select(v => (v.VisitDate, new ResidentTimelineEventDto(
                resident.ResidentId,
                string.IsNullOrWhiteSpace(resident.InternalCode) ? resident.CaseControlNo : resident.InternalCode,
                v.VisitDate.ToString("MMM d, yyyy", CultureInfo.CurrentCulture),
                "Home Visit",
                v.FollowUpNeeded ? "Follow-up needed after visit." : "Visit completed."))));
        }

        var alerts = rows
            .Where(r => r.Status == "At Risk" || r.UnresolvedIncidents > 0)
            .OrderByDescending(r => r.UnresolvedIncidents)
            .ThenBy(r => r.ProgressScore)
            .Take(12)
            .ToList();

        var caseLifecycle = new CaseLifecycleDto(
            residents.Count,
            recordings.Count,
            visitations.Count,
            residents.Count(r => r.ReintegrationStatus == "Completed"));

        return Ok(new ResidentAnalyticsDto(
            rows.OrderBy(r => r.ProgressScore).ToList(),
            alerts,
            timelinePool.OrderByDescending(t => t.Date).Select(t => t.Event).Take(30).ToList(),
            caseLifecycle));
    }

    [HttpGet("social")]
    public async Task<IActionResult> Social(CancellationToken ct)
    {
        var posts = await _db.SocialMediaPosts.AsNoTracking().ToListAsync(ct);
        if (posts.Count == 0)
        {
            return Ok(new SocialAnalyticsDto(
                new List<BestPostingWindowDto>(),
                new List<ContentTypePerformanceDto>(),
                new List<PlatformPerformanceDto>(),
                new List<string>(),
                0));
        }

        static double EngagementPoints(SocialMediaPost p)
            => p.Likes + (p.Comments * 2.0) + (p.Shares * 3.0) + (p.ClickThroughs * 2.0) + p.Saves;

        var windows = posts
            .Where(p => p.PostHour.HasValue && !string.IsNullOrWhiteSpace(p.DayOfWeek))
            .GroupBy(p => new { p.DayOfWeek, Hour = p.PostHour!.Value })
            .Select(g => new BestPostingWindowDto(
                g.Key.DayOfWeek!,
                g.Key.Hour,
                Math.Round(g.Average(EngagementPoints), 2),
                Math.Round((double)g.Average(p => p.EstimatedDonationValuePhp), 2)))
            .OrderByDescending(x => x.EngagementScore)
            .Take(5)
            .ToList();

        var content = posts
            .GroupBy(p => p.PostType)
            .Select(g => new ContentTypePerformanceDto(
                g.Key,
                g.Count(),
                Math.Round(g.Average(EngagementPoints), 2),
                Math.Round((double)g.Sum(x => x.EstimatedDonationValuePhp), 2)))
            .OrderByDescending(x => x.AvgEngagementScore)
            .Take(6)
            .ToList();

        var platform = posts
            .GroupBy(p => p.Platform)
            .Select(g => new PlatformPerformanceDto(
                g.Key,
                g.Count(),
                Math.Round(g.Average(EngagementPoints), 2),
                Math.Round((double)g.Sum(x => x.EstimatedDonationValuePhp), 2),
                g.Sum(x => x.DonationReferrals)))
            .OrderByDescending(x => x.EstimatedDonationValue)
            .ToList();

        var corr = Pearson(
            posts.Select(EngagementPoints).ToArray(),
            posts.Select(p => (double)p.EstimatedDonationValuePhp).ToArray());

        var suggestions = new List<string>();
        foreach (var w in windows.Take(3))
        {
            var topType = content.FirstOrDefault();
            var phrase = topType is null
                ? $"Post on {w.DayOfWeek} around {w.Hour:00}:00 based on engagement history."
                : $"Post {topType.PostType} content on {w.DayOfWeek} around {w.Hour:00}:00.";
            suggestions.Add(phrase);
        }
        if (corr > 0.25) suggestions.Add("Engagement is positively correlated with donation value; prioritize CTA-driven posts.");
        else suggestions.Add("Engagement and donation value are weakly linked; test stronger donation calls-to-action.");

        return Ok(new SocialAnalyticsDto(windows, content, platform, suggestions, Math.Round(corr, 3)));
    }

    private static List<RetentionTrendDto> BuildDonorRetentionTrend(List<Donation> donations)
    {
        var now = DateTime.UtcNow;
        var trend = new List<RetentionTrendDto>();
        for (var i = 5; i >= 0; i--)
        {
            var month = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            var prior = month.AddMonths(-1);
            var monthDonors = donations
                .Where(d => d.DonationDate.Year == month.Year && d.DonationDate.Month == month.Month)
                .Select(d => d.SupporterId)
                .ToHashSet();
            var priorDonors = donations
                .Where(d => d.DonationDate.Year == prior.Year && d.DonationDate.Month == prior.Month)
                .Select(d => d.SupporterId)
                .ToHashSet();
            var retained = priorDonors.Count == 0 ? 0 : monthDonors.Count(id => priorDonors.Contains(id));
            var rate = priorDonors.Count == 0 ? 0 : Math.Round(retained / (double)priorDonors.Count * 100, 1);
            trend.Add(new RetentionTrendDto(month.ToString("MMM", CultureInfo.CurrentCulture), rate));
        }

        return trend;
    }

    private static decimal DonationMoneyValue(Donation d)
    {
        if (d.DonationType == "Monetary") return d.Amount ?? 0;
        if (d.DonationType == "InKind") return d.EstimatedValue ?? d.Amount ?? 0;
        return d.Amount ?? d.EstimatedValue ?? 0;
    }

    private static double Pearson(double[] xs, double[] ys)
    {
        if (xs.Length != ys.Length || xs.Length < 2) return 0;
        var xMean = xs.Average();
        var yMean = ys.Average();
        var numerator = 0.0;
        var xVar = 0.0;
        var yVar = 0.0;
        for (var i = 0; i < xs.Length; i++)
        {
            var dx = xs[i] - xMean;
            var dy = ys[i] - yMean;
            numerator += dx * dy;
            xVar += dx * dx;
            yVar += dy * dy;
        }
        if (xVar == 0 || yVar == 0) return 0;
        return numerator / Math.Sqrt(xVar * yVar);
    }

    private sealed record DonorAnalyticsDto(
        List<DonorInsightRowDto> Donors,
        List<RetentionTrendDto> RetentionTrend,
        List<DonationFrequencyDto> DonationFrequency,
        string ImpactSummary);

    private sealed record DonorInsightRowDto(
        int SupporterId,
        string DisplayName,
        string Status,
        double RiskScore,
        double LtvEstimate,
        int DaysSinceLastDonation,
        double AllocationCompleteness,
        string SuggestedAction,
        int ImpactedHighRiskResidents);

    private sealed record RetentionTrendDto(string Month, double RetentionRate);
    private sealed record DonationFrequencyDto(string Segment, int Count);

    private sealed record ResidentAnalyticsDto(
        List<ResidentInsightRowDto> Residents,
        List<ResidentInsightRowDto> Alerts,
        List<ResidentTimelineEventDto> Timeline,
        CaseLifecycleDto CaseLifecycle);

    private sealed record ResidentInsightRowDto(
        int ResidentId,
        string CaseCode,
        string Status,
        double ProgressScore,
        int ConcernsCount,
        int UnresolvedIncidents);

    private sealed record ResidentTimelineEventDto(
        int ResidentId,
        string CaseCode,
        string DateLabel,
        string EventType,
        string Summary);

    private sealed record CaseLifecycleDto(
        int ActiveIntake,
        int ProcessRecordings,
        int HomeVisits,
        int ReintegrationCompleted);

    private sealed record SocialAnalyticsDto(
        List<BestPostingWindowDto> BestPostingTimes,
        List<ContentTypePerformanceDto> BestContentTypes,
        List<PlatformPerformanceDto> PlatformPerformance,
        List<string> SuggestedNextPosts,
        double EngagementDonationCorrelation);

    private sealed record BestPostingWindowDto(string DayOfWeek, int Hour, double EngagementScore, double AvgDonationValue);

    private sealed record ContentTypePerformanceDto(string PostType, int Posts, double AvgEngagementScore, double TotalDonationValue);

    private sealed record PlatformPerformanceDto(string Platform, int Posts, double AvgEngagementScore, double EstimatedDonationValue, int DonationReferrals);
}
