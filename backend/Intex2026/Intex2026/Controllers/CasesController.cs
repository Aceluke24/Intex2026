using System.Globalization;
using System.Text;
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

    /// <summary>GET /api/cases/export — filtered caseload as CSV (same auth as list).</summary>
    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string? status,
        [FromQuery] string? safehouse,
        [FromQuery] string? category,
        [FromQuery] string? worker,
        [FromQuery] string? search,
        [FromQuery] string? admissionFrom,
        [FromQuery] string? admissionTo,
        CancellationToken ct)
    {
        var rows = await _db.Residents
            .AsNoTracking()
            .Include(r => r.Safehouse)
            .OrderByDescending(r => r.DateOfAdmission)
            .ToListAsync(ct);

        var items = rows.Select(MapToDto)
            .Where(dto => MatchesExportFilters(dto, status, safehouse, category, worker, search, admissionFrom, admissionTo))
            .ToList();
        var csv = BuildCaseloadCsv(items);
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();
        return File(bytes, "text/csv", "caseload_export.csv");
    }

    private static bool MatchesExportFilters(
        CaseListItemDto dto,
        string? status,
        string? safehouse,
        string? category,
        string? worker,
        string? search,
        string? admissionFrom,
        string? admissionTo)
    {
        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status.Trim(), "All", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.Equals(dto.Status, status.Trim(), StringComparison.Ordinal))
                return false;
        }

        if (!string.IsNullOrWhiteSpace(safehouse) && !string.Equals(safehouse.Trim(), "All", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.Equals(dto.Safehouse, safehouse.Trim(), StringComparison.Ordinal))
                return false;
        }

        if (!string.IsNullOrWhiteSpace(category) && !string.Equals(category.Trim(), "All", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.Equals(dto.Category, category.Trim(), StringComparison.Ordinal))
                return false;
        }

        if (!string.IsNullOrWhiteSpace(worker) && !string.Equals(worker.Trim(), "All", StringComparison.OrdinalIgnoreCase))
        {
            var w = worker.Trim();
            var assigned = string.IsNullOrWhiteSpace(dto.AssignedWorker) ? "—" : dto.AssignedWorker.Trim();
            if (!string.Equals(assigned, w, StringComparison.Ordinal))
                return false;
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            var blob = string.Join(' ',
                new[] { dto.ResidentName, dto.CaseId, dto.Category, dto.Subcategory }).ToLowerInvariant();
            if (!blob.Contains(q, StringComparison.Ordinal))
                return false;
        }

        if (DateOnly.TryParse((admissionFrom ?? "").Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var fromDt))
        {
            if (!DateOnly.TryParse(dto.AdmissionDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var admDt))
                return false;
            if (admDt < fromDt)
                return false;
        }

        if (DateOnly.TryParse((admissionTo ?? "").Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var toDt))
        {
            if (!DateOnly.TryParse(dto.AdmissionDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var admDt))
                return false;
            if (admDt > toDt)
                return false;
        }

        return true;
    }

    private static string CsvCell(string? value)
    {
        var s = value ?? "";
        if (s.Contains('"', StringComparison.Ordinal))
            s = s.Replace("\"", "\"\"", StringComparison.Ordinal);
        if (s.IndexOfAny([',', '"', '\r', '\n']) >= 0)
            return $"\"{s}\"";
        return s;
    }

    private static string BuildCaseloadCsv(IReadOnlyList<CaseListItemDto> rows)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",",
            CsvCell("Resident Name"),
            CsvCell("Resident ID"),
            CsvCell("Status"),
            CsvCell("Safehouse"),
            CsvCell("Case Type"),
            CsvCell("Risk Level"),
            CsvCell("Admission Date")));

        foreach (var dto in rows)
        {
            sb.AppendLine(string.Join(",",
                CsvCell(dto.ResidentName),
                CsvCell(dto.CaseId),
                CsvCell(dto.Status),
                CsvCell(dto.Safehouse),
                CsvCell(dto.Category),
                CsvCell(dto.RiskLevel),
                CsvCell(dto.AdmissionDate)));
        }

        return sb.ToString();
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
            r.BirthStatus,
            r.Religion,
            safehouseName,
            r.AssignedSocialWorker,
            r.DateOfAdmission.ToString("yyyy-MM-dd"),
            r.AgeUponAdmission,
            r.PresentAge,
            r.LengthOfStay,
            r.ReferringAgencyPerson,
            r.DateColbRegistered?.ToString("yyyy-MM-dd"),
            r.DateColbObtained?.ToString("yyyy-MM-dd"),
            r.DateCaseStudyPrepared?.ToString("yyyy-MM-dd"),
            r.ReintegrationType,
            r.ReintegrationStatus,
            r.DateClosed?.ToString("yyyy-MM-dd"),
            r.FamilyParentPwd,
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
        string? BirthStatus,
        string? Religion,
        string Safehouse,
        string? AssignedWorker,
        string AdmissionDate,
        string? AgeUponAdmission,
        string? PresentAge,
        string? LengthOfStay,
        string? ReferringAgencyPerson,
        string? DateColbRegistered,
        string? DateColbObtained,
        string? DateCaseStudyPrepared,
        string? ReintegrationType,
        string? ReintegrationStatus,
        string? DateClosed,
        bool FamilyParentPwd,
        string Status,
        int ReintegrationProgress,
        string LastUpdated,
        string RiskLevel
    );
}
