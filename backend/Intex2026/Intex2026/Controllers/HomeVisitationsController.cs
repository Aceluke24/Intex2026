using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

public record VisitationListItemDto(
    int Id,
    string ResidentName,
    string CaseId,
    string VisitType,
    string Category,
    string Date,
    string Time,
    string Notes,
    string StaffName,
    string Status,
    bool SafetyFlag);

[ApiController]
[Route("api/visitations")]
[Authorize(Roles = "Admin")]
public class HomeVisitationsController : ControllerBase
{
    private readonly AppDbContext _db;
    public HomeVisitationsController(AppDbContext db) => _db = db;

    /// <summary>GET /api/visitations — all visitations for admin (newest first).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var rows = await _db.HomeVisitations
            .AsNoTracking()
            .Include(h => h.Resident)
            .OrderByDescending(h => h.VisitDate)
            .ThenByDescending(h => h.VisitationId)
            .ToListAsync(ct);

        var items = rows.Select(MapToListDto).ToList();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var v = await _db.HomeVisitations.Include(h => h.Resident).FirstOrDefaultAsync(h => h.VisitationId == id);
        return v == null ? NotFound() : Ok(v);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HomeVisitation visitation)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        _db.HomeVisitations.Add(visitation);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = visitation.VisitationId }, visitation);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] HomeVisitation visitation)
    {
        if (id != visitation.VisitationId) return BadRequest();
        _db.Entry(visitation).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool confirm = false)
    {
        if (!confirm) return BadRequest(new { message = "Pass ?confirm=true to confirm deletion." });
        var v = await _db.HomeVisitations.FindAsync(id);
        if (v == null) return NotFound();
        _db.HomeVisitations.Remove(v);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static VisitationListItemDto MapToListDto(HomeVisitation v)
    {
        var r = v.Resident;
        var caseId = r == null
            ? ""
            : (string.IsNullOrWhiteSpace(r.CaseControlNo) ? r.InternalCode : r.CaseControlNo);
        var residentName = r == null
            ? $"Resident #{v.ResidentId}"
            : (string.IsNullOrWhiteSpace(r.InternalCode) ? $"Resident #{r.ResidentId}" : $"Resident {r.InternalCode}");

        var kind = (v.CoordinationKind ?? "").Trim();
        var visitTypeApi = string.Equals(kind, "CaseConference", StringComparison.OrdinalIgnoreCase)
            ? "CaseConference"
            : "HomeVisit";

        var notes = string.Join(
            " ",
            new[] { v.Purpose, v.Observations }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim();
        if (string.IsNullOrEmpty(notes))
            notes = "—";

        var dateStr = v.VisitDate.ToString("yyyy-MM-dd");
        var timeStr = string.IsNullOrWhiteSpace(v.VisitTime) ? "—" : v.VisitTime!.Trim();

        return new VisitationListItemDto(
            v.VisitationId,
            residentName,
            caseId,
            visitTypeApi,
            MapCategory(v.VisitType),
            dateStr,
            timeStr,
            notes,
            v.SocialWorker,
            DeriveStatus(v.VisitDate, v.FollowUpNeeded),
            v.SafetyConcernsNoted);
    }

    private static string MapCategory(string visitType)
    {
        var t = (visitType ?? "").Trim();
        if (t.Contains("Emergency", StringComparison.OrdinalIgnoreCase))
            return "Emergency";
        if (t.Contains("Reintegration", StringComparison.OrdinalIgnoreCase))
            return "Reintegration";
        if (t.Contains("Initial", StringComparison.OrdinalIgnoreCase))
            return "InitialAssessment";
        return "RoutineFollowUp";
    }

    private static string DeriveStatus(DateOnly visitDate, bool followUpNeeded)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        if (visitDate > today)
            return "Scheduled";
        if (followUpNeeded)
            return "Pending";
        return "Completed";
    }
}
