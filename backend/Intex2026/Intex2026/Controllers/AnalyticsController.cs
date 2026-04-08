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
    public AnalyticsController(
        IDonorAnalyticsService donorAnalytics,
        IResidentAnalyticsService residentAnalytics,
        ISocialAnalyticsService socialAnalytics,
        AppDbContext db)
    {
        _donorAnalytics = donorAnalytics;
        _residentAnalytics = residentAnalytics;
        _socialAnalytics = socialAnalytics;
        _db = db;
    }

    [HttpGet("donors")]
    public async Task<IActionResult> Donors(CancellationToken ct)
    {
        return Ok(await _donorAnalytics.GetAsync(ct));
    }

    [HttpGet("residents")]
    public async Task<IActionResult> Residents(CancellationToken ct)
    {
        return Ok(await _residentAnalytics.GetAsync(ct));
    }

    [HttpGet("social")]
    public async Task<IActionResult> Social(CancellationToken ct)
    {
        return Ok(await _socialAnalytics.GetAsync(ct));
    }

    [HttpGet("health")]
    public async Task<IActionResult> Health(CancellationToken ct)
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
