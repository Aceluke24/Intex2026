using Intex2026.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<DashboardController> _logger;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan DashboardCacheTtl = TimeSpan.FromSeconds(60);

    public DashboardController(AppDbContext db, ILogger<DashboardController> logger, IMemoryCache cache)
    {
        _db = db;
        _logger = logger;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        try
        {
            var now = DateTime.UtcNow;
            var thisMonth = new DateOnly(now.Year, now.Month, 1);
            Response.Headers.CacheControl = "public,max-age=60";

            var response = await _cache.GetOrCreateAsync("dashboard:summary:v2", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = DashboardCacheTtl;

                var totalResidentsTask = _db.Residents.AsNoTracking().CountAsync(ct);
                var activeResidentsTask = _db.Residents.AsNoTracking()
                    .CountAsync(r => r.CaseStatus == "Active", ct);
                var highRiskResidentsTask = _db.Residents.AsNoTracking()
                    .CountAsync(r => r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical", ct);
                var totalSupportersTask = _db.Supporters.AsNoTracking().CountAsync(ct);
                var totalIncidentsTask = _db.IncidentReports.AsNoTracking().CountAsync(ct);
                var totalSafehousesTask = _db.Safehouses.AsNoTracking().CountAsync(ct);
                var overCapacityTask = _db.Safehouses.AsNoTracking()
                    .CountAsync(s => s.CapacityGirls > 0 && (s.CurrentOccupancy * 10) >= (s.CapacityGirls * 9), ct);
                var monthlyAmountSumTask = _db.Donations.AsNoTracking()
                    .Where(d => d.DonationDate >= thisMonth)
                    .SumAsync(d => d.Amount ?? 0m, ct);
                var monthlyEstimatedSumTask = _db.Donations.AsNoTracking()
                    .Where(d => d.DonationDate >= thisMonth)
                    .SumAsync(d => d.EstimatedValue ?? 0m, ct);

                await Task.WhenAll(
                    totalResidentsTask,
                    activeResidentsTask,
                    highRiskResidentsTask,
                    totalSupportersTask,
                    totalIncidentsTask,
                    totalSafehousesTask,
                    overCapacityTask,
                    monthlyAmountSumTask,
                    monthlyEstimatedSumTask);

                return new DashboardSummaryDto(
                    true,
                    new DashboardOverviewDto(
                        totalResidentsTask.Result,
                        activeResidentsTask.Result,
                        totalSupportersTask.Result,
                        monthlyAmountSumTask.Result + monthlyEstimatedSumTask.Result,
                        totalIncidentsTask.Result),
                    new DashboardRiskDto(highRiskResidentsTask.Result),
                    new DashboardSafehouseDto(totalSafehousesTask.Result, overCapacityTask.Result));
            });

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
