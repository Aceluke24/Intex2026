using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/goals")]
[Authorize(Roles = "Admin")]
public class GoalsController : ControllerBase
{
    private readonly AppDbContext _db;
    public GoalsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var query = _db.OrganizationalGoals.AsNoTracking().Include(g => g.Safehouse).AsQueryable();

        if (activeOnly == true)
            query = query.Where(g => g.PeriodStart <= today && g.PeriodEnd >= today);

        var goals = await query.OrderByDescending(g => g.CreatedAt).ToListAsync(ct);

        return Ok(goals.Select(g => new
        {
            g.GoalId,
            g.GoalCategory,
            g.SafehouseId,
            SafehouseName = g.Safehouse?.Name,
            g.TargetValue,
            g.PeriodStart,
            g.PeriodEnd,
            g.Description,
            g.CreatedBy,
            g.CreatedAt,
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GoalDto dto, CancellationToken ct)
    {
        var goal = new OrganizationalGoal
        {
            GoalCategory = dto.GoalCategory,
            SafehouseId = dto.SafehouseId,
            TargetValue = dto.TargetValue,
            PeriodStart = dto.PeriodStart,
            PeriodEnd = dto.PeriodEnd,
            Description = dto.Description,
            CreatedBy = dto.CreatedBy,
            CreatedAt = DateTime.UtcNow,
        };
        _db.OrganizationalGoals.Add(goal);
        await _db.SaveChangesAsync(ct);
        return Ok(new { goal.GoalId });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] GoalDto dto, CancellationToken ct)
    {
        var goal = await _db.OrganizationalGoals.FindAsync([id], ct);
        if (goal == null) return NotFound();

        goal.GoalCategory = dto.GoalCategory;
        goal.SafehouseId = dto.SafehouseId;
        goal.TargetValue = dto.TargetValue;
        goal.PeriodStart = dto.PeriodStart;
        goal.PeriodEnd = dto.PeriodEnd;
        goal.Description = dto.Description;
        goal.CreatedBy = dto.CreatedBy;

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var goal = await _db.OrganizationalGoals.FindAsync([id], ct);
        if (goal == null) return NotFound();
        _db.OrganizationalGoals.Remove(goal);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record GoalDto(
    string GoalCategory,
    int? SafehouseId,
    decimal TargetValue,
    DateOnly PeriodStart,
    DateOnly PeriodEnd,
    string? Description,
    string? CreatedBy
);
