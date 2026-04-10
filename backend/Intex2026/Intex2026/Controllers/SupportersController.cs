using System.Text.RegularExpressions;
using System.Text.Json;
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

    private static string? DigitsOnly(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return null;
        var d = Regex.Replace(phone, @"\D", "");
        return d.Length == 0 ? null : d;
    }

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
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        static string? GetString(JsonElement el, params string[] names)
        {
            foreach (var name in names)
            {
                if (el.ValueKind == JsonValueKind.Object && el.TryGetProperty(name, out var p))
                {
                    if (p.ValueKind == JsonValueKind.Null) return null;
                    if (p.ValueKind == JsonValueKind.String) return p.GetString();
                    // tolerate numbers/bools being sent accidentally
                    return p.ToString();
                }
            }
            return null;
        }

        static string? EmptyToNull(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;
            var t = s.Trim();
            return t.Length == 0 ? null : t;
        }

        // Accept both snake_case (DB-style) and camelCase/PascalCase (C#-style).
        var supporterType = EmptyToNull(GetString(body, "supporter_type", "supporterType", "SupporterType"));
        var firstName = EmptyToNull(GetString(body, "first_name", "firstName", "FirstName"));
        var lastName = EmptyToNull(GetString(body, "last_name", "lastName", "LastName"));
        var organizationName = EmptyToNull(GetString(body, "organization_name", "organizationName", "OrganizationName"));
        var email = EmptyToNull(GetString(body, "email", "Email"));
        var phone = EmptyToNull(GetString(body, "phone", "Phone"));

        // Optional: allow callers to override defaults, but keep safe fallbacks for DB required fields.
        var relationshipType = EmptyToNull(GetString(body, "relationship_type", "relationshipType", "RelationshipType")) ?? "Local";
        var status = EmptyToNull(GetString(body, "status", "Status")) ?? "Active";

        // Conditional name requirements.
        var orgFilled = !string.IsNullOrWhiteSpace(organizationName);
        if (string.IsNullOrWhiteSpace(supporterType))
        {
            return BadRequest(new { message = "supporter_type is required." });
        }
        if (!orgFilled && (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName)))
        {
            return BadRequest(new { message = "first_name and last_name are required when organization_name is empty." });
        }
        if (orgFilled)
        {
            // Treat as organization; ignore person name fields if sent as empty strings.
            firstName = null;
            lastName = null;
        }
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { message = "email is required." });
        }
        if (string.IsNullOrWhiteSpace(phone))
        {
            return BadRequest(new { message = "phone is required." });
        }

        var displayName = orgFilled ? organizationName! : $"{firstName} {lastName}".Trim();
        if (string.IsNullOrWhiteSpace(displayName))
        {
            return BadRequest(new { message = "A display name could not be derived from the provided fields." });
        }

        var supporter = new Supporter
        {
            SupporterType = supporterType!,
            DisplayName = displayName,
            OrganizationName = orgFilled ? organizationName : null,
            FirstName = orgFilled ? null : firstName,
            LastName = orgFilled ? null : lastName,
            Email = email.Trim().ToLowerInvariant(),
            Phone = phone,
            RelationshipType = relationshipType,
            Status = status,
            Region = EmptyToNull(GetString(body, "region", "Region")),
            Country = EmptyToNull(GetString(body, "country", "Country")),
            AcquisitionChannel = EmptyToNull(GetString(body, "acquisition_channel", "acquisitionChannel", "AcquisitionChannel")),
        };

        var firstDonationRaw = EmptyToNull(GetString(body, "first_donation_date", "firstDonationDate", "FirstDonationDate"));
        if (!string.IsNullOrWhiteSpace(firstDonationRaw))
        {
            if (DateOnly.TryParse(firstDonationRaw, out var d))
            {
                supporter.FirstDonationDate = d;
            }
            else
            {
                return BadRequest(new { message = "first_donation_date must be an ISO date (YYYY-MM-DD) if provided." });
            }
        }

        if (!string.IsNullOrWhiteSpace(supporter.Email))
        {
            var duplicate = await _db.Supporters.AnyAsync(s => s.Email == supporter.Email);
            if (duplicate)
            {
                return Conflict(new { message = "A supporter with that email already exists." });
            }
        }

        var phoneDigits = DigitsOnly(supporter.Phone);
        var displayTrim = (supporter.DisplayName ?? "").Trim();
        if (phoneDigits != null && displayTrim.Length > 0)
        {
            var dupNamePhone = await _db.Supporters.AnyAsync(s =>
                DigitsOnly(s.Phone) == phoneDigits &&
                string.Equals((s.DisplayName ?? "").Trim(), displayTrim, StringComparison.OrdinalIgnoreCase));
            if (dupNamePhone)
            {
                return Conflict(new { message = "A supporter with the same display name and phone already exists." });
            }
        }
        supporter.CreatedAt = DateTime.UtcNow;
        _db.Supporters.Add(supporter);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException e)
        {
            // Surface the most useful bit without leaking full internals.
            var msg = e.InnerException?.Message ?? e.Message;
            return BadRequest(new { message = $"Failed to create supporter: {msg}" });
        }
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
