using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/donations")]
public class DonationsController : ControllerBase
{
    private readonly AppDbContext _db;
    public DonationsController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? donationType,
        [FromQuery] string? campaignName,
        [FromQuery] int? supporterId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var query = _db.Donations.AsQueryable();
        if (!string.IsNullOrWhiteSpace(donationType)) query = query.Where(d => d.DonationType == donationType);
        if (!string.IsNullOrWhiteSpace(campaignName)) query = query.Where(d => d.CampaignName == campaignName);
        if (supporterId.HasValue) query = query.Where(d => d.SupporterId == supporterId.Value);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(d => d.DonationDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _db.Donations.Include(x => x.Supporter).FirstOrDefaultAsync(x => x.DonationId == id);
        return d == null ? NotFound() : Ok(d);
    }

    // GET /api/donations/mine — donors see their own donations
    [HttpGet("mine")]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> GetMyDonations()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        // Look up SupporterId from ApplicationUser
        var user = await _db.Users.FindAsync(userIdClaim) as Models.ApplicationUser;
        if (user?.SupporterId == null) return Ok(Array.Empty<object>());

        var donations = await _db.Donations
            .Where(d => d.SupporterId == user.SupporterId)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();
        return Ok(donations);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Donation donation)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = donation.DonationId }, donation);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Donation donation)
    {
        if (id != donation.DonationId) return BadRequest();
        _db.Entry(donation).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool confirm = false)
    {
        if (!confirm) return BadRequest(new { message = "Pass ?confirm=true to confirm deletion." });
        var d = await _db.Donations.FindAsync(id);
        if (d == null) return NotFound();
        _db.Donations.Remove(d);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
