using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/visitations")]
[Authorize(Roles = "Admin")]
public class HomeVisitationsController : ControllerBase
{
    private readonly AppDbContext _db;
    public HomeVisitationsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var query = _db.HomeVisitations.AsQueryable();
        if (residentId.HasValue) query = query.Where(v => v.ResidentId == residentId.Value);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(v => v.VisitDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
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
}
