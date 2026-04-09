using System.Globalization;
using System.Text;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    private static int ResolveMonthWindow(string? range)
    {
        return (range ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "3m" => 3,
            "6m" => 6,
            "9m" => 9,
            "1y" => 12,
            _ => 9,
        };
    }

    [HttpGet]
    public async Task<IActionResult> GetAnalytics([FromQuery] string? range, CancellationToken ct)
    {
        var residents = await _db.Residents.AsNoTracking().ToListAsync(ct);
        var donations = await _db.Donations.AsNoTracking().ToListAsync(ct);

        var totalCases = residents.Count;
        var activeCases = residents.Count(r => r.CaseStatus == "Active");
        var closedCases = residents.Count(r => r.CaseStatus == "Closed");
        var highRiskCases = residents.Count(r =>
        {
            var x = (r.CurrentRiskLevel ?? "").Trim();
            return r.CaseStatus == "Active" && x is "High" or "Critical";
        });

        var withReint = residents.Where(r =>
            !string.IsNullOrWhiteSpace(r.ReintegrationStatus) && r.ReintegrationStatus != "Not Started").ToList();
        var completedReint = withReint.Count(r => r.ReintegrationStatus == "Completed");
        var reintegrationRate = withReint.Count > 0 ? completedReint / (double)withReint.Count * 100.0 : 0.0;

        static decimal DonationMoney(Donation d)
        {
            if (d.DonationType == "Monetary") return d.Amount ?? 0;
            if (d.DonationType == "InKind") return d.EstimatedValue ?? d.Amount ?? 0;
            return d.Amount ?? d.EstimatedValue ?? 0;
        }

        var months = new List<(string Key, string Label, DateOnly Start, DateOnly End)>();
        var today = DateOnly.FromDateTime(DateTime.Today);
        var monthWindow = ResolveMonthWindow(range);
        for (var i = monthWindow - 1; i >= 0; i--)
        {
            var d = today.AddMonths(-i);
            var start = new DateOnly(d.Year, d.Month, 1);
            var end = start.AddMonths(1).AddDays(-1);
            var key = $"{d.Year}-{d.Month:00}";
            var label = start.ToString("MMM yyyy", CultureInfo.CurrentCulture);
            months.Add((key, label, start, end));
        }

        var monthlyAdmissions = new List<object>();
        var monthlyClosures = new List<object>();
        var donationTrends = new List<object>();
        var caseTrends = new List<object>();

        foreach (var m in months)
        {
            var adm = residents.Count(r => r.DateOfAdmission >= m.Start && r.DateOfAdmission <= m.End);
            var clo = residents.Count(r => r.DateClosed.HasValue && r.DateClosed.Value >= m.Start && r.DateClosed.Value <= m.End);
            monthlyAdmissions.Add(new { month = m.Label, count = adm });
            monthlyClosures.Add(new { month = m.Label, count = clo });

            var donTotal = donations
                .Where(d => $"{d.DonationDate.Year}-{d.DonationDate.Month:00}" == m.Key)
                .Sum(d => DonationMoney(d));
            donationTrends.Add(new { month = m.Label, total = (double)donTotal });

            var end = m.End;
            var activeSnapshot = residents.Count(r =>
                r.DateOfAdmission <= end &&
                (r.DateClosed == null || r.DateClosed > end) &&
                r.CaseStatus != "Transferred");
            var closedInMonth = residents.Count(r =>
                r.DateClosed.HasValue &&
                r.DateClosed.Value.Year == m.Start.Year &&
                r.DateClosed.Value.Month == m.Start.Month);
            caseTrends.Add(new
            {
                month = m.Label,
                active = activeSnapshot,
                closed = closedInMonth
            });
        }

        var safehouseDistribution = await _db.Residents
            .AsNoTracking()
            .Include(r => r.Safehouse)
            .Where(r => r.Safehouse != null)
            .GroupBy(r => r.Safehouse!.Name)
            .Select(g => new { safehouse = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync(ct);

        return Ok(new
        {
            totalCases,
            activeCases,
            closedCases,
            highRiskCases,
            reintegrationRate,
            monthlyAdmissions,
            monthlyClosures,
            donationTrends,
            caseTrends,
            safehouseDistribution
        });
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv([FromQuery] string? range, CancellationToken ct)
    {
        var residents = await _db.Residents.AsNoTracking().ToListAsync(ct);
        var donations = await _db.Donations.AsNoTracking().ToListAsync(ct);

        var totalCases = residents.Count;
        var activeCases = residents.Count(r => r.CaseStatus == "Active");
        var closedCases = residents.Count(r => r.CaseStatus == "Closed");
        var highRiskCases = residents.Count(r =>
        {
            var x = (r.CurrentRiskLevel ?? "").Trim();
            return r.CaseStatus == "Active" && x is "High" or "Critical";
        });

        var withReint = residents.Where(r =>
            !string.IsNullOrWhiteSpace(r.ReintegrationStatus) && r.ReintegrationStatus != "Not Started").ToList();
        var completedReint = withReint.Count(r => r.ReintegrationStatus == "Completed");
        var reintegrationRate = withReint.Count > 0 ? completedReint / (double)withReint.Count * 100.0 : 0.0;

        static decimal DonationMoney(Donation d)
        {
            if (d.DonationType == "Monetary") return d.Amount ?? 0;
            if (d.DonationType == "InKind") return d.EstimatedValue ?? d.Amount ?? 0;
            return d.Amount ?? d.EstimatedValue ?? 0;
        }

        var months = new List<(string Key, string Label, DateOnly Start, DateOnly End)>();
        var today = DateOnly.FromDateTime(DateTime.Today);
        var monthWindow = ResolveMonthWindow(range);
        for (var i = monthWindow - 1; i >= 0; i--)
        {
            var d = today.AddMonths(-i);
            var start = new DateOnly(d.Year, d.Month, 1);
            var end = start.AddMonths(1).AddDays(-1);
            var key = $"{d.Year}-{d.Month:00}";
            var label = start.ToString("MMM yyyy", CultureInfo.InvariantCulture);
            months.Add((key, label, start, end));
        }

        var sb = new StringBuilder();
        sb.AppendLine("Section,Metric,Value");
        sb.AppendLine(string.Join(",", CsvCell("Summary"), CsvCell("Total residents (cases)"), CsvCell(totalCases.ToString(CultureInfo.InvariantCulture))));
        sb.AppendLine(string.Join(",", CsvCell("Summary"), CsvCell("Active cases"), CsvCell(activeCases.ToString(CultureInfo.InvariantCulture))));
        sb.AppendLine(string.Join(",", CsvCell("Summary"), CsvCell("Closed cases"), CsvCell(closedCases.ToString(CultureInfo.InvariantCulture))));
        sb.AppendLine(string.Join(",", CsvCell("Summary"), CsvCell("High risk (active)"), CsvCell(highRiskCases.ToString(CultureInfo.InvariantCulture))));
        sb.AppendLine(string.Join(",", CsvCell("Summary"), CsvCell("Reintegration rate %"), CsvCell(reintegrationRate.ToString("0.##", CultureInfo.InvariantCulture))));
        sb.AppendLine(string.Join(",", CsvCell("Summary"), CsvCell("Range"), CsvCell((range ?? "9m").Trim())));

        sb.AppendLine();
        sb.AppendLine(string.Join(",", CsvCell("Month"), CsvCell("Admissions"), CsvCell("Closures"), CsvCell("Donations total")));

        foreach (var m in months)
        {
            var adm = residents.Count(r => r.DateOfAdmission >= m.Start && r.DateOfAdmission <= m.End);
            var clo = residents.Count(r => r.DateClosed.HasValue && r.DateClosed.Value >= m.Start && r.DateClosed.Value <= m.End);
            var donTotal = donations
                .Where(d => $"{d.DonationDate.Year}-{d.DonationDate.Month:00}" == m.Key)
                .Sum(d => DonationMoney(d));
            sb.AppendLine(string.Join(",",
                CsvCell(m.Label),
                CsvCell(adm.ToString(CultureInfo.InvariantCulture)),
                CsvCell(clo.ToString(CultureInfo.InvariantCulture)),
                CsvCell(donTotal.ToString(CultureInfo.InvariantCulture))));
        }

        var safehouseDistribution = await _db.Residents
            .AsNoTracking()
            .Include(r => r.Safehouse)
            .Where(r => r.Safehouse != null)
            .GroupBy(r => r.Safehouse!.Name)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        sb.AppendLine();
        sb.AppendLine(string.Join(",", CsvCell("Safehouse"), CsvCell("Resident count")));
        foreach (var row in safehouseDistribution)
            sb.AppendLine(string.Join(",", CsvCell(row.Name ?? ""), CsvCell(row.Count.ToString(CultureInfo.InvariantCulture))));

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(bytes, "text/csv", "reports_export.csv");
    }

    private static string CsvCell(string? value)
    {
        var v = value ?? "";
        if (v.Contains('"', StringComparison.Ordinal))
            v = v.Replace("\"", "\"\"", StringComparison.Ordinal);
        if (v.IndexOfAny([',', '"', '\r', '\n']) >= 0)
            return $"\"{v}\"";
        return v;
    }

    // GET /api/reports/donations — monthly donation totals grouped by month and type
    [HttpGet("donations")]
    public async Task<IActionResult> DonationTrends()
    {
        var data = await _db.Donations
            .Where(d => d.DonationType == "Monetary" && d.Amount.HasValue)
            .GroupBy(d => new { d.DonationDate.Year, d.DonationDate.Month })
            .Select(g => new
            {
                year = g.Key.Year,
                month = g.Key.Month,
                totalAmount = g.Sum(d => d.Amount ?? 0),
                count = g.Count()
            })
            .OrderBy(x => x.year).ThenBy(x => x.month)
            .ToListAsync();
        return Ok(data);
    }

    // GET /api/reports/residents — outcome metrics
    [HttpGet("residents")]
    public async Task<IActionResult> ResidentOutcomes()
    {
        var statusCounts = await _db.Residents
            .GroupBy(r => r.CaseStatus)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToListAsync();

        var riskCounts = await _db.Residents
            .GroupBy(r => r.CurrentRiskLevel)
            .Select(g => new { riskLevel = g.Key, count = g.Count() })
            .ToListAsync();

        var reintegrationCounts = await _db.Residents
            .Where(r => r.ReintegrationStatus != null)
            .GroupBy(r => r.ReintegrationStatus)
            .Select(g => new { reintegrationStatus = g.Key, count = g.Count() })
            .ToListAsync();

        return Ok(new { statusCounts, riskCounts, reintegrationCounts });
    }

    // GET /api/reports/safehouses — safehouse performance comparison
    [HttpGet("safehouses")]
    public async Task<IActionResult> SafehousePerformance()
    {
        var data = await _db.SafehouseMonthlyMetrics
            .Include(m => m.Safehouse)
            .GroupBy(m => new { m.SafehouseId, m.Safehouse!.Name })
            .Select(g => new
            {
                safehouseId = g.Key.SafehouseId,
                name = g.Key.Name,
                avgEducationProgress = g.Average(m => m.AvgEducationProgress),
                avgHealthScore = g.Average(m => m.AvgHealthScore),
                totalIncidents = g.Sum(m => m.IncidentCount),
                totalProcessRecordings = g.Sum(m => m.ProcessRecordingCount)
            })
            .ToListAsync();
        return Ok(data);
    }

    // GET /api/reports/reintegration — reintegration success rates
    [HttpGet("reintegration")]
    public async Task<IActionResult> ReintegrationRates()
    {
        var data = await _db.Residents
            .Where(r => r.ReintegrationType != null)
            .GroupBy(r => new { r.ReintegrationType, r.ReintegrationStatus })
            .Select(g => new
            {
                type = g.Key.ReintegrationType,
                status = g.Key.ReintegrationStatus,
                count = g.Count()
            })
            .ToListAsync();
        return Ok(data);
    }

    // GET /api/reports/campaigns — campaign effectiveness
    [HttpGet("campaigns")]
    public async Task<IActionResult> CampaignEffectiveness()
    {
        var data = await _db.Donations
            .Where(d => d.CampaignName != null && d.DonationType == "Monetary")
            .GroupBy(d => d.CampaignName)
            .Select(g => new
            {
                campaign = g.Key,
                totalAmount = g.Sum(d => d.Amount ?? 0),
                donorCount = g.Select(d => d.SupporterId).Distinct().Count(),
                donationCount = g.Count()
            })
            .OrderByDescending(x => x.totalAmount)
            .ToListAsync();
        return Ok(data);
    }
}
