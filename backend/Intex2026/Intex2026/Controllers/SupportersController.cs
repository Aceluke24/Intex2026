using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/supporters")]
[Authorize(Roles = "Admin")]
public class SupportersController : ControllerBase
{
    private readonly AppDbContext _db;
    public SupportersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? supporterType,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var query = _db.Supporters.AsQueryable();
        if (!string.IsNullOrWhiteSpace(supporterType)) query = query.Where(s => s.SupporterType == supporterType);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(s => s.Status == status);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.DisplayName.Contains(search) ||
                (s.Email != null && s.Email.Contains(search)) ||
                (s.FirstName != null && s.FirstName.Contains(search)) ||
                (s.LastName != null && s.LastName.Contains(search)));
        var total = await query.CountAsync();
        var items = await query.OrderBy(s => s.DisplayName).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var s = await _db.Supporters.FindAsync(id);
        return s == null ? NotFound() : Ok(s);
    }

    // GET /api/supporters/{id}/donations
    [HttpGet("{id:int}/donations")]
    public async Task<IActionResult> GetDonations(int id)
    {
        var donations = await _db.Donations
            .Where(d => d.SupporterId == id)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();
        return Ok(donations);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Supporter supporter)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (supporter.SupporterId <= 0)
        {
            supporter.SupporterId = (await _db.Supporters.Select(s => (int?)s.SupporterId).MaxAsync() ?? 0) + 1;
        }
        supporter.CreatedAt = DateTime.UtcNow;
        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = supporter.SupporterId }, supporter);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Supporter supporter)
    {
        if (id != supporter.SupporterId) return BadRequest();
        _db.Entry(supporter).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool confirm = false)
    {
        if (!confirm) return BadRequest(new { message = "Pass ?confirm=true to confirm deletion." });
        var s = await _db.Supporters.FindAsync(id);
        if (s == null) return NotFound();
        _db.Supporters.Remove(s);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
