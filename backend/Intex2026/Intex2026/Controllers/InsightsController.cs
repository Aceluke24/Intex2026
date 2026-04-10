using Intex2026.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Intex2026.Controllers;

/// <summary>
/// AI/ML insights endpoints. Returns pre-computed or rule-based scores
/// while ML pipeline integration is in development.
/// </summary>
[ApiController]
[Route("api/insights")]
[Authorize(Roles = "Admin")]
public class InsightsController : ControllerBase
{
    private sealed class DonorRetentionMlRow
    {
        public int SupporterId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? SupporterType { get; set; }
        public DateOnly? LastDonationDate { get; set; }
        public double RepeatProbability180d { get; set; }
        public DateTime ScoredAt { get; set; }
        public string ModelVersion { get; set; } = string.Empty;
    }

    private sealed class ResidentRiskMlRow
    {
        public int ResidentId { get; set; }
        public string CaseControlNo { get; set; } = string.Empty;
        public string InternalCode { get; set; } = string.Empty;
        public string? CurrentRiskLevel { get; set; }
        public bool RiskEscalated { get; set; }
        public int RecentConcernsCount { get; set; }
        public int OpenIncidents { get; set; }
        public double RiskProbability { get; set; }
        public bool RiskFlag { get; set; }
        public DateTime ScoredAt { get; set; }
        public string ModelVersion { get; set; } = string.Empty;
    }

    private readonly AppDbContext _db;
    public InsightsController(AppDbContext db) => _db = db;

    // GET /api/insights/donor-churn
    // Returns a list of active donors with a churn risk score (0–1).
    // Score is rule-based: months since last donation / 12, capped at 1.
    // Replace with ML model output once pipeline is deployed.
    [HttpGet("donor-churn")]
    public async Task<IActionResult> DonorChurn()
    {
        var scored = await BuildRuleBasedDonorChurnAsync();
        return Ok(scored);
    }

    // GET /api/insights/donor-retention
    // Returns ML scores from ml.donor_scores when available.
    // Falls back to rule-based donor churn if ML data is unavailable.
    [HttpGet("donor-retention")]
    public async Task<IActionResult> DonorRetention()
    {
        try
        {
            var mlRows = await ReadMlRetentionRowsAsync();

            if (mlRows.Count == 0)
            {
                var fallbackRows = await BuildRuleBasedDonorChurnAsync();
                return Ok(new
                {
                    source = "rule-based",
                    message = "ML table is empty. Returned rule-based donor churn scores.",
                    rows = fallbackRows,
                });
            }

            var latestScoredAt = mlRows.Max(x => x.ScoredAt);
            var modelVersion = mlRows
                .OrderByDescending(x => x.ScoredAt)
                .Select(x => x.ModelVersion)
                .FirstOrDefault() ?? "unknown";

            var rows = mlRows
                .OrderByDescending(x => 1.0 - x.RepeatProbability180d)
                .Select(x => new
                {
                    x.SupporterId,
                    x.DisplayName,
                    x.Email,
                    x.SupporterType,
                    x.LastDonationDate,
                    repeatProbability180d = x.RepeatProbability180d,
                    churnRisk = 1.0 - x.RepeatProbability180d,
                    riskCategory = RiskCategoryFromChurn(1.0 - x.RepeatProbability180d),
                    scoredAt = x.ScoredAt,
                    x.ModelVersion,
                })
                .ToList();

            return Ok(new
            {
                source = "ml",
                modelVersion,
                scoredAt = latestScoredAt,
                rows,
            });
        }
        catch
        {
            var fallbackRows = await BuildRuleBasedDonorChurnAsync();
            return Ok(new
            {
                source = "rule-based",
                message = "ML table unavailable. Returned rule-based donor churn scores.",
                rows = fallbackRows,
            });
        }
    }

    private async Task<List<object>> BuildRuleBasedDonorChurnAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var data = await _db.Supporters
            .Where(s => s.Status == "Active" && s.FirstDonationDate.HasValue)
            .Select(s => new
            {
                s.SupporterId,
                s.DisplayName,
                s.Email,
                s.SupporterType,
                lastDonation = _db.Donations
                    .Where(d => d.SupporterId == s.SupporterId)
                    .OrderByDescending(d => d.DonationDate)
                    .Select(d => (DateOnly?)d.DonationDate)
                    .FirstOrDefault()
            })
            .ToListAsync();

