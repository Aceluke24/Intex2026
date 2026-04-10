using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Net.Mail;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/public")]
public partial class PublicController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<PublicController> _logger;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan PublicCacheTtl = TimeSpan.FromSeconds(60);
    public PublicController(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        ILogger<PublicController> logger,
        IMemoryCache cache)
    {
        _db = db;
        _userManager = userManager;
        _logger = logger;
        _cache = cache;
    }

    private void ApplyPublicCacheHeaders()
    {
        Response.Headers.CacheControl = "public,max-age=60";
    }

    // POST /api/public/newsletter/subscribe — simple public mailing-list join
    [HttpPost("newsletter/subscribe")]
    public async Task<IActionResult> NewsletterSubscribe([FromBody] NewsletterSubscribeRequest req)
    {
        var email = (req.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { message = "Email is required." });
        }

        try
        {
            _ = new MailAddress(email);
        }
        catch
        {
            return BadRequest(new { message = "Please enter a valid email address." });
        }

        var existing = await _db.Supporters.FirstOrDefaultAsync(s => s.Email == email);
        if (existing != null)
        {
            if (!string.Equals(existing.Status, "Active", StringComparison.OrdinalIgnoreCase))
            {
                existing.Status = "Active";
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "You are already on our updates list." });
        }

        var displayName = email.Split('@')[0];
        var supporter = new Supporter
        {
            SupporterType = "NewsletterSubscriber",
            DisplayName = displayName,
            Email = email,
            RelationshipType = "Local",
            Status = "Active",
            AcquisitionChannel = "Website",
            CreatedAt = DateTime.UtcNow,
        };

        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Thanks for joining. We'll keep you updated." });
    }

    // GET /api/public/residents/count — public survivor count (landing)
    [HttpGet("residents/count")]
    public async Task<IActionResult> ResidentsCount()
    {
        try
        {
            ApplyPublicCacheHeaders();
            var count = await _cache.GetOrCreateAsync("public:residents-count:v1", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PublicCacheTtl;
                return await _db.Residents
                    .AsNoTracking()
                    .Select(r => r.ResidentId)
                    .Distinct()
                    .CountAsync();
            });
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

    // GET /api/public/safehouses/count — total safehouses (aggregate; no PII)
    [HttpGet("safehouses/count")]
    public async Task<IActionResult> SafehousesCountPublic()
    {
        try
        {
            ApplyPublicCacheHeaders();
            var count = await _cache.GetOrCreateAsync("public:safehouses-count:v1", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PublicCacheTtl;
                return await _db.Safehouses.AsNoTracking().CountAsync();
            });
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching safehouse count");
            return Problem(
                title: "Safehouse count unavailable",
                detail: "Safehouse count could not be loaded.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    // GET /api/public/recordings/count — process recordings (counseling sessions) count
    [HttpGet("recordings/count")]
    public async Task<IActionResult> RecordingsCountPublic()
    {
        try
        {
            ApplyPublicCacheHeaders();
            var count = await _cache.GetOrCreateAsync("public:recordings-count:v1", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PublicCacheTtl;
                return await _db.ProcessRecordings.AsNoTracking().CountAsync();
            });
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching recordings count");
            return Problem(
                title: "Recordings count unavailable",
                detail: "Process recordings count could not be loaded.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    // GET /api/public/residents/reintegration-rate — derived % (ReintegrationStatus == Completed)
    [HttpGet("residents/reintegration-rate")]
    public async Task<IActionResult> ReintegrationRatePublic()
    {
        try
        {
            ApplyPublicCacheHeaders();
            var data = await _cache.GetOrCreateAsync("public:reint-rate:v1", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PublicCacheTtl;
                var totalResidentsTask = _db.Residents.AsNoTracking().CountAsync();
                var completedReintegrationsTask = _db.Residents.AsNoTracking().CountAsync(r => r.ReintegrationStatus == "Completed");
                await Task.WhenAll(totalResidentsTask, completedReintegrationsTask);
                return new
                {
                    totalResidents = totalResidentsTask.Result,
                    completedReintegrations = completedReintegrationsTask.Result
                };
            });
            var totalResidents = data?.totalResidents ?? 0;
            var completedReintegrations = data?.completedReintegrations ?? 0;
            var reintegrationRatePercent = totalResidents == 0
                ? 0
                : (int)Math.Round(completedReintegrations * 100.0 / totalResidents);
            return Ok(new { totalResidents, completedReintegrations, reintegrationRatePercent });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching reintegration rate");
            return Problem(
                title: "Reintegration rate unavailable",
                detail: "Reintegration metrics could not be loaded.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    // GET /api/public/impact/summary — headline impact stats
    [HttpGet("impact/summary")]
    public async Task<IActionResult> ImpactSummary()
    {
        try
        {
            ApplyPublicCacheHeaders();
            var payload = await _cache.GetOrCreateAsync("public:impact-summary:v2", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PublicCacheTtl;
                var survivorsTask = _db.Residents.AsNoTracking().CountAsync();
                var totalDonationsTask = _db.Donations.AsNoTracking().Where(d => d.Amount != null).SumAsync(d => d.Amount ?? 0);
                var activeProgramsTask = _db.PartnerAssignments.AsNoTracking().Select(p => p.ProgramArea).Distinct().CountAsync();
                var educationAggTask = _db.EducationRecords.AsNoTracking()
                    .GroupBy(_ => 1)
                    .Select(g => new { Total = g.Count(), Completed = g.Count(e => e.CompletionStatus == "Completed") })
                    .FirstOrDefaultAsync();
                var activeCampaignsCutoff = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-60));
                var activeCampaignsCountTask = _db.Donations.AsNoTracking()
                    .Where(d => d.CampaignName != null && d.DonationDate >= activeCampaignsCutoff)
                    .Select(d => d.CampaignName!)
                    .Distinct()
                    .CountAsync();
                await Task.WhenAll(survivorsTask, totalDonationsTask, activeProgramsTask, educationAggTask, activeCampaignsCountTask);
                var totalEdu = educationAggTask.Result?.Total ?? 0;
                var completed = educationAggTask.Result?.Completed ?? 0;
                return new
                {
                    survivors = survivorsTask.Result,
                    totalDonations = totalDonationsTask.Result,
                    activePrograms = activeProgramsTask.Result,
                    completionRate = totalEdu == 0 ? 0 : (int)(completed * 100.0 / totalEdu),
                    activeCampaignsCount = activeCampaignsCountTask.Result
                };
            });
            return Ok(payload);
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
            ApplyPublicCacheHeaders();
            var payload = await _cache.GetOrCreateAsync("public:program-outcomes:v2", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PublicCacheTtl;
                var safeHousingAggTask = _db.Safehouses.AsNoTracking()
                    .Where(s => s.CapacityGirls > 0)
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        Occupancy = g.Sum(x => x.CurrentOccupancy),
                        Capacity = g.Sum(x => x.CapacityGirls)
                    })
                    .FirstOrDefaultAsync();
                var educationAggTask = _db.EducationRecords.AsNoTracking()
                    .GroupBy(_ => 1)
                    .Select(g => new { Total = g.Count(), Completed = g.Count(e => e.CompletionStatus == "Completed") })
                    .FirstOrDefaultAsync();
                var counselingAggTask = _db.ProcessRecordings.AsNoTracking()
                    .GroupBy(_ => 1)
                    .Select(g => new { Total = g.Count(), Progress = g.Count(p => p.ProgressNoted) })
                    .FirstOrDefaultAsync();
                var interventionAggTask = _db.InterventionPlans.AsNoTracking()
                    .GroupBy(_ => 1)
                    .Select(g => new { Total = g.Count(), Achieved = g.Count(p => p.Status == "Achieved") })
                    .FirstOrDefaultAsync();

                await Task.WhenAll(safeHousingAggTask, educationAggTask, counselingAggTask, interventionAggTask);

                var safeCapacity = safeHousingAggTask.Result?.Capacity ?? 0;
                var safeOccupancy = safeHousingAggTask.Result?.Occupancy ?? 0;
                var totalEdu = educationAggTask.Result?.Total ?? 0;
                var completedEdu = educationAggTask.Result?.Completed ?? 0;
                var totalSessions = counselingAggTask.Result?.Total ?? 0;
                var progress = counselingAggTask.Result?.Progress ?? 0;
                var totalPlans = interventionAggTask.Result?.Total ?? 0;
                var achieved = interventionAggTask.Result?.Achieved ?? 0;

                var safeHousing = safeCapacity == 0 ? 0 : safeOccupancy * 100.0 / safeCapacity;
                var educationRate = totalEdu == 0 ? 0 : completedEdu * 100.0 / totalEdu;
                var counselingRate = totalSessions == 0 ? 0 : progress * 100.0 / totalSessions;
                var planRate = totalPlans == 0 ? 0 : achieved * 100.0 / totalPlans;

                return new
                {
                    safeHousing = Math.Round(safeHousing, 1),
                    education = Math.Round(educationRate, 1),
                    counseling = Math.Round(counselingRate, 1),
                    interventionPlans = Math.Round(planRate, 1)
                };
            });
            return Ok(payload);
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
            ApplyPublicCacheHeaders();
            var campaigns = await _cache.GetOrCreateAsync("public:impact-campaigns:v1", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PublicCacheTtl;
                return await _db.Donations.AsNoTracking()
                    .Where(d => d.CampaignName != null
                        && d.CampaignName.Trim() != ""
                        && d.CampaignName.Trim().Length >= 3)
                    .GroupBy(d => d.CampaignName!.Trim())
                    .Select(g => new
                    {
                        name = g.Key,
                        raised = g.Sum(x => x.Amount ?? 0),
                        goal = (g.Sum(x => x.Amount ?? 0)) * 1.25m,
                        daysLeft = 30
                    })
                    .ToListAsync();
            });

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
            ApplyPublicCacheHeaders();
            var payload = await _cache.GetOrCreateAsync("public:impact-allocation:v2", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PublicCacheTtl;
                var grouped = await _db.DonationAllocations.AsNoTracking()
                    .GroupBy(x => x.ProgramArea)
                    .Select(g => new { ProgramArea = g.Key, Total = g.Sum(x => x.AmountAllocated) })
                    .ToListAsync();

                var total = grouped.Sum(x => x.Total);
                if (total == 0)
                {
                    return new { direct = 0, outreach = 0, operations = 0 };
                }

                var direct = grouped
                    .Where(x => x.ProgramArea == "Education" || x.ProgramArea == "Wellbeing")
                    .Sum(x => x.Total);
                var outreach = grouped.Where(x => x.ProgramArea == "Outreach").Sum(x => x.Total);
                var ops = grouped.Where(x => x.ProgramArea == "Operations").Sum(x => x.Total);

                return new
                {
                    direct = (int)(direct * 100 / total),
                    outreach = (int)(outreach * 100 / total),
                    operations = (int)(ops * 100 / total)
                };
            });
            return Ok(payload);
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
        ApplyPublicCacheHeaders();
        var payload = await _cache.GetOrCreateAsync("public:stats:v2", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = PublicCacheTtl;
            var residentAggTask = _db.Residents.AsNoTracking()
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Active = g.Count(r => r.CaseStatus == "Active"),
                    CompletedReintegrations = g.Count(r => r.ReintegrationStatus == "Completed")
                })
                .FirstOrDefaultAsync();
            var safehouseAggTask = _db.Safehouses.AsNoTracking()
                .GroupBy(_ => 1)
                .Select(g => new { Total = g.Count(), Active = g.Count(s => s.Status == "Active") })
                .FirstOrDefaultAsync();
            var counselingSessionsCountTask = _db.ProcessRecordings.AsNoTracking().CountAsync();
            var totalDonorsTask = _db.Supporters.AsNoTracking().CountAsync(s => s.Status == "Active");
            var totalMonetaryDonationsTask = _db.Donations.AsNoTracking()
                .Where(d => d.DonationType == "Monetary" && d.Amount.HasValue)
                .SumAsync(d => d.Amount ?? 0);

            await Task.WhenAll(residentAggTask, safehouseAggTask, counselingSessionsCountTask, totalDonorsTask, totalMonetaryDonationsTask);

            var residentAgg = residentAggTask.Result;
            var safehouseAgg = safehouseAggTask.Result;
            var totalResidents = residentAgg?.Total ?? 0;
            var completedReintegrations = residentAgg?.CompletedReintegrations ?? 0;
            var reintegrationRatePercent = totalResidents == 0
                ? 0
                : (int)Math.Round(completedReintegrations * 100.0 / totalResidents);

            return new
            {
                activeResidents = residentAgg?.Active ?? 0,
                totalResidents,
                totalSafehouses = safehouseAgg?.Total ?? 0,
                activeSafehouses = safehouseAgg?.Active ?? 0,
                counselingSessionsCount = counselingSessionsCountTask.Result,
                completedReintegrations,
                reintegrationRatePercent,
                totalDonors = totalDonorsTask.Result,
                totalMonetaryDonations = totalMonetaryDonationsTask.Result
            };
        });
        return Ok(payload);
    }

    // POST /api/public/donations — anonymous donation submission from the public donate page
    [HttpPost("donations")]
    public async Task<IActionResult> SubmitDonation([FromBody] PublicDonationRequest req)
    {
        if (!req.Amount.HasValue
            || req.Amount.Value < 1
            || decimal.Round(req.Amount.Value, 2) != req.Amount.Value)
        {
            return BadRequest(new
            {
                error = "Invalid amount. Must be a valid currency value with max 2 decimal places."
            });
        }

        int? supporterId = null;
        var isAnonymous = req.IsAnonymous;
        var effectiveFirstName = string.IsNullOrWhiteSpace(req.FirstName) ? AnonymousDonationFirstName : req.FirstName.Trim();
        var effectiveLastName = string.IsNullOrWhiteSpace(req.LastName) ? AnonymousDonationLastName : req.LastName.Trim();
        var normalizedEmail = isAnonymous ? AnonymousDonationEmail : NormalizeEmail(req.Email);
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        ApplicationUser? authUser = null;

        if (!string.IsNullOrWhiteSpace(userIdClaim))
        {
            authUser = await _userManager.FindByIdAsync(userIdClaim);
        }

        if (authUser?.SupporterId != null)
        {
            supporterId = authUser.SupporterId.Value;
        }
        else if (authUser != null && !string.IsNullOrWhiteSpace(authUser.Email))
        {
            var linkedSupporter = await EnsureSupporterByEmailAsync(
                authUser.Email.Trim().ToLowerInvariant(),
                req.FirstName,
                req.LastName,
                req.DisplayName);

            supporterId = linkedSupporter.SupporterId;
            authUser.SupporterId = linkedSupporter.SupporterId;
            await _userManager.UpdateAsync(authUser);
        }

        var trimmedFirst = string.IsNullOrWhiteSpace(req.FirstName) ? null : req.FirstName.Trim();
        var trimmedLast = string.IsNullOrWhiteSpace(req.LastName) ? null : req.LastName.Trim();
        var hasName =
            !string.IsNullOrWhiteSpace(trimmedFirst)
            || !string.IsNullOrWhiteSpace(trimmedLast)
            || !string.IsNullOrWhiteSpace(req.DisplayName?.Trim());

        if (supporterId == null)
        {
            if (isAnonymous)
            {
                var anon = await GetOrCreateAnonymousSupporterAsync();
                supporterId = anon.SupporterId;
            }
            else if (!string.IsNullOrWhiteSpace(normalizedEmail))
            {
                try
                {
                    _ = new MailAddress(normalizedEmail);
                }
                catch
                {
                    return BadRequest(new { error = "Please enter a valid email address." });
                }

                var supporter = await EnsureSupporterByEmailAsync(
                    normalizedEmail,
                    effectiveFirstName,
                    effectiveLastName,
                    req.DisplayName);

                supporterId = supporter.SupporterId;
            }
            else if (hasName)
            {
                var supporter = await CreateSupporterWithNameOnlyAsync(
                    trimmedFirst,
                    trimmedLast,
                    req.DisplayName);

                supporterId = supporter.SupporterId;
            }
            else
            {
                return BadRequest(new
                {
                    error = "Please provide your email or name so we can acknowledge your gift."
                });
            }
        }

        var validatedCampaignName = NormalizeAndValidateCampaignName(req.CampaignName, out var campaignValidationError);
        if (campaignValidationError != null)
        {
            return BadRequest(new { error = campaignValidationError });
        }

        int? donationTypeId = null;
        if (req.DonationTypeId.HasValue)
        {
            var typeExists = await _db.DonationTypes
                .AnyAsync(dt => dt.Id == req.DonationTypeId.Value && dt.IsActive);
            if (!typeExists)
            {
                return BadRequest(new { error = "Selected donation type is invalid." });
            }
            donationTypeId = req.DonationTypeId.Value;
        }

        var donation = new Donation
        {
            SupporterId = supporterId,
            DonationType = string.IsNullOrWhiteSpace(req.DonationType) ? "Monetary" : req.DonationType.Trim(),
            DonationDate = req.DonationDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            ChannelSource = string.IsNullOrWhiteSpace(req.ChannelSource) ? "Direct" : req.ChannelSource.Trim(),
            CurrencyCode = string.IsNullOrWhiteSpace(req.CurrencyCode) ? "PHP" : req.CurrencyCode.Trim().ToUpperInvariant(),
            Amount = req.Amount,
            EstimatedValue = req.EstimatedValue,
            ImpactUnit = string.IsNullOrWhiteSpace(req.ImpactUnit) ? null : req.ImpactUnit.Trim(),
            DonationTypeId = donationTypeId,
            CampaignName = validatedCampaignName,
            Notes = req.Notes?.Trim(),
            IsRecurring = req.IsRecurring,
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        return Ok(new { donationId = donation.DonationId, message = "Thank you for your contribution!" });
    }

    [HttpGet("campaigns")]
    public async Task<IActionResult> Campaigns()
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
    public string? UserId { get; set; }
    public int? SupporterId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public decimal? Amount { get; set; }
    public bool IsAnonymous { get; set; }
    public int? DonationTypeId { get; set; }
    public string? DonationType { get; set; }
    public DateOnly? DonationDate { get; set; }
    public string? ChannelSource { get; set; }
    public string? CurrencyCode { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? ImpactUnit { get; set; }
    public bool IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string? Notes { get; set; }

    // Accept snake_case payload keys while preserving existing camelCase clients.
    public string? user_id { get => UserId; set => UserId = value; }
    public int? supporter_id { get => SupporterId; set => SupporterId = value; }
    public bool is_anonymous { get => IsAnonymous; set => IsAnonymous = value; }
    public int? donation_type_id { get => DonationTypeId; set => DonationTypeId = value; }
    public string? donation_type { get => DonationType; set => DonationType = value; }
    public DateOnly? donation_date { get => DonationDate; set => DonationDate = value; }
    public string? channel_source { get => ChannelSource; set => ChannelSource = value; }
    public string? currency_code { get => CurrencyCode; set => CurrencyCode = value; }
    public decimal? estimated_value { get => EstimatedValue; set => EstimatedValue = value; }
    public string? impact_unit { get => ImpactUnit; set => ImpactUnit = value; }
    public bool is_recurring { get => IsRecurring; set => IsRecurring = value; }
    public string? campaign_name { get => CampaignName; set => CampaignName = value; }
    public string? notes { get => Notes; set => Notes = value; }
}

public class NewsletterSubscribeRequest
{
    public string? Email { get; set; }
}

partial class PublicController
{
    private const string AnonymousDonationFirstName = "Anonymous";
    private const string AnonymousDonationLastName = "Donor";
    private const string AnonymousDonationEmail = "anonymous@donor.com";

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

    private static string? NormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        return email.Trim().ToLowerInvariant();
    }

    /// <summary>
    /// Shared placeholder so anonymous donations satisfy non-null FK on Donations.SupporterId.
    /// </summary>
    private const string AnonymousDonorInternalEmail = "__anonymous_donor@internal.invalid";

    private async Task<Supporter> GetOrCreateAnonymousSupporterAsync()
    {
        var existing = await _db.Supporters
            .OrderBy(s => s.SupporterId)
            .FirstOrDefaultAsync(s => s.Email == AnonymousDonorInternalEmail);
        if (existing != null)
        {
            return existing;
        }

        var supporter = new Supporter
        {
            SupporterType = "MonetaryDonor",
            DisplayName = AnonymousDonationFirstName,
            FirstName = AnonymousDonationFirstName,
            LastName = AnonymousDonationLastName,
            Email = AnonymousDonorInternalEmail,
            RelationshipType = "Local",
            Status = "Active",
            AcquisitionChannel = "Website",
            FirstDonationDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();
        return supporter;
    }

    private async Task<Supporter> CreateSupporterWithNameOnlyAsync(
        string? firstName,
        string? lastName,
        string? displayName)
    {
        var trimmedFirst = string.IsNullOrWhiteSpace(firstName) ? null : firstName.Trim();
        var trimmedLast = string.IsNullOrWhiteSpace(lastName) ? null : lastName.Trim();
        var computedDisplay = !string.IsNullOrWhiteSpace(displayName)
            ? displayName.Trim()
            : $"{trimmedFirst} {trimmedLast}".Trim();
        if (string.IsNullOrWhiteSpace(computedDisplay))
        {
            computedDisplay = "Supporter";
        }

        var supporter = new Supporter
        {
            SupporterType = "MonetaryDonor",
            DisplayName = computedDisplay,
            FirstName = trimmedFirst,
            LastName = trimmedLast,
            RelationshipType = "Local",
            Status = "Active",
            AcquisitionChannel = "Website",
            FirstDonationDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();
        return supporter;
    }

    private async Task<Supporter> EnsureSupporterByEmailAsync(
        string normalizedEmail,
        string? firstName,
        string? lastName,
        string? displayName)
    {
        var existing = await _db.Supporters
            .OrderBy(s => s.SupporterId)
            .FirstOrDefaultAsync(s => s.Email == normalizedEmail);
        if (existing != null)
        {
            return existing;
        }

        var trimmedFirst = string.IsNullOrWhiteSpace(firstName) ? null : firstName.Trim();
        var trimmedLast = string.IsNullOrWhiteSpace(lastName) ? null : lastName.Trim();
        var computedDisplay = !string.IsNullOrWhiteSpace(displayName)
            ? displayName.Trim()
            : !string.IsNullOrWhiteSpace(trimmedFirst) && !string.IsNullOrWhiteSpace(trimmedLast)
                ? $"{trimmedFirst} {trimmedLast}"
                : normalizedEmail;

        var supporter = new Supporter
        {
            SupporterType = "MonetaryDonor",
            DisplayName = computedDisplay,
            FirstName = trimmedFirst,
            LastName = trimmedLast,
            Email = normalizedEmail,
            RelationshipType = "Local",
            Status = "Active",
            AcquisitionChannel = "Website",
            FirstDonationDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();
        return supporter;
    }
}
