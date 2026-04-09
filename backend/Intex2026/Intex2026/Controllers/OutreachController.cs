using Intex2026.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/outreach")]
[Authorize(Roles = "Admin")]
public class OutreachController : ControllerBase
{
    private readonly AppDbContext _db;
    public OutreachController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? platform,
        [FromQuery] string? postType,
        [FromQuery] string? campaign,
        CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var posts = await LoadPostsAsync(ct);

        if (!string.IsNullOrWhiteSpace(platform))
            posts = posts.Where(p => p.Platform == platform).ToList();
        if (!string.IsNullOrWhiteSpace(postType))
            posts = posts.Where(p => p.PostType == postType).ToList();
        if (!string.IsNullOrWhiteSpace(campaign))
            posts = posts.Where(p => p.CampaignName == campaign).ToList();

        posts = posts.OrderByDescending(p => p.CreatedAt).ToList();

        // This-month filter (using CreatedAt date)
        var postsThisMonth = posts.Where(p =>
        {
            var d = DateOnly.FromDateTime(p.CreatedAt);
            return d >= monthStart && d <= monthEnd;
        }).ToList();

        // KPIs
        var totalReach = postsThisMonth.Sum(p => p.Reach);
        var avgEngagement = postsThisMonth.Count > 0
            ? Math.Round((double)postsThisMonth.Average(p => p.EngagementRate), 4)
            : 0.0;
        var donationReferrals = postsThisMonth.Sum(p => p.DonationReferrals);
        var estimatedDonationValue = postsThisMonth.Sum(p => p.EstimatedDonationValuePhp);

        // Engagement by platform (all time filtered by current query)
        var byPlatform = posts
            .GroupBy(p => p.Platform)
            .Select(g => new
            {
                Platform = g.Key,
                TotalReach = g.Sum(p => p.Reach),
                AvgEngagementRate = g.Count() > 0 ? Math.Round((double)g.Average(p => p.EngagementRate), 4) : 0.0,
                PostCount = g.Count(),
                TotalDonationReferrals = g.Sum(p => p.DonationReferrals),
                EstimatedDonationValue = g.Sum(p => p.EstimatedDonationValuePhp),
            })
            .OrderByDescending(x => x.TotalReach)
            .ToList();

        // Best post types
        var byPostType = posts
            .GroupBy(p => p.PostType)
            .Select(g => new
            {
                PostType = g.Key,
                TotalReach = g.Sum(p => p.Reach),
                AvgEngagementRate = g.Count() > 0 ? Math.Round((double)g.Average(p => p.EngagementRate), 4) : 0.0,
                EstimatedDonationValue = g.Sum(p => p.EstimatedDonationValuePhp),
                PostCount = g.Count(),
            })
            .OrderByDescending(x => x.TotalReach)
            .ToList();

        // Posts table (most recent 100)
        var postTable = posts.Take(100).Select(p => new
        {
            p.PostId,
            p.Platform,
            p.PostType,
            p.MediaType,
            Date = DateOnly.FromDateTime(p.CreatedAt),
            p.Reach,
            p.Likes,
            p.Comments,
            p.Shares,
            p.EngagementRate,
            p.DonationReferrals,
            p.EstimatedDonationValuePhp,
            p.CampaignName,
            p.IsBoosted,
            p.PostUrl,
        }).ToList();

        // Distinct filter options
        var platforms = posts.Select(p => p.Platform).Distinct().OrderBy(x => x).ToList();
        var postTypes = posts.Select(p => p.PostType).Distinct().OrderBy(x => x).ToList();
        var campaigns = posts.Where(p => !string.IsNullOrWhiteSpace(p.CampaignName))
            .Select(p => p.CampaignName!).Distinct().OrderBy(x => x).ToList();

        return Ok(new
        {
            kpis = new
            {
                totalReachThisMonth = totalReach,
                avgEngagementRateThisMonth = avgEngagement,
                donationReferralsThisMonth = donationReferrals,
                estimatedDonationValueThisMonth = estimatedDonationValue,
            },
            byPlatform,
            byPostType,
            posts = postTable,
            filterOptions = new { platforms, postTypes, campaigns },
        });
    }

    private async Task<List<PostSnapshot>> LoadPostsAsync(CancellationToken ct)
    {
        if (_db.Database.IsSqlServer())
        {
            return await _db.Database.SqlQueryRaw<PostSnapshot>("""
                SELECT
                    p.PostId,
                    p.Platform,
                    p.PostType,
                    p.MediaType,
                    p.CreatedAt,
                    p.Reach,
                    p.Likes,
                    p.Comments,
                    p.Shares,
                    p.EngagementRate,
                    p.DonationReferrals,
                    p.EstimatedDonationValuePhp,
                    p.CampaignName,
                    CAST(CASE WHEN ISNULL(p.IsBoosted, 0) = 0 THEN 0 ELSE 1 END AS bit) AS IsBoosted,
                    p.PostUrl
                FROM SocialMediaPosts p
                """)
                .ToListAsync(ct);
        }

        return await _db.SocialMediaPosts
            .AsNoTracking()
            .Select(p => new PostSnapshot
            {
                PostId = p.PostId,
                Platform = p.Platform,
                PostType = p.PostType,
                MediaType = p.MediaType,
                CreatedAt = p.CreatedAt,
                Reach = p.Reach,
                Likes = p.Likes,
                Comments = p.Comments,
                Shares = p.Shares,
                EngagementRate = p.EngagementRate,
                DonationReferrals = p.DonationReferrals,
                EstimatedDonationValuePhp = p.EstimatedDonationValuePhp,
                CampaignName = p.CampaignName,
                IsBoosted = p.IsBoosted,
                PostUrl = p.PostUrl,
            })
            .ToListAsync(ct);
    }

    private sealed class PostSnapshot
    {
        public int PostId { get; init; }
        public string Platform { get; init; } = string.Empty;
        public string PostType { get; init; } = string.Empty;
        public string? MediaType { get; init; }
        public DateTime CreatedAt { get; init; }
        public int Reach { get; init; }
        public int Likes { get; init; }
        public int Comments { get; init; }
        public int Shares { get; init; }
        public decimal EngagementRate { get; init; }
        public int DonationReferrals { get; init; }
        public decimal EstimatedDonationValuePhp { get; init; }
        public string? CampaignName { get; init; }
        public bool IsBoosted { get; init; }
        public string? PostUrl { get; init; }
    }
}
