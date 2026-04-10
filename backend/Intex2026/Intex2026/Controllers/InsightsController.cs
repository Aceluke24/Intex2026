using Intex2026.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Text.Json;
using System.Text.RegularExpressions;

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
    private readonly ILogger<InsightsController> _logger;
    private readonly IWebHostEnvironment _env;

    public InsightsController(AppDbContext db, ILogger<InsightsController> logger, IWebHostEnvironment env)
    {
        _db = db;
        _logger = logger;
        _env = env;
    }

    // Resolve artifacts from environment override, deployed publish output, or local repo root.
    private string ArtifactsPath
    {
        get
        {
            var configuredPath = Environment.GetEnvironmentVariable("ML_ARTIFACTS_PATH");
            if (!string.IsNullOrWhiteSpace(configuredPath) && Directory.Exists(configuredPath))
            {
                return configuredPath;
            }

            var publishPath = Path.Combine(_env.ContentRootPath, "artifacts");
            if (Directory.Exists(publishPath))
            {
                return publishPath;
            }

            return Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "..", "..", "artifacts"));
        }
    }

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
    s.[SupporterId],
    COALESCE(NULLIF(LTRIM(RTRIM(s.[DisplayName])), ''), CONCAT('Supporter #', s.[SupporterId])) AS display_name,
    s.[Email],
    s.[SupporterType],
    d.[DonationDate] AS last_donation_date,
    ds.repeat_probability_180d,
    ds.scored_at,
    ds.model_version
FROM [ml].[donor_scores] ds
JOIN [dbo].[Supporters] s ON s.[SupporterId] = ds.supporter_id
LEFT JOIN [dbo].[Donations] d ON d.[DonationId] = ds.donation_id
WHERE s.[Status] = 'Active';";

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
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ResidentRiskMl failed to read ML rows. Falling back to operational resident risk signals.");

            try
            {
                var fallbackRows = await BuildOperationalResidentRiskRowsAsync();
                return Ok(new
                {
                    source = "rule-based",
                    message = "ML table unavailable. Returned operational resident risk signals.",
                    rows = fallbackRows,
                });
            }
            catch (Exception fallbackEx)
            {
                _logger.LogError(fallbackEx,
                    "ResidentRiskMl fallback query also failed. Returning empty resident risk payload to avoid 500.");

                return Ok(new
                {
                    source = "rule-based",
                    message = "Resident risk data is temporarily unavailable.",
                    rows = Array.Empty<object>(),
                });
            }
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
    r.[ResidentId],
    r.[CaseControlNo],
    r.[InternalCode],
    r.[CurrentRiskLevel],
    CASE
        WHEN r.[CurrentRiskLevel] <> r.[InitialRiskLevel]
         AND r.[CurrentRiskLevel] IN ('High', 'Critical') THEN 1
        ELSE 0
    END AS risk_escalated,
    COALESCE(pc.recent_concerns_count, 0) AS recent_concerns_count,
    COALESCE(ir.open_incidents, 0) AS open_incidents,
    rs.risk_probability,
    rs.risk_flag,
    rs.scored_at,
    rs.model_version
