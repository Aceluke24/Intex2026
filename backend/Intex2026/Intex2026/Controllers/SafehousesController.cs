using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/safehouses")]
[Authorize(Roles = "Admin")]
public class SafehousesController : ControllerBase
{
    private readonly AppDbContext _db;
    public SafehousesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Safehouses.OrderBy(s => s.SafehouseCode).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var s = await _db.Safehouses.FindAsync(id);
        return s == null ? NotFound() : Ok(s);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Safehouse safehouse)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        _db.Safehouses.Add(safehouse);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = safehouse.SafehouseId }, safehouse);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Safehouse safehouse)
    {
        if (id != safehouse.SafehouseId) return BadRequest();
        _db.Entry(safehouse).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool confirm = false)
    {
        if (!confirm) return BadRequest(new { message = "Pass ?confirm=true to confirm deletion." });
        var s = await _db.Safehouses.FindAsync(id);
        if (s == null) return NotFound();
        _db.Safehouses.Remove(s);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
