using System.Globalization;
using System.Text;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/donors")]
[Authorize(Roles = "Admin")]
public class DonorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public DonorsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var supporters = await _db.Supporters.AsNoTracking().OrderBy(s => s.DisplayName).ToListAsync(ct);
        var donations = await _db.Donations.AsNoTracking().ToListAsync(ct);
        var donationTypeNames = await _db.DonationTypes
            .AsNoTracking()
            .ToDictionaryAsync(dt => dt.Id, dt => dt.Name, ct);
        var donationBySup = donations.GroupBy(d => d.SupporterId).ToDictionary(g => g.Key, g => g.ToList());

        var today = DateTime.Today;
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        static decimal MoneyValue(Donation d)
        {
            if (d.DonationType == "Monetary") return d.Amount ?? 0;
            if (d.DonationType == "InKind") return d.EstimatedValue ?? d.Amount ?? 0;
            if (d.DonationType == "Time") return d.Amount ?? 0;
            return d.Amount ?? d.EstimatedValue ?? 0;
        }

        var items = supporters.Select(s =>
        {
            var ds = donationBySup.GetValueOrDefault(s.SupporterId) ?? new List<Donation>();
            var monetary = ds.Where(d => d.DonationType == "Monetary").Sum(d => d.Amount ?? 0);
            var inKind = ds.Where(d => d.DonationType == "InKind").Sum(d => d.EstimatedValue ?? d.Amount ?? 0);
            var timeHours = ds.Where(d => d.DonationType == "Time").Sum(d => d.Amount ?? 0);
            var skills = ds.Count(d => d.DonationType == "Skills");
            var social = ds.Count(d => d.DonationType == "SocialMedia");
            var total = ds.Sum(MoneyValue);
            var last = ds.Count > 0 ? ds.Max(d => d.DonationDate) : s.FirstDonationDate;
            var lastActivity = last.HasValue
                ? last.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : (s.CreatedAt != default ? s.CreatedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : "");

            return new SupporterItemDto(
                s.SupporterId.ToString(CultureInfo.InvariantCulture),
                s.DisplayName,
                s.Email ?? "",
                s.Phone ?? "",
                MapKind(s.SupporterType),
                s.Status == "Active" ? "Active" : "Inactive",
                (double)total,
                lastActivity,
                "",
                new ContributionBreakdownDto(
                    (double)monetary,
                    (double)timeHours,
                    skills,
                    (double)inKind,
                    social));
        }).ToList();

        var feed = donations
            .OrderByDescending(d => d.DonationDate)
            .ThenByDescending(d => d.DonationId)
            .Take(80)
            .Select(d =>
            {
                var name = supporters.FirstOrDefault(x => x.SupporterId == d.SupporterId)?.DisplayName ?? "Supporter";
                var (kind, desc, amt, hrs) = MapFeed(d, donationTypeNames);
                return new FeedEntryDto(
                    d.DonationId.ToString(CultureInfo.InvariantCulture),
                    name,
                    kind,
                    amt,
                    hrs,
                    desc,
                    d.DonationDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            })
            .ToList();

        var monthlyContributions = (decimal)donations
            .Where(d => d.DonationType == "Monetary" && d.DonationDate >= monthStart)
            .Sum(d => d.Amount ?? 0);

        var volunteerHours = donations.Where(d => d.DonationType == "Time").Sum(d => d.Amount ?? 0);
        var inKindValue = donations.Where(d => d.DonationType == "InKind").Sum(d => d.EstimatedValue ?? d.Amount ?? 0);

        var allocation = await BuildAllocationAsync(ct);

        var metrics = new DonorMetricsDto(
            supporters.Count,
            supporters.Count(s => s.Status == "Active"),
            (double)monthlyContributions,
            (double)volunteerHours,
            (double)inKindValue);

        return Ok(new DonorsDashboardDto(items, feed, metrics, allocation));
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct)
    {
        var supporters = await _db.Supporters.AsNoTracking().OrderBy(s => s.DisplayName).ToListAsync(ct);
        var donations = await _db.Donations.AsNoTracking().ToListAsync(ct);
        var donationBySup = donations.GroupBy(d => d.SupporterId).ToDictionary(g => g.Key, g => g.ToList());

        static decimal MoneyValue(Donation d)
        {
            if (d.DonationType == "Monetary") return d.Amount ?? 0;
            if (d.DonationType == "InKind") return d.EstimatedValue ?? d.Amount ?? 0;
            if (d.DonationType == "Time") return d.Amount ?? 0;
            return d.Amount ?? d.EstimatedValue ?? 0;
        }

        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",",
            CsvCell("Supporter ID"),
            CsvCell("Name"),
            CsvCell("Email"),
            CsvCell("Phone"),
            CsvCell("Type"),
            CsvCell("Status"),
            CsvCell("Total Contributions"),
            CsvCell("Last Activity")));

        foreach (var s in supporters)
        {
            var ds = donationBySup.GetValueOrDefault(s.SupporterId) ?? new List<Donation>();
            var total = ds.Sum(MoneyValue);
            var last = ds.Count > 0 ? ds.Max(d => d.DonationDate) : s.FirstDonationDate;
            var lastActivity = last.HasValue
                ? last.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : (s.CreatedAt != default ? s.CreatedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : "");

            sb.AppendLine(string.Join(",",
                CsvCell(s.SupporterId.ToString(CultureInfo.InvariantCulture)),
                CsvCell(s.DisplayName),
                CsvCell(s.Email ?? ""),
                CsvCell(s.Phone ?? ""),
                CsvCell(MapKind(s.SupporterType)),
                CsvCell(s.Status == "Active" ? "Active" : "Inactive"),
                CsvCell(total.ToString(CultureInfo.InvariantCulture)),
                CsvCell(lastActivity)));
        }

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(bytes, "text/csv", "donors_export.csv");
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

    private async Task<List<AllocationSliceDto>> BuildAllocationAsync(CancellationToken ct)
    {
        var byCampaign = await _db.Donations
            .AsNoTracking()
            .Where(d => d.CampaignName != null && d.DonationType == "Monetary")
            .GroupBy(d => d.CampaignName!)
            .Select(g => new { Label = g.Key, Total = g.Sum(d => d.Amount ?? 0) })
            .OrderByDescending(x => x.Total)
            .Take(8)
            .ToListAsync(ct);

        var colors = new[]
        {
            "hsl(340, 42%, 78%)", "hsl(350, 38%, 82%)", "hsl(330, 35%, 76%)",
            "hsl(25, 45%, 72%)", "hsl(43, 48%, 78%)", "hsl(150, 22%, 72%)",
            "hsl(210, 35%, 72%)", "hsl(36, 40%, 72%)"
        };

        var list = new List<AllocationSliceDto>();
        var i = 0;
        foreach (var row in byCampaign)
        {
            list.Add(new AllocationSliceDto(
                $"c{i}",
                row.Label ?? "Campaign",
                (double)row.Total,
                colors[i % colors.Length],
                "program"));
            i++;
        }

        var bySafehouse = await _db.Residents
            .AsNoTracking()
            .Include(r => r.Safehouse)
            .Where(r => r.CaseStatus == "Active" && r.Safehouse != null)
            .GroupBy(r => r.Safehouse!.Name)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        var j = 0;
        foreach (var row in bySafehouse)
        {
            list.Add(new AllocationSliceDto(
                $"sh{j}",
                row.Name ?? "Safehouse",
                row.Count * 1000.0,
                colors[(i + j) % colors.Length],
                "safehouse"));
            j++;
        }

        return list;
    }

    private static string MapKind(string t) => t switch
    {
        "MonetaryDonor" => "Monetary",
        "InKindDonor" => "Monetary",
        "Volunteer" => "Volunteer",
        "SkillsContributor" => "Skills",
        "SocialMediaAdvocate" => "Social",
        "PartnerOrganization" => "Social",
        _ => "Monetary"
    };

    private static (string kind, string desc, double? amount, double? hours) MapFeed(
        Donation d,
        IReadOnlyDictionary<int, string> donationTypeNames)
    {
        var donationTypeName = d.DonationTypeId.HasValue && donationTypeNames.TryGetValue(d.DonationTypeId.Value, out var resolvedName)
            ? resolvedName
            : null;

        return d.DonationType switch
        {
            "Monetary" => ("monetary", d.Notes ?? donationTypeName ?? d.CampaignName ?? "Monetary gift", (double)(d.Amount ?? 0), null),
            "InKind" => ("in-kind", d.Notes ?? "In-kind contribution", (double)(d.EstimatedValue ?? d.Amount ?? 0), null),
            "Time" => ("volunteer", d.Notes ?? "Volunteer time", null, (double)(d.Amount ?? 0)),
            "Skills" => ("skills", d.Notes ?? "Skills contribution", null, null),
            _ => ("social", d.Notes ?? donationTypeName ?? d.DonationType, null, null)
        };
    }

    private sealed record DonorsDashboardDto(
        List<SupporterItemDto> Supporters,
        List<FeedEntryDto> Feed,
        DonorMetricsDto Metrics,
        List<AllocationSliceDto> AllocationByDestination);

    private sealed record DonorMetricsDto(
        int TotalSupporters,
        int ActiveDonors,
        double MonthlyContributions,
        double VolunteerHoursLogged,
        double InKindValue);

    private sealed record ContributionBreakdownDto(
        double Monetary,
        double TimeHours,
        int SkillsSessions,
        double InKindValue,
        int SocialActions);

    private sealed record SupporterItemDto(
        string Id,
        string Name,
        string Email,
        string Phone,
        string Kind,
        string Status,
        double TotalContributionsValue,
        string LastActivity,
        string Notes,
        ContributionBreakdownDto Breakdown);

    private sealed record FeedEntryDto(
        string Id,
        string SupporterName,
        string Kind,
        double? Amount,
        double? Hours,
        string Description,
        string At);

    private sealed record AllocationSliceDto(
        string Id,
        string Label,
        double Value,
        string Fill,
        string Category);
}