        var scored = data.Select(s => new
        {
            s.SupporterId,
            s.DisplayName,
            s.Email,
            s.SupporterType,
            lastDonationDate = s.lastDonation,
            churnRisk = s.lastDonation.HasValue
                ? Math.Min(1.0, (today.DayNumber - s.lastDonation.Value.DayNumber) / 365.0)
                : 1.0,
            riskCategory = s.lastDonation.HasValue
                ? (today.DayNumber - s.lastDonation.Value.DayNumber) switch
                {
                    <= 90 => "Low",
                    <= 180 => "Medium",
                    <= 365 => "High",
                    _ => "Critical"
                }
                : "Critical"
        })
        .OrderByDescending(s => s.churnRisk)
        .Cast<object>()
        .ToList();

        return scored;
    }

    private async Task<List<DonorRetentionMlRow>> ReadMlRetentionRowsAsync()
    {
        await using var conn = _db.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync();
        }

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
SELECT
    s.supporter_id,
    COALESCE(NULLIF(LTRIM(RTRIM(s.display_name)), ''), CONCAT('Supporter #', s.supporter_id)) AS display_name,
    s.email,
    s.supporter_type,
    d.donation_date AS last_donation_date,
    ds.repeat_probability_180d,
    ds.scored_at,
    ds.model_version
