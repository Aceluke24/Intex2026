using Intex2026.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;
    public PublicController(AppDbContext db) => _db = db;

    // GET /api/public/impact — latest published impact snapshots (donor-facing)
    [HttpGet("impact")]
    public async Task<IActionResult> Impact([FromQuery] int limit = 12)
    {
        var snapshots = await _db.PublicImpactSnapshots
            .Where(s => s.IsPublished)
            .OrderByDescending(s => s.SnapshotDate)
            .Take(limit)
            .ToListAsync();
        return Ok(snapshots);
    }

    // GET /api/public/stats — aggregate stats for landing page
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var totalResidents = await _db.Residents.CountAsync();
        var activeSafehouses = await _db.Safehouses.CountAsync(s => s.Status == "Active");
        var completedReintegrations = await _db.Residents.CountAsync(r => r.ReintegrationStatus == "Completed");
        var totalDonors = await _db.Supporters.CountAsync(s => s.Status == "Active");
        var totalMonetaryDonations = await _db.Donations
            .Where(d => d.DonationType == "Monetary" && d.Amount.HasValue)
            .SumAsync(d => d.Amount ?? 0);

        return Ok(new
        {
            activeResidents,
            totalResidents,
            activeSafehouses,
            completedReintegrations,
            totalDonors,
            totalMonetaryDonations
        });
    }

    // GET /api/public/safehouses — basic safehouse info (no sensitive data)
    [HttpGet("safehouses")]
    public async Task<IActionResult> Safehouses()
    {
        var data = await _db.Safehouses
            .Where(s => s.Status == "Active")
            .Select(s => new { s.SafehouseCode, s.Name, s.Region, s.City, s.CurrentOccupancy, s.CapacityGirls })
            .ToListAsync();
        return Ok(data);
    }
}
