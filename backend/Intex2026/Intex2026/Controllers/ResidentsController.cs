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
    public async Task<IActionResult> Create([FromBody] ResidentUpsertRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var resident = new Resident
        {
            CaseControlNo = GenerateCaseControlNo(),
            InternalCode = GenerateInternalCode(req.SafehouseId),
            SafehouseId = req.SafehouseId,
            CaseStatus = req.CaseStatus,
            Sex = string.IsNullOrWhiteSpace(req.Sex) ? "F" : req.Sex,
            DateOfBirth = req.DateOfBirth,
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
            ReferralSource = req.ReferralSource,
            AssignedSocialWorker = req.AssignedSocialWorker,
            InitialCaseAssessment = req.InitialCaseAssessment,
            InitialRiskLevel = req.InitialRiskLevel,
            CurrentRiskLevel = req.CurrentRiskLevel,
            FamilyIs4ps = req.FamilyIs4ps,
            FamilySoloParent = req.FamilySoloParent,
            FamilyIndigenous = req.FamilyIndigenous,
            FamilyInformalSettler = req.FamilyInformalSettler,
            IsPwd = req.IsPwd,
            PwdType = req.PwdType,
            HasSpecialNeeds = req.HasSpecialNeeds,
            SpecialNeedsDiagnosis = req.SpecialNeedsDiagnosis,
            NotesRestricted = req.NotesRestricted,
        };
        resident.CreatedAt = DateTime.UtcNow;
        _db.Residents.Add(resident);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = resident.ResidentId }, resident);
    }

    // PUT /api/residents/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ResidentUpsertRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var resident = await _db.Residents.FirstOrDefaultAsync(r => r.ResidentId == id);
        if (resident == null) return NotFound();

        resident.SafehouseId = req.SafehouseId;
        resident.CaseStatus = req.CaseStatus;
        resident.Sex = string.IsNullOrWhiteSpace(req.Sex) ? resident.Sex : req.Sex;
        resident.DateOfBirth = req.DateOfBirth;
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
        resident.ReferralSource = req.ReferralSource;
        resident.AssignedSocialWorker = req.AssignedSocialWorker;
        resident.InitialCaseAssessment = req.InitialCaseAssessment;
        resident.InitialRiskLevel = req.InitialRiskLevel;
        resident.CurrentRiskLevel = req.CurrentRiskLevel;
        resident.FamilyIs4ps = req.FamilyIs4ps;
        resident.FamilySoloParent = req.FamilySoloParent;
        resident.FamilyIndigenous = req.FamilyIndigenous;
        resident.FamilyInformalSettler = req.FamilyInformalSettler;
        resident.IsPwd = req.IsPwd;
        resident.PwdType = req.PwdType;
        resident.HasSpecialNeeds = req.HasSpecialNeeds;
        resident.SpecialNeedsDiagnosis = req.SpecialNeedsDiagnosis;
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
    string? ReferralSource,
    string? AssignedSocialWorker,
    string? InitialCaseAssessment,
    string InitialRiskLevel,
    string CurrentRiskLevel,
    bool FamilyIs4ps,
    bool FamilySoloParent,
    bool FamilyIndigenous,
    bool FamilyInformalSettler,
    bool IsPwd,
    string? PwdType,
    bool HasSpecialNeeds,
    string? SpecialNeedsDiagnosis,
    string? NotesRestricted
);
