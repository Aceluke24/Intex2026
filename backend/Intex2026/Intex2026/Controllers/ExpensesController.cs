using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/expenses")]
[Authorize(Roles = "Admin")]
public class ExpensesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ExpensesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? safehouseId,
        [FromQuery] string? category,
        [FromQuery] string? programArea,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct)
    {
        var query = _db.Expenses.AsNoTracking().Include(e => e.Safehouse).AsQueryable();

        if (safehouseId.HasValue)
            query = query.Where(e => e.SafehouseId == safehouseId);
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(e => e.Category == category);
        if (!string.IsNullOrWhiteSpace(programArea))
            query = query.Where(e => e.ProgramArea == programArea);
        if (from.HasValue)
            query = query.Where(e => e.ExpenseDate >= from.Value);
        if (to.HasValue)
            query = query.Where(e => e.ExpenseDate <= to.Value);

        var expenses = await query.OrderByDescending(e => e.ExpenseDate).ToListAsync(ct);

        var result = expenses.Select(e => new
        {
            e.ExpenseId,
            e.SafehouseId,
            SafehouseName = e.Safehouse?.Name,
            e.ProgramArea,
            e.Category,
            e.Amount,
            e.ExpenseDate,
            e.Description,
            e.RecordedBy,
            e.CreatedAt,
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ExpenseDto dto, CancellationToken ct)
    {
        var expense = new Expense
        {
            SafehouseId = dto.SafehouseId,
            ProgramArea = dto.ProgramArea,
            Category = dto.Category,
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate,
            Description = dto.Description,
            RecordedBy = dto.RecordedBy,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync(ct);
        return Ok(new { expense.ExpenseId });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ExpenseDto dto, CancellationToken ct)
    {
        var expense = await _db.Expenses.FindAsync([id], ct);
        if (expense == null) return NotFound();

        expense.SafehouseId = dto.SafehouseId;
        expense.ProgramArea = dto.ProgramArea;
        expense.Category = dto.Category;
        expense.Amount = dto.Amount;
        expense.ExpenseDate = dto.ExpenseDate;
        expense.Description = dto.Description;
        expense.RecordedBy = dto.RecordedBy;

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var expense = await _db.Expenses.FindAsync([id], ct);
        if (expense == null) return NotFound();
        _db.Expenses.Remove(expense);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record ExpenseDto(
    int? SafehouseId,
    string ProgramArea,
    string Category,
    decimal Amount,
    DateOnly ExpenseDate,
    string? Description,
    string? RecordedBy
);
