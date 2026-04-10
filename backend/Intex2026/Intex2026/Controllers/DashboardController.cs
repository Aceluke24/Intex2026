using Intex2026.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/dashboard")]
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
            var residentsTask = _db.Residents.AsNoTracking().ToListAsync(ct);
            var donationsTask = _db.Donations.AsNoTracking().ToListAsync(ct);
            var supportersTask = _db.Supporters.AsNoTracking().ToListAsync(ct);
            var incidentsTask = _db.IncidentReports.AsNoTracking().ToListAsync(ct);
            var safehousesTask = _db.Safehouses.AsNoTracking().ToListAsync(ct);

            await Task.WhenAll(residentsTask, donationsTask, supportersTask, incidentsTask, safehousesTask);

            var residents = residentsTask.Result;
            var donations = donationsTask.Result;
            var supporters = supportersTask.Result;
            var incidents = incidentsTask.Result;
            var safehouses = safehousesTask.Result;

            var now = DateTime.UtcNow;
            var thisMonth = new DateOnly(now.Year, now.Month, 1);
            var highRiskLevels = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "High", "Critical" };

            var monthlyDonations = donations
                .Where(d => d.DonationDate >= thisMonth)
                .ToList();

            var totalDonationValue = monthlyDonations.Sum(d => d.Amount ?? d.EstimatedValue ?? 0m);

            var response = new DashboardSummaryDto(
                true,
                new DashboardOverviewDto(
                    residents.Count,
                    residents.Count(r => string.Equals(r.CaseStatus, "Active", StringComparison.OrdinalIgnoreCase)),
                    supporters.Count,
                    totalDonationValue,
                    incidents.Count),
                new DashboardRiskDto(
                    residents.Count(r =>
                        !string.IsNullOrWhiteSpace(r.CurrentRiskLevel) &&
                        highRiskLevels.Contains(r.CurrentRiskLevel.Trim()))),
                new DashboardSafehouseDto(
                    safehouses.Count,
                    safehouses.Count(s => s.CapacityGirls > 0 && s.CurrentOccupancy >= (int)Math.Ceiling(s.CapacityGirls * 0.9))));

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Dashboard error");
            return StatusCode(StatusCodes.Status500InternalServerError, new { success = false });
        }
    }
    private sealed record DashboardSummaryDto(
        bool Success,
        DashboardOverviewDto Overview,
        DashboardRiskDto Risk,
        DashboardSafehouseDto Safehouses);

    private sealed record DashboardOverviewDto(
        int TotalResidents,
        int ActiveResidents,
        int TotalSupporters,
        decimal TotalDonationsThisMonth,
        int TotalIncidents);

    private sealed record DashboardRiskDto(int HighRisk);
    private sealed record DashboardSafehouseDto(int Total, int OverCapacity);
}
