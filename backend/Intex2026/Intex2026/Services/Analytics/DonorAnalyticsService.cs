using System.Globalization;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Services.Analytics;

public interface IDonorAnalyticsService
{
    Task<DonorAnalyticsDto> GetAsync(CancellationToken ct);
    Task<int> RecalculateAsync(CancellationToken ct);
}

public sealed class DonorAnalyticsService : IDonorAnalyticsService
{
    private readonly AppDbContext _db;
    public DonorAnalyticsService(AppDbContext db) => _db = db;

    public async Task<DonorAnalyticsDto> GetAsync(CancellationToken ct)
    {
        if (!await _db.DonorAnalytics.AsNoTracking().AnyAsync(ct))
        {
            await RecalculateAsync(ct);
        }

        var supporters = await _db.Supporters.AsNoTracking().ToDictionaryAsync(s => s.SupporterId, ct);
        var snapshots = await _db.DonorAnalytics.AsNoTracking().OrderByDescending(x => x.RiskScore).Take(40).ToListAsync(ct);
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
        foreach (var snap in snapshots)
        {
            if (!supporters.TryGetValue(snap.DonorId, out var supporter)) continue;
            var gifts = donationsBySupporter.GetValueOrDefault(supporter.SupporterId, new List<Donation>());
            var lastDonationDate = gifts.LastOrDefault()?.DonationDate;
            var daysSince = lastDonationDate.HasValue ? now.DayNumber - lastDonationDate.Value.DayNumber : 9999;
            var supporterAllocs = gifts.SelectMany(g => allocationsByDonation.GetValueOrDefault(g.DonationId, new List<DonationAllocation>())).ToList();
            var allocTotal = supporterAllocs.Sum(a => a.AmountAllocated);
            var totalValue = gifts.Sum(DonationMoneyValue);
            var allocationCompleteness = totalValue > 0 ? Math.Min(1.0, (double)(allocTotal / totalValue)) : 0.0;
            var impacted = supporterAllocs.Select(a => highRiskBySafehouse.GetValueOrDefault(a.SafehouseId)).Sum();

            rows.Add(new DonorInsightRowDto(
                supporter.SupporterId,
                supporter.DisplayName,
                ToDisplayStatus(snap.Status),
                (double)snap.RiskScore,
                (double)snap.LifetimeValue,
                daysSince,
                Math.Round(allocationCompleteness, 3),
                ToDisplayStatus(snap.Status) == "At Risk"
                    ? "Send stewardship update and re-engagement check-in."
                    : ToDisplayStatus(snap.Status) == "High Potential"
                        ? "Ask for recurring gift or campaign leadership support."
                        : "Share resident impact outcome and thank-you touchpoint.",
                impacted));
        }

        var retentionTrend = BuildDonorRetentionTrend(donations);
        var donationFrequency = rows.GroupBy(r => r.Status).Select(g => new DonationFrequencyDto(g.Key, g.Count())).OrderByDescending(x => x.Count).ToList();
        var impactSummary = $"Impact linkage: {rows.Sum(x => x.ImpactedHighRiskResidents)} high-risk resident allocations tied to currently scored supporters.";
        return new DonorAnalyticsDto(rows, retentionTrend, donationFrequency, impactSummary);
    }

    public async Task<int> RecalculateAsync(CancellationToken ct)
    {
        var supporters = await _db.Supporters.AsNoTracking().Where(s => s.Status == "Active").ToListAsync(ct);
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

        var rows = new List<DonorAnalytics>();
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

            var supporterAllocs = gifts.SelectMany(g => allocationsByDonation.GetValueOrDefault(g.DonationId, new List<DonationAllocation>())).ToList();
            var allocatedSum = supporterAllocs.Sum(a => a.AmountAllocated);
            var pctAllocated = totalValue > 0 ? Math.Min(1.0, (double)(allocatedSum / totalValue)) : 0.0;
            var fullySpecified = pctAllocated >= 0.95;
            var impactedHighRiskResidents = supporterAllocs.Select(a => highRiskBySafehouse.GetValueOrDefault(a.SafehouseId)).Sum();

            // Notebook-inspired scoring: recency + repeat history + non-monetary engagement + allocation completeness.
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

            _ = outreach;
            _ = impactedHighRiskResidents;
            _ = pctAllocated;
            _ = daysSinceLastDonation;
            rows.Add(new DonorAnalytics
            {
                DonorId = supporter.SupporterId,
                RiskScore = (decimal)Math.Round(riskScore, 6),
                LifetimeValue = (decimal)Math.Round(ltvEstimate, 2),
                Status = ToStoredStatus(status),
                LastUpdated = DateTime.UtcNow
            });
        }

        var existing = await _db.DonorAnalytics.ToDictionaryAsync(x => x.DonorId, ct);
        foreach (var row in rows)
        {
            if (existing.TryGetValue(row.DonorId, out var current))
            {
                current.RiskScore = row.RiskScore;
                current.LifetimeValue = row.LifetimeValue;
                current.Status = row.Status;
                current.LastUpdated = DateTime.UtcNow;
            }
            else
            {
                _db.DonorAnalytics.Add(row);
            }
        }

        var validIds = rows.Select(r => r.DonorId).ToHashSet();
        var stale = await _db.DonorAnalytics.Where(x => !validIds.Contains(x.DonorId)).ToListAsync(ct);
        if (stale.Count > 0) _db.DonorAnalytics.RemoveRange(stale);
        await _db.SaveChangesAsync(ct);

        return rows.Count;
    }

    private static List<RetentionTrendDto> BuildDonorRetentionTrend(List<Donation> donations)
    {
        var now = DateTime.UtcNow;
        var trend = new List<RetentionTrendDto>();
        for (var i = 5; i >= 0; i--)
        {
            var month = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            var prior = month.AddMonths(-1);
            var monthDonors = donations.Where(d => d.DonationDate.Year == month.Year && d.DonationDate.Month == month.Month).Select(d => d.SupporterId).ToHashSet();
            var priorDonors = donations.Where(d => d.DonationDate.Year == prior.Year && d.DonationDate.Month == prior.Month).Select(d => d.SupporterId).ToHashSet();
            var retained = priorDonors.Count == 0 ? 0 : monthDonors.Count(id => priorDonors.Contains(id));
            var rate = priorDonors.Count == 0 ? 0 : Math.Round(retained / (double)priorDonors.Count * 100, 1);
            trend.Add(new RetentionTrendDto(month.ToString("MMM", CultureInfo.CurrentCulture), rate));
        }
        return trend;
    }

    private static decimal DonationMoneyValue(Donation d)
        => d.DonationType == "Monetary" ? d.Amount ?? 0
            : d.DonationType == "InKind" ? d.EstimatedValue ?? d.Amount ?? 0
            : d.Amount ?? d.EstimatedValue ?? 0;

    private static string ToStoredStatus(string status) => status switch
    {
        "At Risk" => "AtRisk",
        "High Potential" => "HighPotential",
        _ => "Active"
    };

    private static string ToDisplayStatus(string status) => status switch
    {
        "AtRisk" => "At Risk",
        "HighPotential" => "High Potential",
        _ => "Active"
    };
}
