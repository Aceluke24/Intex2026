using Intex2026.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

/// <summary>
/// AI/ML insights endpoints. Returns pre-computed or rule-based scores
/// while ML pipeline integration is in development.
/// </summary>
[ApiController]
[Route("api/insights")]
[Authorize(Roles = "Admin")]
public class InsightsController : ControllerBase
{
    private readonly AppDbContext _db;
    public InsightsController(AppDbContext db) => _db = db;

    // GET /api/insights/donor-churn
    // Returns a list of active donors with a churn risk score (0–1).
    // Score is rule-based: months since last donation / 12, capped at 1.
    // Replace with ML model output once pipeline is deployed.
    [HttpGet("donor-churn")]
    public async Task<IActionResult> DonorChurn()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var data = await _db.Supporters
            .Where(s => s.Status == "Active" && s.FirstDonationDate.HasValue)
            .Select(s => new
            {
                s.SupporterId,
                s.DisplayName,
                s.Email,
                s.SupporterType,
                lastDonation = _db.Donations
                    .Where(d => d.SupporterId == s.SupporterId)
                    .OrderByDescending(d => d.DonationDate)
                    .Select(d => (DateOnly?)d.DonationDate)
                    .FirstOrDefault()
            })
            .ToListAsync();

        var scored = data.Select(s => new
        {
            s.SupporterId,
            s.DisplayName,
            s.Email,
            s.SupporterType,
            lastDonationDate = s.lastDonation,
            churnRisk = s.lastDonation.HasValue
                ? Math.Min(1.0, (today.DayNumber - s.lastDonation.Value.DayNumber) / 365.0)
                : 1.0,
            riskCategory = s.lastDonation.HasValue
                ? (today.DayNumber - s.lastDonation.Value.DayNumber) switch
                {
                    <= 90 => "Low",
                    <= 180 => "Medium",
                    <= 365 => "High",
                    _ => "Critical"
                }
                : "Critical"
        })
        .OrderByDescending(s => s.churnRisk)
        .ToList();

        return Ok(scored);
    }

    // GET /api/insights/resident-risk
    // Returns active residents with their current risk level and key flags.
    [HttpGet("resident-risk")]
    public async Task<IActionResult> ResidentRisk()
    {
        var data = await _db.Residents
            .Where(r => r.CaseStatus == "Active")
            .Select(r => new
            {
                r.ResidentId,
                r.CaseControlNo,
                r.InternalCode,
                r.SafehouseId,
                r.CurrentRiskLevel,
                r.InitialRiskLevel,
                r.ReintegrationStatus,
                riskEscalated = r.CurrentRiskLevel != r.InitialRiskLevel &&
                    (r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical"),
                recentConcernsCount = _db.ProcessRecordings
                    .Where(p => p.ResidentId == r.ResidentId && p.ConcernsFlagged)
                    .Count(),
                openIncidents = _db.IncidentReports
                    .Where(i => i.ResidentId == r.ResidentId && !i.Resolved)
                    .Count()
            })
            .OrderBy(r => r.CurrentRiskLevel == "Critical" ? 0 :
                          r.CurrentRiskLevel == "High" ? 1 :
                          r.CurrentRiskLevel == "Medium" ? 2 : 3)
            .ToListAsync();

        return Ok(data);
    }
}
