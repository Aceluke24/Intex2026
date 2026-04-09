using Intex2026.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/donation-types")]
public class DonationTypesController : ControllerBase
{
    private readonly AppDbContext _db;

    public DonationTypesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var items = await _db.DonationTypes
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new { id = x.Id, name = x.Name })
            .ToListAsync(ct);

        return Ok(items);
    }
}
