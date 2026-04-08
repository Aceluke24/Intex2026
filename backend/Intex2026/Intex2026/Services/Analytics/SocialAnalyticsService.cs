using Intex2026.Data;
using Intex2026.Models;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Services.Analytics;

public interface ISocialAnalyticsService
{
    Task<SocialAnalyticsDto> GetAsync(CancellationToken ct);
    Task<int> RecalculateAsync(CancellationToken ct);
}

public sealed class SocialAnalyticsService : ISocialAnalyticsService
{
    private readonly AppDbContext _db;
    public SocialAnalyticsService(AppDbContext db) => _db = db;

    public async Task<SocialAnalyticsDto> GetAsync(CancellationToken ct)
    {
        if (!await _db.SocialAnalytics.AsNoTracking().AnyAsync(ct))
        {
            await RecalculateAsync(ct);
        }

        var persisted = await _db.SocialAnalytics.AsNoTracking().OrderByDescending(x => x.EngagementRate).ToListAsync(ct);
        var posts = await _db.SocialMediaPosts.AsNoTracking().ToListAsync(ct);
        if (posts.Count == 0 && persisted.Count == 0)
        {
            return new SocialAnalyticsDto(new List<BestPostingWindowDto>(), new List<ContentTypePerformanceDto>(), new List<PlatformPerformanceDto>(), new List<string> { "No analytics yet. Add social posts to generate recommendations." }, 0);
        }

        static double EngagementPoints(SocialMediaPost p) => p.Likes + (p.Comments * 2.0) + (p.Shares * 3.0) + (p.ClickThroughs * 2.0) + p.Saves;

        var windows = posts
            .Where(p => p.PostHour.HasValue && !string.IsNullOrWhiteSpace(p.DayOfWeek))
            .GroupBy(p => new { p.DayOfWeek, Hour = p.PostHour!.Value })
            .Select(g => new BestPostingWindowDto(g.Key.DayOfWeek!, g.Key.Hour, Math.Round(g.Average(EngagementPoints), 2), Math.Round((double)g.Average(p => p.EstimatedDonationValuePhp), 2)))
            .OrderByDescending(x => x.EngagementScore)
            .Take(5)
            .ToList();

        var content = posts
            .GroupBy(p => p.PostType)
            .Select(g => new ContentTypePerformanceDto(g.Key, g.Count(), Math.Round(g.Average(EngagementPoints), 2), Math.Round((double)g.Sum(x => x.EstimatedDonationValuePhp), 2)))
            .OrderByDescending(x => x.AvgEngagementScore)
            .Take(6)
            .ToList();

        var postGroupedPlatform = posts
            .GroupBy(p => p.Platform)
            .ToDictionary(g => g.Key, g => g.ToList());
        var platform = persisted
            .Select(p => new PlatformPerformanceDto(
                p.Platform,
                postGroupedPlatform.GetValueOrDefault(p.Platform, new List<SocialMediaPost>()).Count,
                Math.Round((double)p.EngagementRate, 2),
                Math.Round((double)postGroupedPlatform.GetValueOrDefault(p.Platform, new List<SocialMediaPost>()).Sum(x => x.EstimatedDonationValuePhp), 2),
                postGroupedPlatform.GetValueOrDefault(p.Platform, new List<SocialMediaPost>()).Sum(x => x.DonationReferrals)))
            .OrderByDescending(x => x.EstimatedDonationValue)
            .ToList();

        var corr = Pearson(posts.Select(EngagementPoints).ToArray(), posts.Select(p => (double)p.EstimatedDonationValuePhp).ToArray());
        var topType = content.FirstOrDefault()?.PostType ?? "ImpactStory";
        var suggestions = windows.Take(3).Select(w => $"Post {topType} content on {w.DayOfWeek} around {w.Hour:00}:00.").ToList();
        suggestions.Add(corr > 0.25
            ? "Engagement is positively correlated with donation value; prioritize CTA-driven posts."
            : "Engagement and donation value are weakly linked; test stronger donation calls-to-action.");

        return new SocialAnalyticsDto(windows, content, platform, suggestions, Math.Round(corr, 3));
    }

    public async Task<int> RecalculateAsync(CancellationToken ct)
    {
        var posts = await _db.SocialMediaPosts.AsNoTracking().ToListAsync(ct);
        if (posts.Count == 0)
        {
            _db.SocialAnalytics.RemoveRange(await _db.SocialAnalytics.ToListAsync(ct));
            await _db.SaveChangesAsync(ct);
            return 0;
        }

        var grouped = posts.GroupBy(p => p.Platform).ToList();
        var computed = grouped.Select(g =>
        {
            var top = g.OrderByDescending(x => x.EngagementRate).First();
            var bestTime = !string.IsNullOrWhiteSpace(top.DayOfWeek) && top.PostHour.HasValue
                ? $"{top.DayOfWeek} {top.PostHour:00}:00"
                : "Unknown";
            return new Models.SocialAnalytics
            {
                Platform = g.Key,
                EngagementRate = Math.Round(g.Average(x => x.EngagementRate), 6),
                BestPostTime = bestTime,
                LastUpdated = DateTime.UtcNow
            };
        }).ToList();

        var existing = await _db.SocialAnalytics.ToDictionaryAsync(x => x.Platform, ct);
        foreach (var row in computed)
        {
            if (existing.TryGetValue(row.Platform, out var cur))
            {
                cur.EngagementRate = row.EngagementRate;
                cur.BestPostTime = row.BestPostTime;
                cur.LastUpdated = DateTime.UtcNow;
            }
            else
            {
                _db.SocialAnalytics.Add(row);
            }
        }
        var validKeys = computed.Select(x => x.Platform).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var stale = await _db.SocialAnalytics.Where(x => !validKeys.Contains(x.Platform)).ToListAsync(ct);
        if (stale.Count > 0) _db.SocialAnalytics.RemoveRange(stale);
        await _db.SaveChangesAsync(ct);
        return computed.Count;
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
        return xVar == 0 || yVar == 0 ? 0 : numerator / Math.Sqrt(xVar * yVar);
    }
}
