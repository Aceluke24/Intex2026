using Intex2026.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    // GET /api/reports/donations — monthly donation totals grouped by month and type
    [HttpGet("donations")]
    public async Task<IActionResult> DonationTrends()
    {
        var data = await _db.Donations
            .Where(d => d.DonationType == "Monetary" && d.Amount.HasValue)
            .GroupBy(d => new { d.DonationDate.Year, d.DonationDate.Month })
            .Select(g => new
            {
                year = g.Key.Year,
                month = g.Key.Month,
                totalAmount = g.Sum(d => d.Amount ?? 0),
                count = g.Count()
            })
            .OrderBy(x => x.year).ThenBy(x => x.month)
            .ToListAsync();
        return Ok(data);
    }

    // GET /api/reports/residents — outcome metrics
    [HttpGet("residents")]
    public async Task<IActionResult> ResidentOutcomes()
    {
        var statusCounts = await _db.Residents
            .GroupBy(r => r.CaseStatus)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToListAsync();

        var riskCounts = await _db.Residents
            .GroupBy(r => r.CurrentRiskLevel)
            .Select(g => new { riskLevel = g.Key, count = g.Count() })
            .ToListAsync();

        var reintegrationCounts = await _db.Residents
            .Where(r => r.ReintegrationStatus != null)
            .GroupBy(r => r.ReintegrationStatus)
            .Select(g => new { reintegrationStatus = g.Key, count = g.Count() })
            .ToListAsync();

        return Ok(new { statusCounts, riskCounts, reintegrationCounts });
    }

    // GET /api/reports/safehouses — safehouse performance comparison
    [HttpGet("safehouses")]
    public async Task<IActionResult> SafehousePerformance()
    {
        var data = await _db.SafehouseMonthlyMetrics
            .Include(m => m.Safehouse)
            .GroupBy(m => new { m.SafehouseId, m.Safehouse!.Name })
            .Select(g => new
            {
                safehouseId = g.Key.SafehouseId,
                name = g.Key.Name,
                avgEducationProgress = g.Average(m => m.AvgEducationProgress),
                avgHealthScore = g.Average(m => m.AvgHealthScore),
                totalIncidents = g.Sum(m => m.IncidentCount),
                totalProcessRecordings = g.Sum(m => m.ProcessRecordingCount)
            })
            .ToListAsync();
        return Ok(data);
    }

    // GET /api/reports/reintegration — reintegration success rates
    [HttpGet("reintegration")]
    public async Task<IActionResult> ReintegrationRates()
    {
        var data = await _db.Residents
            .Where(r => r.ReintegrationType != null)
            .GroupBy(r => new { r.ReintegrationType, r.ReintegrationStatus })
            .Select(g => new
            {
                type = g.Key.ReintegrationType,
                status = g.Key.ReintegrationStatus,
                count = g.Count()
            })
            .ToListAsync();
        return Ok(data);
    }

    // GET /api/reports/campaigns — campaign effectiveness
    [HttpGet("campaigns")]
    public async Task<IActionResult> CampaignEffectiveness()
    {
        var data = await _db.Donations
            .Where(d => d.CampaignName != null && d.DonationType == "Monetary")
            .GroupBy(d => d.CampaignName)
            .Select(g => new
            {
                campaign = g.Key,
                totalAmount = g.Sum(d => d.Amount ?? 0),
                donorCount = g.Select(d => d.SupporterId).Distinct().Count(),
                donationCount = g.Count()
            })
            .OrderByDescending(x => x.totalAmount)
            .ToListAsync();
        return Ok(data);
    }
}
