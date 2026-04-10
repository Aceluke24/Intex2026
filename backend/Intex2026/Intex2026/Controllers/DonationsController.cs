using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/donations")]
public class DonationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<DonationsController> _logger;
    public DonationsController(AppDbContext db, UserManager<ApplicationUser> userManager, ILogger<DonationsController> logger)
    {
        _db = db;
        _userManager = userManager;
        _logger = logger;
    }

    [HttpGet("/api/campaigns")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCampaigns()
    {
        var campaigns = await _db.Donations
            .Where(d => d.CampaignName != null
                && d.CampaignName.Trim() != ""
                && d.CampaignName.Trim().Length >= 3)
            .Select(d => d.CampaignName!.Trim())
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Ok(campaigns);
    }

    [HttpGet("/api/donation-notes-options")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDonationNotesOptions()
    {
        var notes = await _db.Donations
            .Where(d => d.Notes != null && d.Notes != "")
            .Select(d => d.Notes!)
            .Distinct()
            .OrderBy(n => n)
            .ToListAsync();

        return Ok(notes);
    }

    [HttpGet("purposes")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDonationPurposes()
    {
        try
        {
            var purposes = await _db.Donations
                .AsNoTracking()
                .Where(d => d.Notes != null && d.Notes.Trim() != "")
                .Select(d => d.Notes!.Trim())
                .Distinct()
                .OrderBy(n => n)
                .ToListAsync();

            return Ok(purposes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Dashboard API error: failed to load donation purposes.");
            // Keep public donation page functional if this query fails.
            return Ok(Array.Empty<string>());
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? donationType,
        [FromQuery] string? campaignName,
        [FromQuery] int? supporterId,
        [FromQuery] string? search,
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo,
        [FromQuery] decimal? minAmount,
        [FromQuery] decimal? maxAmount,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        pageSize = Math.Min(pageSize, 100);

        var query = _db.Donations
            .AsNoTracking()
            .Include(d => d.Supporter)
            .Include(d => d.DonationTypeRef)
            .AsQueryable();
        if (!string.IsNullOrWhiteSpace(donationType)) query = query.Where(d => d.DonationType == donationType);
        if (!string.IsNullOrWhiteSpace(campaignName)) query = query.Where(d => d.CampaignName == campaignName);
        if (supporterId.HasValue) query = query.Where(d => d.SupporterId == supporterId.Value);
        if (dateFrom.HasValue) query = query.Where(d => d.DonationDate >= dateFrom.Value);
        if (dateTo.HasValue) query = query.Where(d => d.DonationDate <= dateTo.Value);
        if (minAmount.HasValue)
        {
            query = query.Where(d =>
                (d.DonationType == "Monetary" ? (d.Amount ?? 0m) : (d.EstimatedValue ?? 0m)) >= minAmount.Value);
        }
        if (maxAmount.HasValue)
        {
            query = query.Where(d =>
                (d.DonationType == "Monetary" ? (d.Amount ?? 0m) : (d.EstimatedValue ?? 0m)) <= maxAmount.Value);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(d =>
                (d.Notes != null && d.Notes.ToLower().Contains(q)) ||
                (d.CampaignName != null && d.CampaignName.ToLower().Contains(q)) ||
                (d.Supporter != null && (
                    d.Supporter.DisplayName.ToLower().Contains(q) ||
                    (d.Supporter.OrganizationName != null && d.Supporter.OrganizationName.ToLower().Contains(q)) ||
                    (d.Supporter.FirstName != null && d.Supporter.FirstName.ToLower().Contains(q)) ||
                    (d.Supporter.LastName != null && d.Supporter.LastName.ToLower().Contains(q))
                )));
        }
        var total = await query.CountAsync();
        var donations = await query
            .OrderByDescending(d => d.DonationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                d.DonationId,
                d.SupporterId,
                d.DonationType,
                d.DonationDate,
                d.ChannelSource,
                d.CurrencyCode,
                d.Amount,
                d.EstimatedValue,
                d.ImpactUnit,
                d.IsRecurring,
                d.CampaignName,
                d.Notes,
                d.CreatedByPartnerId,
                d.ReferralPostId,
                d.DonationTypeId,
                donationTypeName = d.DonationTypeRef != null ? d.DonationTypeRef.Name : null,
                supporterDisplayName = d.Supporter != null ? d.Supporter.DisplayName : null,
                supporterOrganizationName = d.Supporter != null ? d.Supporter.OrganizationName : null,
                supporterFirstName = d.Supporter != null ? d.Supporter.FirstName : null,
                supporterLastName = d.Supporter != null ? d.Supporter.LastName : null
            })
            .ToListAsync();
        Console.WriteLine($"Donations result: {donations.Count}");
        return Ok(new { donations, total, page, pageSize });
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.Donations
            .Include(x => x.Supporter)
            .Include(x => x.DonationTypeRef)
            .FirstOrDefaultAsync(x => x.DonationId == id);
        return d == null ? NotFound() : Ok(d);
    }

    // GET /api/donations/mine — donors see their own donations
    [HttpGet("mine")]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> GetMyDonations()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        // Look up SupporterId from ApplicationUser
        var user = await _userManager.FindByIdAsync(userIdClaim);
        if (user == null) return Unauthorized();

        // Auto-link supporter by email if not yet linked
        if (user.SupporterId == null && !string.IsNullOrWhiteSpace(user.Email))
        {
            var supporter = await _db.Supporters
                .FirstOrDefaultAsync(s => s.Email == user.Email.ToLower());
            if (supporter != null)
            {
                user.SupporterId = supporter.SupporterId;
                await _userManager.UpdateAsync(user);
            }
        }

        if (user.SupporterId == null) return Ok(Array.Empty<object>());

        var donations = await _db.Donations
            .AsNoTracking()
            .Include(d => d.DonationTypeRef)
            .Where(d => d.SupporterId == user.SupporterId)
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new
            {
                d.DonationId,
                d.DonationType,
                d.DonationDate,
                d.Amount,
                d.EstimatedValue,
                d.ImpactUnit,
                d.CampaignName,
                d.ChannelSource,
                d.IsRecurring,
                d.Notes,
                d.DonationTypeId,
                donationTypeName = d.DonationTypeRef != null ? d.DonationTypeRef.Name : null
            })
            .ToListAsync();
        return Ok(donations);
    }

    // POST /api/donations/self — donors submit a fake donation for themselves
    [HttpPost("self")]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> CreateSelf([FromBody] SelfDonationRequest req)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userIdClaim);
        if (user?.SupporterId == null)
            return BadRequest(new { message = "Your account is not linked to a supporter profile. Contact an administrator." });

        var donationType = req.DonationType?.Trim() switch
        {
            "Monetary" or "InKind" or "Time" or "Skills" or "SocialMedia" => req.DonationType.Trim(),
            _ => "Monetary"
        };

        if (req.DonationTypeId.HasValue)
        {
            var typeExists = await _db.DonationTypes
                .AnyAsync(dt => dt.Id == req.DonationTypeId.Value && dt.IsActive);
            if (!typeExists)
            {
                return BadRequest(new { message = "Donation type id is invalid." });
            }
        }

        var validatedCampaignName = NormalizeAndValidateCampaignName(req.CampaignName, out var campaignValidationError);
        if (campaignValidationError != null)
        {
            return BadRequest(new { message = campaignValidationError });
        }

        var donation = new Donation
        {
            SupporterId = user.SupporterId.Value,
            DonationType = donationType,
            DonationDate = DateOnly.FromDateTime(DateTime.UtcNow),
            ChannelSource = "Direct",
            CurrencyCode = donationType == "Monetary" ? "USD" : null,
            Amount = donationType == "Monetary" ? req.Amount : null,
            EstimatedValue = req.EstimatedValue,
            ImpactUnit = donationType != "Monetary" ? req.ImpactUnit ?? "hours" : null,
            IsRecurring = false,
            DonationTypeId = req.DonationTypeId,
            CampaignName = validatedCampaignName,
            Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim(),
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = donation.DonationId }, donation);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Donation donation)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var validatedCampaignName = NormalizeAndValidateCampaignName(donation.CampaignName, out var campaignValidationError);
        if (campaignValidationError != null)
        {
            return BadRequest(new { message = campaignValidationError });
        }

        donation.CampaignName = validatedCampaignName;

        if (donation.SupporterId.HasValue)
        {
            var supporterExists = await _db.Supporters.AnyAsync(s => s.SupporterId == donation.SupporterId.Value);
            if (!supporterExists)
            {
                return BadRequest(new { message = "Donation supporter_id must reference an existing supporter." });
            }
        }
        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = donation.DonationId }, donation);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Donation donation)
    {
        if (id != donation.DonationId) return BadRequest();

        var validatedCampaignName = NormalizeAndValidateCampaignName(donation.CampaignName, out var campaignValidationError);
        if (campaignValidationError != null)
        {
            return BadRequest(new { message = campaignValidationError });
        }

        donation.CampaignName = validatedCampaignName;

        _db.Entry(donation).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool confirm = false)
    {
        if (!confirm) return BadRequest(new { message = "Pass ?confirm=true to confirm deletion." });
        var d = await _db.Donations.FindAsync(id);
        if (d == null) return NotFound();
        _db.Donations.Remove(d);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static string? NormalizeAndValidateCampaignName(string? campaignName, out string? validationError)
    {
        validationError = null;
        if (campaignName == null)
        {
            return null;
        }

        var trimmed = campaignName.Trim();
        if (trimmed.Length == 0)
        {
            validationError = "Campaign name cannot be empty.";
            return null;
        }

        if (trimmed.Length < 3)
        {
            validationError = "Campaign name must be at least 3 characters.";
            return null;
        }

        return trimmed;
    }
}

public record SelfDonationRequest(
    string? DonationType,
    decimal? Amount,
    decimal? EstimatedValue,
    string? ImpactUnit,
    int? DonationTypeId,
    string? CampaignName,
    string? Notes
);
