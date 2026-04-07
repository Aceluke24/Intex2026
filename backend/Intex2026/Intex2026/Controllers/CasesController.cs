using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/cases")]
[Authorize(Roles = "Admin")]
public class CasesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CasesController(AppDbContext db) => _db = db;

    /// <summary>GET /api/cases — full caseload for admin inventory (same auth as residents).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var rows = await _db.Residents
            .AsNoTracking()
            .Include(r => r.Safehouse)
            .OrderByDescending(r => r.DateOfAdmission)
            .ToListAsync(ct);

        var items = rows.Select(MapToDto).ToList();
        return Ok(items);
    }

    private static CaseListItemDto MapToDto(Resident r)
    {
        var safehouseName = r.Safehouse?.Name ?? $"Safehouse #{r.SafehouseId}";
        var caseId = string.IsNullOrWhiteSpace(r.CaseControlNo) ? r.InternalCode : r.CaseControlNo;
        var residentName = string.IsNullOrWhiteSpace(r.InternalCode)
            ? $"Resident #{r.ResidentId}"
            : $"Resident {r.InternalCode}";

        var status = DeriveDisplayStatus(r);
        var riskLabel = MapRiskLabel(r.CurrentRiskLevel);
        var progress = ReintegrationProgressPercent(r.ReintegrationStatus);
        var lastUpdated = LastUpdatedDate(r);

        return new CaseListItemDto(
            r.ResidentId,
            caseId,
            residentName,
            r.CaseCategory,
            BuildSubcategory(r),
            safehouseName,
            r.AssignedSocialWorker,
            r.DateOfAdmission.ToString("yyyy-MM-dd"),
            status,
            progress,
            lastUpdated.ToString("yyyy-MM-dd"),
            riskLabel
        );
    }

    private static string DeriveDisplayStatus(Resident r)
    {
        var cs = (r.CaseStatus ?? "").Trim();
        if (cs.Equals("Closed", StringComparison.OrdinalIgnoreCase))
            return "Closed";
        if (cs.Equals("Transferred", StringComparison.OrdinalIgnoreCase))
            return "Transferred";

        var risk = (r.CurrentRiskLevel ?? "").Trim();
        if (risk is "High" or "Critical")
            return "HighRisk";

        var reint = (r.ReintegrationStatus ?? "").Trim();
        if (reint is "In Progress" or "On Hold")
            return "Reintegration";

        if (cs.Equals("Active", StringComparison.OrdinalIgnoreCase))
            return "Active";

        return "Pending";
    }

    private static int ReintegrationProgressPercent(string? status)
    {
        var s = (status ?? "").Trim();
        return s switch
        {
            "Completed" => 100,
            "In Progress" => 60,
            "On Hold" => 40,
            "Not Started" => 0,
            _ => 0
        };
    }

    private static string MapRiskLabel(string? current)
    {
        var x = (current ?? "").Trim();
        return x switch
        {
            "High" or "Critical" => "High",
            "Medium" => "Elevated",
            _ => "Standard"
        };
    }

    private static DateOnly LastUpdatedDate(Resident r)
    {
        var dates = new List<DateOnly> { DateOnly.FromDateTime(r.CreatedAt) };
        if (r.DateCaseStudyPrepared.HasValue)
            dates.Add(r.DateCaseStudyPrepared.Value);
        if (r.DateClosed.HasValue)
            dates.Add(r.DateClosed.Value);
        return dates.Max();
    }

    private static string BuildSubcategory(Resident r)
    {
        var parts = new List<string>();
        if (r.SubCatOrphaned) parts.Add("Orphaned");
        if (r.SubCatTrafficked) parts.Add("Trafficking");
        if (r.SubCatChildLabor) parts.Add("Child labor");
        if (r.SubCatPhysicalAbuse) parts.Add("Physical abuse");
        if (r.SubCatSexualAbuse) parts.Add("Sexual abuse");
        if (r.SubCatOsaec) parts.Add("OSAEC");
        if (r.SubCatCicl) parts.Add("CICL");
        if (r.SubCatAtRisk) parts.Add("At risk");
        if (r.SubCatStreetChild) parts.Add("Street child");
        if (r.SubCatChildWithHiv) parts.Add("Child with HIV");
        return parts.Count > 0 ? string.Join(" · ", parts) : "—";
    }

    private sealed record CaseListItemDto(
        int ResidentId,
        string CaseId,
        string ResidentName,
        string Category,
        string Subcategory,
        string Safehouse,
        string? AssignedWorker,
        string AdmissionDate,
        string Status,
        int ReintegrationProgress,
        string LastUpdated,
        string RiskLevel
    );
}
