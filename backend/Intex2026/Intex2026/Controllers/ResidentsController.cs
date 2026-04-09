using System.Globalization;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/residents")]
[Authorize(Roles = "Admin")]
public class ResidentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ResidentsController(AppDbContext db) => _db = db;

    private static string GenerateCaseControlNo() => $"CC-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    private static string GenerateInternalCode(int safehouseId) => $"SH{safehouseId:D2}-{DateTime.UtcNow:HHmmssfff}";

    /// <summary>Parses LS-#### style codes stored in <see cref="Resident.InternalCode"/>.</summary>
    private static bool TryParseLsSequence(string? code, out int num)
    {
        num = 0;
        if (string.IsNullOrWhiteSpace(code)) return false;
        var t = code.Trim();
        if (!t.StartsWith("LS-", StringComparison.OrdinalIgnoreCase)) return false;
        var rest = t.AsSpan(3).Trim();
        return int.TryParse(rest, NumberStyles.None, CultureInfo.InvariantCulture, out num) && num >= 0;
    }

    /// <summary>Next anonymized display code: max(latest valid + 1, global max + 1, 1), formatted LS-0000.</summary>
    private static string ComputeNextLsDisplayName(string? latestInternalCode, IReadOnlyList<string> allInternalCodes)
    {
        var maxParsed = 0;
        foreach (var c in allInternalCodes)
        {
            if (TryParseLsSequence(c, out var n))
                maxParsed = Math.Max(maxParsed, n);
        }

        var nextFromLatest = 0;
        if (TryParseLsSequence(latestInternalCode, out var latestNum))
            nextFromLatest = latestNum + 1;

        var next = Math.Max(1, Math.Max(maxParsed + 1, nextFromLatest));
        return $"LS-{next.ToString("D4", CultureInfo.InvariantCulture)}";
    }

    // GET /api/residents/next-display-name — suggested next LS-#### from DB (by CreatedAt + global max)
    [HttpGet("next-display-name")]
    public Task<IActionResult> GetNextDisplayName(CancellationToken ct) => GetNextDisplayNameCore(ct);

    /// <summary>Legacy/clients expecting <c>/api/next-display-name</c> (same payload as residents route).</summary>
    [HttpGet("~/api/next-display-name")]
    public Task<IActionResult> GetNextDisplayNameRootAlias(CancellationToken ct) => GetNextDisplayNameCore(ct);

    private async Task<IActionResult> GetNextDisplayNameCore(CancellationToken ct)
    {
        var count = await _db.Residents.AsNoTracking().CountAsync(ct);
        if (count == 0)
            return Ok(new { displayName = "LS-0001" });

        var latestCode = await _db.Residents.AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => r.InternalCode)
            .FirstOrDefaultAsync(ct);

        var allCodes = await _db.Residents.AsNoTracking()
            .Select(r => r.InternalCode)
            .ToListAsync(ct);

        return Ok(new { displayName = ComputeNextLsDisplayName(latestCode, allCodes) });
    }

    // GET /api/residents?caseStatus=Active&safehouseId=1&caseCategory=Neglected&search=foo&page=1&pageSize=25
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? caseStatus,
        [FromQuery] int? safehouseId,
        [FromQuery] string? caseCategory,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var query = _db.Residents.AsQueryable();

        if (!string.IsNullOrWhiteSpace(caseStatus))
            query = query.Where(r => r.CaseStatus == caseStatus);
        if (safehouseId.HasValue)
            query = query.Where(r => r.SafehouseId == safehouseId.Value);
        if (!string.IsNullOrWhiteSpace(caseCategory))
            query = query.Where(r => r.CaseCategory == caseCategory);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(r =>
                r.CaseControlNo.Contains(search) ||
                r.InternalCode.Contains(search) ||
                (r.AssignedSocialWorker != null && r.AssignedSocialWorker.Contains(search)));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.DateOfAdmission)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.ResidentId, r.CaseControlNo, r.InternalCode, r.SafehouseId,
                r.CaseStatus, r.CaseCategory, r.DateOfAdmission,
                r.InitialRiskLevel, r.CurrentRiskLevel,
                r.ReintegrationStatus, r.AssignedSocialWorker,
                r.PresentAge, r.LengthOfStay
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    // GET /api/residents/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var resident = await _db.Residents
            .Include(r => r.Safehouse)
            .FirstOrDefaultAsync(r => r.ResidentId == id);
        return resident == null ? NotFound() : Ok(resident);
    }

    // POST /api/residents
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ResidentUpsertRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        string internalCode;
        if (!string.IsNullOrWhiteSpace(req.InternalCode))
        {
            internalCode = req.InternalCode.Trim();
            var taken = await _db.Residents.AnyAsync(r => r.InternalCode == internalCode, ct);
            if (taken)
                return Conflict(new { message = "That display code is already in use." });
        }
        else
            internalCode = GenerateInternalCode(req.SafehouseId);

        var resident = new Resident
        {
            CaseControlNo = GenerateCaseControlNo(),
            InternalCode = internalCode,
            SafehouseId = req.SafehouseId,
            CaseStatus = req.CaseStatus,
            Sex = string.IsNullOrWhiteSpace(req.Sex) ? "F" : req.Sex,
            DateOfBirth = req.DateOfBirth,
            BirthStatus = req.BirthStatus,
            Religion = req.Religion,
            CaseCategory = req.CaseCategory,
            PlaceOfBirth = req.PlaceOfBirth,
            SubCatOrphaned = req.SubCatOrphaned,
            SubCatTrafficked = req.SubCatTrafficked,
            SubCatChildLabor = req.SubCatChildLabor,
            SubCatPhysicalAbuse = req.SubCatPhysicalAbuse,
            SubCatSexualAbuse = req.SubCatSexualAbuse,
            SubCatOsaec = req.SubCatOsaec,
            SubCatCicl = req.SubCatCicl,
            SubCatAtRisk = req.SubCatAtRisk,
            SubCatStreetChild = req.SubCatStreetChild,
            SubCatChildWithHiv = req.SubCatChildWithHiv,
            DateOfAdmission = req.DateOfAdmission,
            DateEnrolled = req.DateEnrolled,
            AgeUponAdmission = req.AgeUponAdmission,
            PresentAge = req.PresentAge,
            LengthOfStay = req.LengthOfStay,
            ReferralSource = req.ReferralSource,
            ReferringAgencyPerson = req.ReferringAgencyPerson,
            DateColbRegistered = req.DateColbRegistered,
            DateColbObtained = req.DateColbObtained,
            AssignedSocialWorker = req.AssignedSocialWorker,
            InitialCaseAssessment = req.InitialCaseAssessment,
            DateCaseStudyPrepared = req.DateCaseStudyPrepared,
            ReintegrationType = req.ReintegrationType,
            ReintegrationStatus = req.ReintegrationStatus,
            InitialRiskLevel = req.InitialRiskLevel,
            CurrentRiskLevel = req.CurrentRiskLevel,
            FamilyIs4ps = req.FamilyIs4ps,
            FamilySoloParent = req.FamilySoloParent,
            FamilyIndigenous = req.FamilyIndigenous,
            FamilyParentPwd = req.FamilyParentPwd,
            FamilyInformalSettler = req.FamilyInformalSettler,
            IsPwd = req.IsPwd,
            PwdType = req.PwdType,
            HasSpecialNeeds = req.HasSpecialNeeds,
            SpecialNeedsDiagnosis = req.SpecialNeedsDiagnosis,
            DateClosed = req.DateClosed,
            NotesRestricted = req.NotesRestricted,
        };
        resident.CreatedAt = DateTime.UtcNow;
        _db.Residents.Add(resident);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = resident.ResidentId }, resident);
    }

    // PUT /api/residents/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ResidentUpsertRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var resident = await _db.Residents.FirstOrDefaultAsync(r => r.ResidentId == id);
        if (resident == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.InternalCode))
        {
            var trimmed = req.InternalCode.Trim();
            var taken = await _db.Residents.AnyAsync(r => r.InternalCode == trimmed && r.ResidentId != id, ct);
            if (taken)
                return Conflict(new { message = "That display code is already in use." });
            resident.InternalCode = trimmed;
        }

        resident.SafehouseId = req.SafehouseId;
        resident.CaseStatus = req.CaseStatus;
        resident.Sex = string.IsNullOrWhiteSpace(req.Sex) ? resident.Sex : req.Sex;
        resident.DateOfBirth = req.DateOfBirth;
        resident.BirthStatus = req.BirthStatus;
        resident.Religion = req.Religion;
        resident.CaseCategory = req.CaseCategory;
        resident.PlaceOfBirth = req.PlaceOfBirth;
        resident.SubCatOrphaned = req.SubCatOrphaned;
        resident.SubCatTrafficked = req.SubCatTrafficked;
        resident.SubCatChildLabor = req.SubCatChildLabor;
        resident.SubCatPhysicalAbuse = req.SubCatPhysicalAbuse;
        resident.SubCatSexualAbuse = req.SubCatSexualAbuse;
        resident.SubCatOsaec = req.SubCatOsaec;
        resident.SubCatCicl = req.SubCatCicl;
        resident.SubCatAtRisk = req.SubCatAtRisk;
        resident.SubCatStreetChild = req.SubCatStreetChild;
        resident.SubCatChildWithHiv = req.SubCatChildWithHiv;
        resident.DateOfAdmission = req.DateOfAdmission;
        resident.DateEnrolled = req.DateEnrolled;
        resident.AgeUponAdmission = req.AgeUponAdmission;
        resident.PresentAge = req.PresentAge;
        resident.LengthOfStay = req.LengthOfStay;
        resident.ReferralSource = req.ReferralSource;
        resident.ReferringAgencyPerson = req.ReferringAgencyPerson;
        resident.DateColbRegistered = req.DateColbRegistered;
        resident.DateColbObtained = req.DateColbObtained;
        resident.AssignedSocialWorker = req.AssignedSocialWorker;
        resident.InitialCaseAssessment = req.InitialCaseAssessment;
        resident.DateCaseStudyPrepared = req.DateCaseStudyPrepared;
        resident.ReintegrationType = req.ReintegrationType;
        resident.ReintegrationStatus = req.ReintegrationStatus;
        resident.InitialRiskLevel = req.InitialRiskLevel;
        resident.CurrentRiskLevel = req.CurrentRiskLevel;
        resident.FamilyIs4ps = req.FamilyIs4ps;
        resident.FamilySoloParent = req.FamilySoloParent;
        resident.FamilyIndigenous = req.FamilyIndigenous;
        resident.FamilyParentPwd = req.FamilyParentPwd;
        resident.FamilyInformalSettler = req.FamilyInformalSettler;
        resident.IsPwd = req.IsPwd;
        resident.PwdType = req.PwdType;
        resident.HasSpecialNeeds = req.HasSpecialNeeds;
        resident.SpecialNeedsDiagnosis = req.SpecialNeedsDiagnosis;
        resident.DateClosed = req.DateClosed;
        resident.NotesRestricted = req.NotesRestricted;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/residents/{id}?confirm=true
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool confirm = false)
    {
        if (!confirm)
            return BadRequest(new { message = "Pass ?confirm=true to confirm deletion." });
        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        _db.Residents.Remove(resident);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record ResidentUpsertRequest(
    int SafehouseId,
    string CaseStatus,
    string Sex,
    DateOnly DateOfBirth,
    string? BirthStatus,
    string? Religion,
    string CaseCategory,
    string? PlaceOfBirth,
    bool SubCatOrphaned,
    bool SubCatTrafficked,
    bool SubCatChildLabor,
    bool SubCatPhysicalAbuse,
    bool SubCatSexualAbuse,
    bool SubCatOsaec,
    bool SubCatCicl,
    bool SubCatAtRisk,
    bool SubCatStreetChild,
    bool SubCatChildWithHiv,
    DateOnly DateOfAdmission,
    DateOnly DateEnrolled,
    string? AgeUponAdmission,
    string? PresentAge,
    string? LengthOfStay,
    string? ReferralSource,
    string? ReferringAgencyPerson,
    DateOnly? DateColbRegistered,
    DateOnly? DateColbObtained,
    string? AssignedSocialWorker,
    string? InitialCaseAssessment,
    DateOnly? DateCaseStudyPrepared,
    string? ReintegrationType,
    string? ReintegrationStatus,
    string InitialRiskLevel,
    string CurrentRiskLevel,
    bool FamilyIs4ps,
    bool FamilySoloParent,
    bool FamilyIndigenous,
    bool FamilyParentPwd,
    bool FamilyInformalSettler,
    bool IsPwd,
    string? PwdType,
    bool HasSpecialNeeds,
    string? SpecialNeedsDiagnosis,
    DateOnly? DateClosed,
    string? NotesRestricted,
    string? InternalCode = null
);
