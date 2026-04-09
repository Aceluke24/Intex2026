using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Intex2026.Services.Analytics;
using Intex2026.Data;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IDonorAnalyticsService _donorAnalytics;
    private readonly IResidentAnalyticsService _residentAnalytics;
    private readonly ISocialAnalyticsService _socialAnalytics;
    private readonly AppDbContext _db;
    private readonly ILogger<AnalyticsController> _logger;
    public AnalyticsController(
        IDonorAnalyticsService donorAnalytics,
        IResidentAnalyticsService residentAnalytics,
        ISocialAnalyticsService socialAnalytics,
        AppDbContext db,
        ILogger<AnalyticsController> logger)
    {
        _donorAnalytics = donorAnalytics;
        _residentAnalytics = residentAnalytics;
        _socialAnalytics = socialAnalytics;
        _db = db;
        _logger = logger;
    }

    [HttpGet("donors")]
    public async Task<IActionResult> Donors(CancellationToken ct)
    {
        try
        {
            return Ok(await _donorAnalytics.GetAsync(ct));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unable to load donor analytics; returning empty payload.");
            return Ok(new DonorAnalyticsDto(
                new List<DonorInsightRowDto>(),
                new List<RetentionTrendDto>(),
                new List<DonationFrequencyDto>(),
                "No analytics yet. Donor pipeline data is unavailable."));
        }
    }

    [HttpGet("residents")]
    public async Task<IActionResult> Residents(CancellationToken ct)
    {
        try
        {
            return Ok(await _residentAnalytics.GetAsync(ct));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unable to load resident analytics; returning empty payload.");
            return Ok(new ResidentAnalyticsDto(
                new List<ResidentInsightRowDto>(),
                new List<ResidentInsightRowDto>(),
                new List<ResidentTimelineEventDto>(),
                new CaseLifecycleDto(0, 0, 0, 0)));
        }
    }

    [HttpGet("social")]
    public async Task<IActionResult> Social(CancellationToken ct)
    {
        try
        {
            return Ok(await _socialAnalytics.GetAsync(ct));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unable to load social analytics; returning empty payload.");
            return Ok(new SocialAnalyticsDto(
                new List<BestPostingWindowDto>(),
                new List<ContentTypePerformanceDto>(),
                new List<PlatformPerformanceDto>(),
                new List<string> { "No analytics yet. Social pipeline data is unavailable." },
                0));
        }
    }

    [HttpGet("health")]
    public async Task<IActionResult> Health(CancellationToken ct)
    {
        try
        {
            var donorCount = await _db.DonorAnalytics.AsNoTracking().CountAsync(ct);
            var residentCount = await _db.ResidentAnalytics.AsNoTracking().CountAsync(ct);
            var socialCount = await _db.SocialAnalytics.AsNoTracking().CountAsync(ct);
            var donorLast = await _db.DonorAnalytics.AsNoTracking().MaxAsync(x => (DateTime?)x.LastUpdated, ct);
            var residentLast = await _db.ResidentAnalytics.AsNoTracking().MaxAsync(x => (DateTime?)x.LastUpdated, ct);
            var socialLast = await _db.SocialAnalytics.AsNoTracking().MaxAsync(x => (DateTime?)x.LastUpdated, ct);
            var lastUpdated = new[] { donorLast, residentLast, socialLast }.Max();

            return Ok(new
            {
                donorCount,
                residentCount,
                socialCount,
                lastUpdated
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unable to load analytics health summary; returning zeros.");
            return Ok(new
            {
                donorCount = 0,
                residentCount = 0,
                socialCount = 0,
                lastUpdated = (DateTime?)null
            });
        }
    }

    [HttpPost("recalculate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Recalculate(CancellationToken ct)
    {
        var donorRows = await _donorAnalytics.RecalculateAsync(ct);
        var residentRows = await _residentAnalytics.RecalculateAsync(ct);
        var socialRows = await _socialAnalytics.RecalculateAsync(ct);
        return Ok(new
        {
            donorRows,
            residentRows,
            socialRows,
            recalculatedAtUtc = DateTime.UtcNow
        });
    }
}
