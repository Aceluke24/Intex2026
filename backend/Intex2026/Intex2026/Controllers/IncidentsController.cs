using Intex2026.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/incidents")]
[Authorize(Roles = "Admin")]
public class IncidentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public IncidentsController(AppDbContext db) => _db = db;

    /// <summary>Mark an incident as resolved (persisted). Returns JSON for easier client handling than 204.</summary>
    [HttpPatch("{id:int}/resolve")]
    public async Task<IActionResult> Resolve(int id, CancellationToken ct)
    {
        var incident = await _db.IncidentReports.FirstOrDefaultAsync(i => i.IncidentId == id, ct);
        if (incident == null)
            return NotFound();

        incident.Resolved = true;
        incident.ResolutionDate = DateOnly.FromDateTime(DateTime.Today);
        await _db.SaveChangesAsync(ct);

        return Ok(new { ok = true, incidentId = id });
    }
}
