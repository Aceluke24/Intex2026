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
        var query = _db.ProcessRecordings.AsQueryable();
        if (residentId.HasValue) query = query.Where(r => r.ResidentId == residentId.Value);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(r => r.SessionDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _db.ProcessRecordings.Include(p => p.Resident).FirstOrDefaultAsync(p => p.RecordingId == id);
        return r == null ? NotFound() : Ok(r);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProcessRecording recording)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
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