FROM ml.donor_scores ds
JOIN dbo.supporters s ON s.supporter_id = ds.supporter_id
LEFT JOIN dbo.donations d ON d.donation_id = ds.donation_id
WHERE s.status = 'Active';";

        var rows = new List<DonorRetentionMlRow>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            rows.Add(new DonorRetentionMlRow
            {
                SupporterId = reader.GetInt32(0),
                DisplayName = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                Email = reader.IsDBNull(2) ? null : reader.GetString(2),
                SupporterType = reader.IsDBNull(3) ? null : reader.GetString(3),
                LastDonationDate = reader.IsDBNull(4) ? null : DateOnly.FromDateTime(reader.GetDateTime(4)),
                RepeatProbability180d = reader.GetDouble(5),
                ScoredAt = reader.GetDateTime(6),
                ModelVersion = reader.IsDBNull(7) ? string.Empty : reader.GetString(7),
            });
        }

        return rows;
    }

    private static string RiskCategoryFromChurn(double churnRisk)
    {
        if (churnRisk >= 0.75) return "Critical";
        if (churnRisk >= 0.50) return "High";
        if (churnRisk >= 0.25) return "Medium";
        return "Low";
    }

    private static string RiskCategoryFromResidentProbability(double riskProbability)
    {
        if (riskProbability >= 0.75) return "Critical";
        if (riskProbability >= 0.50) return "High";
        if (riskProbability >= 0.30) return "Medium";
        return "Low";
    }

    // GET /api/insights/resident-risk-ml
    // Returns ML scores from ml.resident_risk_scores when available.
    // Falls back to operational resident risk signals when ML data is unavailable.
    [HttpGet("resident-risk-ml")]
    public async Task<IActionResult> ResidentRiskMl()
    {
        try
        {
            var mlRows = await ReadMlResidentRiskRowsAsync();

            if (mlRows.Count == 0)
            {
                var fallbackRows = await BuildOperationalResidentRiskRowsAsync();
                return Ok(new
                {
                    source = "rule-based",
                    message = "ML table is empty. Returned operational resident risk signals.",
                    rows = fallbackRows,
                });
            }

            var latestScoredAt = mlRows.Max(x => x.ScoredAt);
            var modelVersion = mlRows
                .OrderByDescending(x => x.ScoredAt)
                .Select(x => x.ModelVersion)
                .FirstOrDefault() ?? "unknown";

            var rows = mlRows
                .OrderByDescending(x => x.RiskProbability)
                .Select(x => new
                {
                    x.ResidentId,
                    x.CaseControlNo,
                    x.InternalCode,
                    x.CurrentRiskLevel,
                    x.RiskEscalated,
                    x.RecentConcernsCount,
                    x.OpenIncidents,
                    riskProbability = x.RiskProbability,
                    riskFlag = x.RiskFlag,
                    riskCategory = RiskCategoryFromResidentProbability(x.RiskProbability),
                    scoredAt = x.ScoredAt,
                    x.ModelVersion,
                })
                .ToList();

            return Ok(new
            {
                source = "ml",
                modelVersion,
                scoredAt = latestScoredAt,
                rows,
            });
        }
        catch
        {
            var fallbackRows = await BuildOperationalResidentRiskRowsAsync();
            return Ok(new
            {
                source = "rule-based",
                message = "ML table unavailable. Returned operational resident risk signals.",
                rows = fallbackRows,
            });
        }
    }

    private async Task<List<object>> BuildOperationalResidentRiskRowsAsync()
    {
        var rows = await _db.Residents
            .Where(r => r.CaseStatus == "Active")
            .Select(r => new
            {
                r.ResidentId,
                r.CaseControlNo,
                r.InternalCode,
                r.CurrentRiskLevel,
                riskEscalated = r.CurrentRiskLevel != r.InitialRiskLevel &&
                    (r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical"),
                recentConcernsCount = _db.ProcessRecordings
                    .Where(p => p.ResidentId == r.ResidentId && p.ConcernsFlagged)
                    .Count(),
                openIncidents = _db.IncidentReports
                    .Where(i => i.ResidentId == r.ResidentId && !i.Resolved)
                    .Count(),
                // Operational fallback proxy that preserves sorting and category behavior.
                riskProbability = r.CurrentRiskLevel == "Critical" ? 0.85 :
                                 r.CurrentRiskLevel == "High" ? 0.65 :
                                 r.CurrentRiskLevel == "Medium" ? 0.40 : 0.20,
                riskFlag = r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical",
                scoredAt = (DateTime?)null,
                modelVersion = (string?)null,
                riskCategory = r.CurrentRiskLevel == "Critical" ? "Critical" :
                               r.CurrentRiskLevel == "High" ? "High" :
                               r.CurrentRiskLevel == "Medium" ? "Medium" : "Low",
            })
            .OrderByDescending(r => r.riskProbability)
            .Cast<object>()
            .ToListAsync();

        return rows;
    }

    private async Task<List<ResidentRiskMlRow>> ReadMlResidentRiskRowsAsync()
    {
        await using var conn = _db.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync();
        }

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
SELECT
    r.resident_id,
    r.case_control_no,
    r.internal_code,
    r.current_risk_level,
    CASE
        WHEN r.current_risk_level <> r.initial_risk_level
         AND r.current_risk_level IN ('High', 'Critical') THEN 1
        ELSE 0
    END AS risk_escalated,
    COALESCE(pc.recent_concerns_count, 0) AS recent_concerns_count,
    COALESCE(ir.open_incidents, 0) AS open_incidents,
    rs.risk_probability,
    rs.risk_flag,
    rs.scored_at,
    rs.model_version
FROM ml.resident_risk_scores rs
JOIN dbo.residents r ON r.resident_id = rs.resident_id
LEFT JOIN (
    SELECT resident_id, COUNT(*) AS recent_concerns_count
    FROM dbo.process_recordings
    WHERE concerns_flagged = 1
    GROUP BY resident_id
) pc ON pc.resident_id = r.resident_id
LEFT JOIN (
    SELECT resident_id, COUNT(*) AS open_incidents
    FROM dbo.incident_reports
    WHERE resolved = 0
    GROUP BY resident_id
) ir ON ir.resident_id = r.resident_id
WHERE r.case_status = 'Active';";

        var rows = new List<ResidentRiskMlRow>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            rows.Add(new ResidentRiskMlRow
            {
                ResidentId = reader.GetInt32(0),
                CaseControlNo = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                InternalCode = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                CurrentRiskLevel = reader.IsDBNull(3) ? null : reader.GetString(3),
                RiskEscalated = !reader.IsDBNull(4) && reader.GetBoolean(4),
                RecentConcernsCount = reader.IsDBNull(5) ? 0 : reader.GetInt32(5),
                OpenIncidents = reader.IsDBNull(6) ? 0 : reader.GetInt32(6),
                RiskProbability = reader.GetDouble(7),
                RiskFlag = !reader.IsDBNull(8) && reader.GetBoolean(8),
                ScoredAt = reader.GetDateTime(9),
                ModelVersion = reader.IsDBNull(10) ? string.Empty : reader.GetString(10),
            });
        }

        return rows;
    }

    // GET /api/insights/resident-risk
    // Returns active residents with their current risk level and key flags.
    [HttpGet("resident-risk")]
    public async Task<IActionResult> ResidentRisk()
    {
        var data = await _db.Residents
            .Where(r => r.CaseStatus == "Active")
            .Select(r => new
            {
                r.ResidentId,
                r.CaseControlNo,
                r.InternalCode,
                r.SafehouseId,
                r.CurrentRiskLevel,
                r.InitialRiskLevel,
                r.ReintegrationStatus,
                riskEscalated = r.CurrentRiskLevel != r.InitialRiskLevel &&
                    (r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical"),
                recentConcernsCount = _db.ProcessRecordings
                    .Where(p => p.ResidentId == r.ResidentId && p.ConcernsFlagged)
                    .Count(),
                openIncidents = _db.IncidentReports
                    .Where(i => i.ResidentId == r.ResidentId && !i.Resolved)
                    .Count()
            })
            .OrderBy(r => r.CurrentRiskLevel == "Critical" ? 0 :
                          r.CurrentRiskLevel == "High" ? 1 :
                          r.CurrentRiskLevel == "Medium" ? 2 : 3)
            .ToListAsync();

        return Ok(data);
    }
}
