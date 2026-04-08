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
            ResidentId = (await _db.Residents.Select(r => (int?)r.ResidentId).MaxAsync() ?? 0) + 1,
            CaseControlNo = GenerateCaseControlNo(),
            InternalCode = GenerateInternalCode(req.SafehouseId),
            SafehouseId = req.SafehouseId,
            CaseStatus = req.CaseStatus,
            Sex = string.IsNullOrWhiteSpace(req.Sex) ? "F" : req.Sex,
            DateOfBirth = req.DateOfBirth,
            CaseCategory = req.CaseCategory,
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
        var affected = await _db.Database.ExecuteSqlInterpolatedAsync($@"
UPDATE Residents
SET SafehouseId = {req.SafehouseId},
    CaseStatus = {req.CaseStatus},
    Sex = {req.Sex},
    DateOfBirth = {req.DateOfBirth},
    CaseCategory = {req.CaseCategory},
    DateOfAdmission = {req.DateOfAdmission},
    DateEnrolled = {req.DateEnrolled},
    ReferralSource = {req.ReferralSource},
    AssignedSocialWorker = {req.AssignedSocialWorker},
    InitialCaseAssessment = {req.InitialCaseAssessment},
    InitialRiskLevel = {req.InitialRiskLevel},
    CurrentRiskLevel = {req.CurrentRiskLevel},
    FamilyIs4ps = {req.FamilyIs4ps},
    FamilySoloParent = {req.FamilySoloParent},
    FamilyIndigenous = {req.FamilyIndigenous},
    FamilyInformalSettler = {req.FamilyInformalSettler},
    IsPwd = {req.IsPwd},
    PwdType = {req.PwdType}
WHERE ResidentId = {id}
");

        if (affected == 0) return NotFound();
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
    string? PwdType
);
