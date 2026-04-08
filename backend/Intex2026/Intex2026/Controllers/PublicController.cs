using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<PublicController> _logger;
    public PublicController(AppDbContext db, ILogger<PublicController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // GET /api/public/residents/count — public survivor count (landing)
    [HttpGet("residents/count")]
    public async Task<IActionResult> ResidentsCount()
    {
        try
        {
            var count = await _db.Residents
                .Select(r => r.ResidentId)
                .Distinct()
                .CountAsync();
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching resident count");
            return Problem(
                title: "Resident count unavailable",
                detail: "The resident count could not be loaded.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    // GET /api/public/impact/summary — headline impact stats
    [HttpGet("impact/summary")]
    public async Task<IActionResult> ImpactSummary()
    {
        try
        {
            var survivors = await _db.Residents.CountAsync();

            var totalDonations = await _db.Donations
                .Where(d => d.Amount != null)
                .SumAsync(d => d.Amount ?? 0);

            var activePrograms = await _db.PartnerAssignments
                .Select(p => p.ProgramArea)
                .Distinct()
                .CountAsync();

            var totalEdu = await _db.EducationRecords.CountAsync();
            var completed = await _db.EducationRecords
                .CountAsync(e => e.CompletionStatus == "Completed");

            var completionRate = totalEdu == 0 ? 0 : (int)(completed * 100.0 / totalEdu);

            return Ok(new
            {
                survivors,
                totalDonations,
                activePrograms,
                completionRate
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching impact summary");
            return Problem(
                title: "Impact summary unavailable",
                detail: "Impact summary data could not be loaded.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    // GET /api/public/impact/donations-trend — monthly donation totals for charts
    [HttpGet("impact/donations-trend")]
    public async Task<IActionResult> DonationsTrend()
    {
        try
        {
            var data = await _db.Donations
                .Where(d => d.Amount != null)
                .GroupBy(d => new { d.DonationDate.Year, d.DonationDate.Month })
                .Select(g => new
                {
                    year = g.Key.Year,
                    month = g.Key.Month,
                    total = g.Sum(x => x.Amount ?? 0)
                })
                .OrderBy(x => x.year)
                .ThenBy(x => x.month)
                .ToListAsync();

            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching donations trend");
            return Problem(
                title: "Donations trend unavailable",
                detail: "Donation trend data could not be loaded.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    // GET /api/public/impact/program-outcomes — rates for outcome bars
    [HttpGet("impact/program-outcomes")]
    public async Task<IActionResult> ProgramOutcomes()
    {
        try
        {
            var safehouseRows = await _db.Safehouses
                .Where(s => s.CapacityGirls > 0)
                .Select(s => new { s.CurrentOccupancy, s.CapacityGirls })
                .ToListAsync();

            double safeHousing = 0;
            if (safehouseRows.Count > 0)
            {
                safeHousing = safehouseRows.Average(s => (double)s.CurrentOccupancy / s.CapacityGirls) * 100.0;
            }

            var totalEdu = await _db.EducationRecords.CountAsync();
            var completedEdu = await _db.EducationRecords
                .CountAsync(e => e.CompletionStatus == "Completed");

            var educationRate = totalEdu == 0 ? 0 : completedEdu * 100.0 / totalEdu;

            var totalSessions = await _db.ProcessRecordings.CountAsync();
            var progress = await _db.ProcessRecordings
                .CountAsync(p => p.ProgressNoted);

            var counselingRate = totalSessions == 0 ? 0 : progress * 100.0 / totalSessions;

            var totalPlans = await _db.InterventionPlans.CountAsync();
            var achieved = await _db.InterventionPlans
                .CountAsync(p => p.Status == "Achieved");

            var planRate = totalPlans == 0 ? 0 : achieved * 100.0 / totalPlans;

            return Ok(new
            {
                safeHousing = Math.Round(safeHousing, 1),
                education = Math.Round(educationRate, 1),
                counseling = Math.Round(counselingRate, 1),
                interventionPlans = Math.Round(planRate, 1)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching program outcomes");
            return Problem(
                title: "Program outcomes unavailable",
                detail: "Program outcome data could not be loaded.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    // GET /api/public/impact/campaigns — grouped campaign totals
    [HttpGet("impact/campaigns")]
    public async Task<IActionResult> ImpactCampaigns()
    {
        try
        {
            var campaigns = await _db.Donations
                .Where(d => d.CampaignName != null && d.CampaignName != "")
                .GroupBy(d => d.CampaignName)
                .Select(g => new
                {
                    name = g.Key,
                    raised = g.Sum(x => x.Amount ?? 0),
                    goal = (g.Sum(x => x.Amount ?? 0)) * 1.25m,
                    daysLeft = 30
                })
                .ToListAsync();

            return Ok(campaigns);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching campaigns");
            return Problem(
                title: "Campaign data unavailable",
                detail: "Campaign data could not be loaded.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    // GET /api/public/impact/allocation — percentage breakdown by program area
    [HttpGet("impact/allocation")]
    public async Task<IActionResult> ImpactAllocation()
    {
        try
        {
            var total = await _db.DonationAllocations.SumAsync(x => x.AmountAllocated);

            if (total == 0)
            {
                return Ok(new { direct = 0, outreach = 0, operations = 0 });
            }

            var direct = await _db.DonationAllocations
                .Where(x => x.ProgramArea == "Education" || x.ProgramArea == "Wellbeing")
                .SumAsync(x => x.AmountAllocated);

            var outreach = await _db.DonationAllocations
                .Where(x => x.ProgramArea == "Outreach")
                .SumAsync(x => x.AmountAllocated);

            var ops = await _db.DonationAllocations
                .Where(x => x.ProgramArea == "Operations")
                .SumAsync(x => x.AmountAllocated);

            return Ok(new
            {
                direct = (int)(direct * 100 / total),
                outreach = (int)(outreach * 100 / total),
                operations = (int)(ops * 100 / total)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching allocation");
            return Problem(
                title: "Allocation data unavailable",
                detail: "Donation allocation data could not be loaded.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

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

    // GET /api/public/stats — aggregate stats for landing page (DB-sourced; no PII)
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var totalResidents = await _db.Residents.CountAsync();
        var totalSafehouses = await _db.Safehouses.CountAsync();
        var activeSafehouses = await _db.Safehouses.CountAsync(s => s.Status == "Active");
        var counselingSessionsCount = await _db.ProcessRecordings.CountAsync();
        // Reintegration completed per data model (ReintegrationStatus), not raw "status" string
        var completedReintegrations = await _db.Residents.CountAsync(r => r.ReintegrationStatus == "Completed");
        var totalDonors = await _db.Supporters.CountAsync(s => s.Status == "Active");
        var totalMonetaryDonations = await _db.Donations
            .Where(d => d.DonationType == "Monetary" && d.Amount.HasValue)
            .SumAsync(d => d.Amount ?? 0);

        var reintegrationRatePercent = totalResidents == 0
            ? 0
            : (int)Math.Round(completedReintegrations * 100.0 / totalResidents);

        return Ok(new
        {
            activeResidents,
            totalResidents,
            totalSafehouses,
            activeSafehouses,
            counselingSessionsCount,
            completedReintegrations,
            reintegrationRatePercent,
            totalDonors,
            totalMonetaryDonations
        });
    }

    // POST /api/public/donations — anonymous donation submission from the public donate page
    [HttpPost("donations")]
    public async Task<IActionResult> SubmitDonation([FromBody] PublicDonationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) ||
            string.IsNullOrWhiteSpace(req.FirstName) ||
            string.IsNullOrWhiteSpace(req.LastName))
        {
            return BadRequest(new { error = "First name, last name, and email are required." });
        }

        var donationType = req.DonationType ?? "Monetary";
        var validTypes = new[] { "Monetary", "InKind", "Time", "Skills", "SocialMedia" };
        if (!validTypes.Contains(donationType))
            return BadRequest(new { error = "Invalid donation type." });

        // Find or create supporter by email
        var supporter = await _db.Supporters
            .FirstOrDefaultAsync(s => s.Email == req.Email.Trim().ToLower());

        if (supporter == null)
        {
            supporter = new Supporter
            {
                SupporterType = donationType == "Monetary" ? "MonetaryDonor" : "InKindDonor",
                DisplayName = $"{req.FirstName.Trim()} {req.LastName.Trim()}",
                FirstName = req.FirstName.Trim(),
                LastName = req.LastName.Trim(),
                Email = req.Email.Trim().ToLower(),
                RelationshipType = "Local",
                Status = "Active",
                AcquisitionChannel = "Website",
                FirstDonationDate = DateOnly.FromDateTime(DateTime.UtcNow),
                CreatedAt = DateTime.UtcNow,
            };
            _db.Supporters.Add(supporter);
            await _db.SaveChangesAsync();
        }

        var donation = new Donation
        {
            SupporterId = supporter.SupporterId,
            DonationType = donationType,
            DonationDate = DateOnly.FromDateTime(DateTime.UtcNow),
            ChannelSource = "Website",
            Amount = donationType == "Monetary" ? req.Amount : null,
            EstimatedValue = donationType != "Monetary" ? req.EstimatedValue : null,
            CampaignName = req.CampaignName?.Trim(),
            Notes = req.Notes?.Trim(),
            IsRecurring = false,
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        return Ok(new { donationId = donation.DonationId, message = "Thank you for your contribution!" });
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

public class PublicDonationRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? DonationType { get; set; }
    public decimal? Amount { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? CampaignName { get; set; }
    public string? Notes { get; set; }
}
