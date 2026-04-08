using System.Globalization;
using Intex2026.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/finance-dashboard")]
[Authorize(Roles = "Admin")]
public class FinanceDashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public FinanceDashboardController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string period = "month", CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var donations = await _db.Donations.AsNoTracking().Include(d => d.Supporter).ToListAsync(ct);
        var supporters = await _db.Supporters.AsNoTracking().ToListAsync(ct);
        var allocations = await _db.DonationAllocations.AsNoTracking().ToListAsync(ct);
        var expenses = await _db.Expenses.AsNoTracking().ToListAsync(ct);
        var goals = await _db.OrganizationalGoals.AsNoTracking().ToListAsync(ct);

        // KPI: monetary donations this month
        var monetaryThisMonth = donations
            .Where(d => d.DonationType == "Monetary" && d.DonationDate >= monthStart && d.DonationDate <= monthEnd)
            .Sum(d => d.Amount ?? 0);

        // KPI: in-kind estimated value this month
        var inKindThisMonth = donations
            .Where(d => d.DonationType == "InKind" && d.DonationDate >= monthStart && d.DonationDate <= monthEnd)
            .Sum(d => d.EstimatedValue ?? d.Amount ?? 0);

        // KPI: expenses this month
        var expensesThisMonth = expenses
            .Where(e => e.ExpenseDate >= monthStart && e.ExpenseDate <= monthEnd)
            .Sum(e => e.Amount);

        // KPI: net position this month
        var netThisMonth = monetaryThisMonth - expensesThisMonth;

        // KPI: active donors (last 90 days)
        var cutoff = today.AddDays(-90);
        var recentDonorIds = donations
            .Where(d => d.DonationDate >= cutoff)
            .Select(d => d.SupporterId)
            .Distinct()
            .ToHashSet();
        var activeDonorCount = supporters.Count(s => s.Status == "Active" && recentDonorIds.Contains(s.SupporterId));

        // Income vs spending — last 12 months
        var months = BuildMonths(today, 12);
        var incomeVsSpending = months.Select(m => new
        {
            m.Label,
            Income = (double)donations
                .Where(d => d.DonationType == "Monetary" && d.DonationDate >= m.Start && d.DonationDate <= m.End)
                .Sum(d => d.Amount ?? 0),
            Spending = (double)expenses
                .Where(e => e.ExpenseDate >= m.Start && e.ExpenseDate <= m.End)
                .Sum(e => e.Amount),
        }).ToList();

        // Donations by program area
        var byProgramArea = allocations
            .GroupBy(a => a.ProgramArea)
            .Select(g => new { ProgramArea = g.Key, Total = (double)g.Sum(a => a.AmountAllocated) })
            .OrderByDescending(x => x.Total)
            .ToList();

        // Spending by category (filter by period)
        DateOnly spendStart = period switch
        {
            "quarter" => new DateOnly(today.Year, ((today.Month - 1) / 3) * 3 + 1, 1),
            "year" => new DateOnly(today.Year, 1, 1),
            _ => monthStart,
        };
        var byCategory = expenses
            .Where(e => e.ExpenseDate >= spendStart && e.ExpenseDate <= today)
            .GroupBy(e => e.Category)
            .Select(g => new { Category = g.Key, Total = (double)g.Sum(e => e.Amount) })
            .OrderByDescending(x => x.Total)
            .ToList();

        // Top 10 donors
        var donorTotals = donations
            .Where(d => d.DonationType == "Monetary")
            .GroupBy(d => d.SupporterId)
            .Select(g => new
            {
                SupporterId = g.Key,
                TotalMonetary = g.Sum(d => d.Amount ?? 0),
                LastDonation = g.Max(d => d.DonationDate),
                DonationCount = g.Count(),
            })
            .OrderByDescending(x => x.TotalMonetary)
            .Take(10)
            .ToList();

        var topDonors = donorTotals.Select(dt =>
        {
            var s = supporters.FirstOrDefault(x => x.SupporterId == dt.SupporterId);
            return new
            {
                SupporterId = dt.SupporterId,
                DisplayName = s?.DisplayName ?? "Unknown",
                SupporterType = s?.SupporterType,
                Status = s?.Status,
                TotalMonetary = (double)dt.TotalMonetary,
                LastDonation = dt.LastDonation,
            };
        }).ToList();

        // Monetary donation goal progress
        var donationGoal = goals
            .Where(g => g.GoalCategory == "MonetaryDonations" && g.PeriodStart <= today && g.PeriodEnd >= today)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                g.GoalId,
                g.Description,
                g.TargetValue,
                CurrentValue = (double)donations
                    .Where(d => d.DonationType == "Monetary" && d.DonationDate >= g.PeriodStart && d.DonationDate <= g.PeriodEnd)
                    .Sum(d => d.Amount ?? 0),
                g.PeriodStart,
                g.PeriodEnd,
            })
            .FirstOrDefault();

        // Expense goal progress
        var expenseGoal = goals
            .Where(g => g.GoalCategory == "Expenses" && g.PeriodStart <= today && g.PeriodEnd >= today)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                g.GoalId,
                g.Description,
                g.TargetValue,
                CurrentValue = (double)expenses
                    .Where(e => e.ExpenseDate >= g.PeriodStart && e.ExpenseDate <= g.PeriodEnd)
                    .Sum(e => e.Amount),
                g.PeriodStart,
                g.PeriodEnd,
            })
            .FirstOrDefault();

        return Ok(new
        {
            kpis = new
            {
                monetaryThisMonth = (double)monetaryThisMonth,
                inKindThisMonth = (double)inKindThisMonth,
                expensesThisMonth = (double)expensesThisMonth,
                netThisMonth = (double)netThisMonth,
                activeDonorCount,
            },
            incomeVsSpending,
            byProgramArea,
            byCategory,
            topDonors,
            donationGoal,
            expenseGoal,
            spendingPeriod = period,
        });
    }

    private static List<(string Label, DateOnly Start, DateOnly End)> BuildMonths(DateOnly today, int count)
    {
        var result = new List<(string, DateOnly, DateOnly)>();
        for (var i = count - 1; i >= 0; i--)
        {
            var d = today.AddMonths(-i);
            var start = new DateOnly(d.Year, d.Month, 1);
            var end = start.AddMonths(1).AddDays(-1);
            var label = start.ToString("MMM yyyy", CultureInfo.InvariantCulture);
            result.Add((label, start, end));
        }
        return result;
    }
}
