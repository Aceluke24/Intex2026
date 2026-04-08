using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/recordings")]
[Authorize(Roles = "Admin")]
public class ProcessRecordingsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProcessRecordingsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var query = _db.ProcessRecordings.AsNoTracking().AsQueryable();
        if (residentId.HasValue) query = query.Where(r => r.ResidentId == residentId.Value);
        var total = await query.CountAsync();
        var rows = await query
            .Include(r => r.Resident)
            .OrderByDescending(r => r.SessionDate)
            .ThenByDescending(r => r.RecordingId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = rows.Select(r =>
        {
            var dateStr = r.SessionDate.ToString("yyyy-MM-dd");
            var residentName = ResidentDisplayName(r.Resident, r.ResidentId);
            return new
            {
                id = r.RecordingId,
                recordingId = r.RecordingId,
                residentId = r.ResidentId,
                sessionDate = dateStr,
                concernsFlagged = r.ConcernsFlagged,
                sessionType = r.SessionType,
                residentName,
                clinicianName = r.SocialWorker,
                emotionalState = r.EmotionalStateObserved,
                note = NotePreview(r.SessionNarrative),
                date = dateStr,
                caseId = $"PR-{r.RecordingId:D4}",
            };
        }).ToList();

        return Ok(new { total, page, pageSize, items });
    }

    private static string ResidentDisplayName(Resident? resident, int residentId)
    {
        if (resident == null) return $"Resident #{residentId}";
        if (string.IsNullOrWhiteSpace(resident.InternalCode)) return $"Resident #{residentId}";
        return $"Resident {resident.InternalCode}";
    }

    private static string? NotePreview(string? narrative)
    {
        if (string.IsNullOrEmpty(narrative)) return null;
        const int max = 220;
        return narrative.Length <= max ? narrative : narrative[..max] + "…";
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _db.ProcessRecordings
            .AsNoTracking()
            .Include(p => p.Resident)
            .FirstOrDefaultAsync(p => p.RecordingId == id);
        return r == null ? NotFound() : Ok(r);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProcessRecording recording)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (recording.RecordingId <= 0)
        {
            recording.RecordingId = (await _db.ProcessRecordings.Select(r => (int?)r.RecordingId).MaxAsync() ?? 0) + 1;
        }
        _db.ProcessRecordings.Add(recording);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = recording.RecordingId }, recording);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProcessRecording recording)
    {
        if (id != recording.RecordingId) return BadRequest();
        _db.Entry(recording).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool confirm = false)
    {
        if (!confirm) return BadRequest(new { message = "Pass ?confirm=true to confirm deletion." });
        var r = await _db.ProcessRecordings.FindAsync(id);
        if (r == null) return NotFound();
        _db.ProcessRecordings.Remove(r);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
