using System.Diagnostics;
using System.Text.RegularExpressions;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

public record VisitationListItemDto(
    int Id,
    int ResidentId,
    string ResidentName,
    string CaseId,
    string VisitType,
    string Category,
    string Date,
    string Time,
    string Notes,
    string? Observations,
    string? Purpose,
    string? FollowUpNotes,
    string StaffName,
    string Status,
    bool SafetyFlag);

[ApiController]
[Route("api/visitations")]
[Authorize(Roles = "Admin")]
public class HomeVisitationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<HomeVisitationsController> _logger;
    private readonly IHostEnvironment _env;

    public HomeVisitationsController(AppDbContext db, ILogger<HomeVisitationsController> logger, IHostEnvironment env)
    {
        _db = db;
        _logger = logger;
        _env = env;
    }

    /// <summary>
    /// GET /api/visitations — paginated visitations (newest first). Optional filters.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] int? residentId = null,
        [FromQuery] string? visitDateFrom = null,
        [FromQuery] string? visitDateTo = null,
        [FromQuery] string? coordinationKind = null,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 25;

        DateOnly? from = null;
        DateOnly? to = null;
        if (!string.IsNullOrWhiteSpace(visitDateFrom) && DateOnly.TryParse(visitDateFrom, out var df))
            from = df;
        if (!string.IsNullOrWhiteSpace(visitDateTo) && DateOnly.TryParse(visitDateTo, out var dt))
            to = dt;

        var sw = Stopwatch.StartNew();

        var filtered = _db.HomeVisitations.AsNoTracking().AsQueryable();
        if (residentId.HasValue)
            filtered = filtered.Where(h => h.ResidentId == residentId.Value);
        if (from.HasValue)
            filtered = filtered.Where(h => h.VisitDate >= from.Value);
        if (to.HasValue)
            filtered = filtered.Where(h => h.VisitDate <= to.Value);

        var homeVisitTotal = await filtered.Where(h =>
                !(h.CoordinationKind == "CaseConference"
                  || ((h.CoordinationKind == null || h.CoordinationKind == "")
                      && h.VisitType != null
                      && EF.Functions.Like(h.VisitType, "%conference%"))))
            .CountAsync(ct);
        var conferenceTotal = await filtered.Where(h =>
                h.CoordinationKind == "CaseConference"
                || ((h.CoordinationKind == null || h.CoordinationKind == "")
                    && h.VisitType != null
                    && EF.Functions.Like(h.VisitType, "%conference%")))
            .CountAsync(ct);

        var pageQuery = filtered;
        if (!string.IsNullOrWhiteSpace(coordinationKind))
        {
            if (string.Equals(coordinationKind.Trim(), "CaseConference", StringComparison.OrdinalIgnoreCase))
            {
                pageQuery = pageQuery.Where(h =>
                    h.CoordinationKind == "CaseConference"
                    || ((h.CoordinationKind == null || h.CoordinationKind == "")
                        && h.VisitType != null
                        && EF.Functions.Like(h.VisitType, "%conference%")));
            }
            else if (string.Equals(coordinationKind.Trim(), "HomeVisit", StringComparison.OrdinalIgnoreCase))
            {
                pageQuery = pageQuery.Where(h =>
                    !(h.CoordinationKind == "CaseConference"
                      || ((h.CoordinationKind == null || h.CoordinationKind == "")
                          && h.VisitType != null
                          && EF.Functions.Like(h.VisitType, "%conference%"))));
            }
        }

        var total = await pageQuery.CountAsync(ct);

        var rows = await pageQuery
            .Include(h => h.Resident)
            .OrderByDescending(h => h.VisitDate)
            .ThenByDescending(h => h.VisitationId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = rows.Select(MapToListDto).ToList();
        sw.Stop();

        if (_env.IsDevelopment())
        {
            _logger.LogInformation(
                "GET /api/visitations page={Page} pageSize={PageSize} totalRows={Total} returned={Returned} homeVisitTotal={Hv} conferenceTotal={Cc} ms={Ms}",
                page, pageSize, total, items.Count, homeVisitTotal, conferenceTotal, sw.ElapsedMilliseconds);
        }

        return Ok(new
        {
            total,
            page,
            pageSize,
            homeVisitTotal,
            conferenceTotal,
            items
        });
    }

    /// <summary>Distinct intervention / follow-up tokens from all visitations (for form dropdowns).</summary>
    [HttpGet("field-options")]
    public async Task<IActionResult> GetFieldOptions(CancellationToken ct)
    {
        var purposes = await _db.HomeVisitations.AsNoTracking()
            .Where(h => h.Purpose != null && h.Purpose != "")
            .Select(h => h.Purpose!)
            .ToListAsync(ct);
        var followNotes = await _db.HomeVisitations.AsNoTracking()
            .Where(h => h.FollowUpNotes != null && h.FollowUpNotes != "")
            .Select(h => h.FollowUpNotes!)
            .ToListAsync(ct);

        var interventionLabels = new HashSet<string>(StringComparer.Ordinal);
        foreach (var p in purposes)
        {
            foreach (var part in p.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (part.Length > 0) interventionLabels.Add(part);
            }
        }

        var followUpLabels = new HashSet<string>(StringComparer.Ordinal);
        foreach (var n in followNotes)
        {
            foreach (var part in n.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (part.Length > 0) followUpLabels.Add(part);
            }
        }

        var interventionOptions = interventionLabels
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .Select(label => new { value = TokenId(label), label })
            .ToList();
        var followUpOptions = followUpLabels
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .Select(label => new { value = TokenId(label), label })
            .ToList();

        return Ok(new { interventionOptions, followUpOptions });
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


    private static string TokenId(string label)
    {
        var s = Regex.Replace(label.Trim().ToLowerInvariant(), @"[^a-z0-9]+", "-");
        s = Regex.Replace(s, @"^-+|-+$", "");
        return string.IsNullOrEmpty(s) ? "item" : s;
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
        if (string.IsNullOrWhiteSpace(kind) && (v.VisitType ?? string.Empty).Contains("conference", StringComparison.OrdinalIgnoreCase))
        {
            kind = "CaseConference";
        }
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
            v.ResidentId,
            residentName,
            caseId,
            visitTypeApi,
            MapCategory(v.VisitType),
            dateStr,
            timeStr,
            notes,
            v.Observations,
            v.Purpose,
            v.FollowUpNotes,
            v.SocialWorker,
            DeriveStatus(v.VisitDate, v.FollowUpNeeded),
            v.SafetyConcernsNoted);
    }

    private static string MapCategory(string? visitType)
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