FROM [ml].[resident_risk_scores] rs
JOIN [dbo].[Residents] r ON r.[ResidentId] = rs.resident_id
LEFT JOIN (
    SELECT [ResidentId], COUNT(*) AS recent_concerns_count
    FROM [dbo].[ProcessRecordings]
    WHERE [ConcernsFlagged] = 1
    GROUP BY [ResidentId]
) pc ON pc.[ResidentId] = r.[ResidentId]
LEFT JOIN (
    SELECT [ResidentId], COUNT(*) AS open_incidents
    FROM [dbo].[IncidentReports]
    WHERE [Resolved] = 0
    GROUP BY [ResidentId]
) ir ON ir.[ResidentId] = r.[ResidentId]
WHERE r.[CaseStatus] = 'Active';";

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
                // Use conversion helpers because SQL providers can return bool/count/float columns with varying CLR types.
                RiskEscalated = !reader.IsDBNull(4) && Convert.ToBoolean(reader.GetValue(4)),
                RecentConcernsCount = reader.IsDBNull(5) ? 0 : Convert.ToInt32(reader.GetValue(5)),
                OpenIncidents = reader.IsDBNull(6) ? 0 : Convert.ToInt32(reader.GetValue(6)),
                RiskProbability = reader.IsDBNull(7) ? 0.0 : Convert.ToDouble(reader.GetValue(7)),
                RiskFlag = !reader.IsDBNull(8) && Convert.ToBoolean(reader.GetValue(8)),
                ScoredAt = reader.GetDateTime(9),
                ModelVersion = reader.IsDBNull(10) ? string.Empty : reader.GetString(10),
            });
        }

        return rows;
    }

    // GET /api/insights/reintegration-analysis
    // Returns directional factor associations for resident reintegration success,
    // read from the pre-trained artifact files (no database writes required).
    [HttpGet("reintegration-analysis")]
    public IActionResult ReintegrationAnalysis()
    {
        try
        {
            var csvPath = Path.Combine(ArtifactsPath, "reintegration", "odds_ratios.csv");
            if (!System.IO.File.Exists(csvPath))
                return Ok(new { available = false, message = "Reintegration model artifacts not found." });

            var lines = System.IO.File.ReadAllLines(csvPath);
            var rows = new List<object>();
            bool hasConvergenceIssues = false;
            foreach (var line in lines.Skip(1))
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                var fields = ParseCsvLine(line);
                if (fields.Length < 6) continue;
                var feature = fields[0];
                if (!double.TryParse(fields[1], System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out var oddsRatio)) continue;
                if (string.IsNullOrEmpty(fields[2])) hasConvergenceIssues = true;
                rows.Add(new
                {
                    feature,
                    oddsRatio,
                    direction = oddsRatio >= 1.0 ? "positive" : "negative",
                    significant = fields[5].Equals("True", StringComparison.OrdinalIgnoreCase),
                });
            }

            object? metrics = null;
            var metricsPath = Path.Combine(ArtifactsPath, "reintegration", "metrics.json");
            if (System.IO.File.Exists(metricsPath))
            {
                using var doc = JsonDocument.Parse(System.IO.File.ReadAllText(metricsPath));
                var root = doc.RootElement;
                metrics = new
                {
                    pseudoR2 = root.TryGetProperty("pseudo_r2_mcfadden", out var pr2) ? pr2.GetDouble() : (double?)null,
                    nObservations = root.TryGetProperty("n_observations", out var n) ? n.GetInt32() : (int?)null,
                    aic = root.TryGetProperty("aic", out var aic) ? aic.GetDouble() : (double?)null,
                    bic = root.TryGetProperty("bic", out var bic) ? bic.GetDouble() : (double?)null,
                };
            }

            string? trainedAt = null;
            var metaPath = Path.Combine(ArtifactsPath, "reintegration", "metadata.json");
            if (System.IO.File.Exists(metaPath))
            {
                using var doc = JsonDocument.Parse(System.IO.File.ReadAllText(metaPath));
                if (doc.RootElement.TryGetProperty("trained_at", out var ta))
                    trainedAt = ta.GetString();
            }

            return Ok(new { available = true, trainedAt, metrics, hasConvergenceIssues, rows });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load reintegration analysis artifacts.");
            return Ok(new { available = false, message = "Failed to load reintegration model artifacts." });
        }
    }

    // GET /api/insights/social-media-insights
    // Returns Incidence Rate Ratios for social media post characteristics vs donation referrals,
    // read from the pre-trained artifact files (no database writes required).
    [HttpGet("social-media-insights")]
    public IActionResult SocialMediaInsights()
    {
        try
        {
            var csvPath = Path.Combine(ArtifactsPath, "social_media_insights", "irr_table.csv");
            if (!System.IO.File.Exists(csvPath))
                return Ok(new { available = false, message = "Social media model artifacts not found." });

            var lines = System.IO.File.ReadAllLines(csvPath);
            var rows = new List<object>();
            foreach (var line in lines.Skip(1))
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                var fields = ParseCsvLine(line);
                if (fields.Length < 6) continue;
                var rawFeature = fields[0];
                if (rawFeature.Equals("Intercept", StringComparison.OrdinalIgnoreCase)) continue;
                var featureMeta = ResolveSocialMediaFeature(rawFeature);
                if (!double.TryParse(fields[1], System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out var irr)) continue;
                double? ciLow = double.TryParse(fields[2], System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var cl) ? cl : null;
                double? ciHigh = double.TryParse(fields[3], System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var ch) ? ch : null;
                double? pValue = double.TryParse(fields[4], System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var pv) ? pv : null;
                var significant = fields[5].Equals("True", StringComparison.OrdinalIgnoreCase);
                rows.Add(new {
                    feature = featureMeta.Label,
                    tooltip = featureMeta.Tooltip,
                    group = featureMeta.Group,
                    irr, ciLow, ciHigh, pValue, significant,
                });
            }

            object? metrics = null;
            var metricsPath = Path.Combine(ArtifactsPath, "social_media_insights", "metrics.json");
            if (System.IO.File.Exists(metricsPath))
            {
                using var doc = JsonDocument.Parse(System.IO.File.ReadAllText(metricsPath));
                var root = doc.RootElement;
                metrics = new
                {
                    aic = root.TryGetProperty("aic", out var aic) ? aic.GetDouble() : (double?)null,
                    nPosts = root.TryGetProperty("n_posts", out var n) ? n.GetInt32() : (int?)null,
                };
            }

            string? trainedAt = null;
            var metaPath = Path.Combine(ArtifactsPath, "social_media_insights", "metadata.json");
            if (System.IO.File.Exists(metaPath))
            {
                using var doc = JsonDocument.Parse(System.IO.File.ReadAllText(metaPath));
                if (doc.RootElement.TryGetProperty("trained_at", out var ta))
                    trainedAt = ta.GetString();
            }

            return Ok(new { available = true, trainedAt, metrics, rows });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load social media insights artifacts.");
            return Ok(new { available = false, message = "Failed to load social media model artifacts." });
        }
    }

    // Minimal CSV line parser that handles quoted fields (needed for statsmodels formula names).
    private static string[] ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var current = new System.Text.StringBuilder();
        bool inQuotes = false;
        foreach (char c in line)
        {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { fields.Add(current.ToString()); current.Clear(); }
            else { current.Append(c); }
        }
        fields.Add(current.ToString());
        return fields.ToArray();
    }

    private record SocialMediaFeatureMeta(string Label, string Tooltip, string Group);

    private static readonly Dictionary<string, SocialMediaFeatureMeta> SocialMediaFeatureLabels = new(StringComparer.Ordinal)
    {
        // ── Content Strategy ─────────────────────────────────────────────
        ["C(post_type, Treatment(reference='ThankYou'))[T.FundraisingAppeal]"] = new("Fundraising appeal post", "Compared to thank-you posts", "Content Strategy"),
        ["C(post_type, Treatment(reference='ThankYou'))[T.ImpactStory]"]       = new("Impact story post", "Compared to thank-you posts", "Content Strategy"),
        ["C(post_type, Treatment(reference='ThankYou'))[T.Campaign]"]          = new("Campaign-related post", "Compared to thank-you posts", "Content Strategy"),
        ["C(post_type, Treatment(reference='ThankYou'))[T.EducationalContent]"] = new("Educational content post", "Compared to thank-you posts", "Content Strategy"),
        ["C(post_type, Treatment(reference='ThankYou'))[T.EventPromotion]"]    = new("Event promotion post", "Compared to thank-you posts", "Content Strategy"),
        ["features_resident_story"]                                             = new("Features a resident story", "Post highlights an individual resident's experience", "Content Strategy"),
        ["has_call_to_action"]                                                  = new("Includes a call-to-action", "Post contains any type of call-to-action", "Content Strategy"),

        // ── Content Topic ────────────────────────────────────────────────
        ["C(content_topic, Treatment(reference='Gratitude'))[T.CampaignLaunch]"]    = new("Campaign launch topic", "Compared to gratitude-themed posts", "Content Topic"),
        ["C(content_topic, Treatment(reference='Gratitude'))[T.Health]"]            = new("Health-related topic", "Compared to gratitude-themed posts", "Content Topic"),
        ["C(content_topic, Treatment(reference='Gratitude'))[T.AwarenessRaising]"]  = new("Awareness-raising topic", "Compared to gratitude-themed posts", "Content Topic"),
        ["C(content_topic, Treatment(reference='Gratitude'))[T.DonorImpact]"]       = new("Donor impact topic", "Compared to gratitude-themed posts", "Content Topic"),
        ["C(content_topic, Treatment(reference='Gratitude'))[T.Reintegration]"]     = new("Reintegration topic", "Compared to gratitude-themed posts", "Content Topic"),
        ["C(content_topic, Treatment(reference='Gratitude'))[T.Education]"]         = new("Education topic", "Compared to gratitude-themed posts", "Content Topic"),
        ["C(content_topic, Treatment(reference='Gratitude'))[T.SafehouseLife]"]     = new("Safehouse life topic", "Compared to gratitude-themed posts", "Content Topic"),
        ["C(content_topic, Treatment(reference='Gratitude'))[T.EventRecap]"]        = new("Event recap topic", "Compared to gratitude-themed posts", "Content Topic"),

        // ── Tone ─────────────────────────────────────────────────────────
        ["C(sentiment_tone, Treatment(reference='Informative'))[T.Emotional]"]   = new("Emotional tone", "Compared to informative tone", "Tone"),
        ["C(sentiment_tone, Treatment(reference='Informative'))[T.Urgent]"]      = new("Urgent tone", "Compared to informative tone", "Tone"),
        ["C(sentiment_tone, Treatment(reference='Informative'))[T.Celebratory]"] = new("Celebratory tone", "Compared to informative tone", "Tone"),
        ["C(sentiment_tone, Treatment(reference='Informative'))[T.Grateful]"]    = new("Grateful tone", "Compared to informative tone", "Tone"),
        ["C(sentiment_tone, Treatment(reference='Informative'))[T.Hopeful]"]     = new("Hopeful tone", "Compared to informative tone", "Tone"),

        // ── Media Format ─────────────────────────────────────────────────
        ["C(media_type, Treatment(reference='Text'))[T.Reel]"]     = new("Reel (short-form video)", "Compared to text-only posts", "Media Format"),
        ["C(media_type, Treatment(reference='Text'))[T.Video]"]    = new("Video post", "Compared to text-only posts", "Media Format"),
        ["C(media_type, Treatment(reference='Text'))[T.Image]"]    = new("Image-based post", "Compared to text-only posts", "Media Format"),
        ["C(media_type, Treatment(reference='Text'))[T.Carousel]"] = new("Carousel post", "Compared to text-only posts", "Media Format"),
        ["C(media_type, Treatment(reference='Text'))[T.Photo]"]    = new("Photo post", "Compared to text-only posts", "Media Format"),

        // ── Platform ─────────────────────────────────────────────────────
        ["C(platform, Treatment(reference='LinkedIn'))[T.YouTube]"]   = new("YouTube", "Compared to LinkedIn", "Platform"),
        ["C(platform, Treatment(reference='LinkedIn'))[T.WhatsApp]"]  = new("WhatsApp", "Compared to LinkedIn", "Platform"),
        ["C(platform, Treatment(reference='LinkedIn'))[T.TikTok]"]    = new("TikTok", "Compared to LinkedIn", "Platform"),
        ["C(platform, Treatment(reference='LinkedIn'))[T.Instagram]"] = new("Instagram", "Compared to LinkedIn", "Platform"),
        ["C(platform, Treatment(reference='LinkedIn'))[T.Facebook]"]  = new("Facebook", "Compared to LinkedIn", "Platform"),
        ["C(platform, Treatment(reference='LinkedIn'))[T.Twitter]"]   = new("Twitter / X", "Compared to LinkedIn", "Platform"),

        // ── Promotion ────────────────────────────────────────────────────
        ["is_boosted"] = new("Post was boosted", "Paid promotion was applied", "Promotion"),
        ["C(call_to_action_type, Treatment(reference='None'))[T.DonateNow]"]   = new("'Donate Now' call-to-action", "Compared to posts with no CTA", "Promotion"),
        ["C(call_to_action_type, Treatment(reference='None'))[T.LearnMore]"]   = new("'Learn More' call-to-action", "Compared to posts with no CTA", "Promotion"),
        ["C(call_to_action_type, Treatment(reference='None'))[T.SignUp]"]      = new("'Sign Up' call-to-action", "Compared to posts with no CTA", "Promotion"),
        ["C(call_to_action_type, Treatment(reference='None'))[T.ShareStory]"]  = new("'Share Story' call-to-action", "Compared to posts with no CTA", "Promotion"),

        // ── Timing ───────────────────────────────────────────────────────
        ["is_weekend"] = new("Posted on weekends", "Saturday or Sunday posting", "Timing"),
        ["hour_sin"]   = new("Posting time (time of day)", "Captures cyclical effects of posting hour", "Timing"),
        ["hour_cos"]   = new("Posting time (time of day)", "Captures cyclical effects of posting hour", "Timing"),

        // ── Writing Style ────────────────────────────────────────────────
        ["caption_length"]  = new("Longer captions", "Effect of each additional character in caption", "Writing Style"),
        ["num_hashtags"]    = new("More hashtags used", "Effect of each additional hashtag", "Writing Style"),
        ["mentions_count"]  = new("Mentions of other accounts", "Effect of each additional @mention", "Writing Style"),

        // ── Controls ─────────────────────────────────────────────────────
        ["log_followers"] = new("Larger follower audience", "Log-scaled follower count at time of posting", "Controls"),
    };

    private static SocialMediaFeatureMeta ResolveSocialMediaFeature(string raw)
    {
        if (SocialMediaFeatureLabels.TryGetValue(raw, out var meta))
            return meta;

        var m = Regex.Match(raw, @"C\((\w+)[^)]*\)\[T\.(.+?)\]");
        if (m.Success)
            return new SocialMediaFeatureMeta($"{m.Groups[1].Value}: {m.Groups[2].Value}", "Unmapped categorical factor", "Other");

        return new SocialMediaFeatureMeta(raw, "", "Other");
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
