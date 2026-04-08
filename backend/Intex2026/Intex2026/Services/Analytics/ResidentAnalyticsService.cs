using System.Globalization;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Services.Analytics;

public interface IResidentAnalyticsService
{
    Task<ResidentAnalyticsDto> GetAsync(CancellationToken ct);
    Task<int> RecalculateAsync(CancellationToken ct);
}

public sealed class ResidentAnalyticsService : IResidentAnalyticsService
{
    private readonly AppDbContext _db;
    public ResidentAnalyticsService(AppDbContext db) => _db = db;

    public async Task<ResidentAnalyticsDto> GetAsync(CancellationToken ct)
    {
        if (!await _db.ResidentAnalytics.AsNoTracking().AnyAsync(ct))
        {
            await RecalculateAsync(ct);
        }

        var residents = await _db.Residents.AsNoTracking().Where(r => r.CaseStatus == "Active").ToListAsync(ct);
        var recordings = await _db.ProcessRecordings.AsNoTracking().ToListAsync(ct);
        var visitations = await _db.HomeVisitations.AsNoTracking().ToListAsync(ct);
        var incidents = await _db.IncidentReports.AsNoTracking().ToListAsync(ct);
        var persisted = await _db.ResidentAnalytics.AsNoTracking().ToDictionaryAsync(x => x.ResidentId, ct);

        var recByResident = recordings.GroupBy(r => r.ResidentId).ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.SessionDate).ToList());
        var visitsByResident = visitations.GroupBy(v => v.ResidentId).ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.VisitDate).ToList());
        var incidentsByResident = incidents.GroupBy(i => i.ResidentId).ToDictionary(g => g.Key, g => g.ToList());

        var rows = new List<ResidentInsightRowDto>();
        var timelinePool = new List<(DateOnly Date, ResidentTimelineEventDto Event)>();
        foreach (var resident in residents)
        {
            var code = string.IsNullOrWhiteSpace(resident.InternalCode) ? resident.CaseControlNo : resident.InternalCode;
            var recs = recByResident.GetValueOrDefault(resident.ResidentId, new List<ProcessRecording>());
            var visits = visitsByResident.GetValueOrDefault(resident.ResidentId, new List<HomeVisitation>());
            var incs = incidentsByResident.GetValueOrDefault(resident.ResidentId, new List<IncidentReport>());
            var unresolvedIncidents = incs.Count(i => !i.Resolved);
            var concerns = recs.Count(r => r.ConcernsFlagged);
            var progressNotes = recs.Count(r => r.ProgressNoted);
            var followups = visits.Count(v => v.FollowUpNeeded || v.SafetyConcernsNoted);
            var interventionCount = recs.Count + visits.Count;
            var lastActivity = recs.Select(r => r.SessionDate).Concat(visits.Select(v => v.VisitDate)).DefaultIfEmpty(resident.DateOfAdmission).Max();

            var fallbackScore = 55.0;
            fallbackScore += resident.CurrentRiskLevel switch { "Low" => 20, "Medium" => 8, "High" => -12, "Critical" => -22, _ => 0 };
            fallbackScore += Math.Min(20, progressNotes * 3);
            fallbackScore -= Math.Min(22, concerns * 4);
            fallbackScore -= Math.Min(18, unresolvedIncidents * 5);
            fallbackScore -= Math.Min(12, followups * 3);
            if (resident.ReintegrationStatus == "Completed") fallbackScore += 10;
            if (resident.ReintegrationStatus == "On Hold") fallbackScore -= 7;
            var score = persisted.TryGetValue(resident.ResidentId, out var p)
                ? (double)p.ProgressScore
                : Math.Clamp(Math.Round(fallbackScore, 1), 0, 100);
            var status = persisted.TryGetValue(resident.ResidentId, out var p2)
                ? ToDisplayStatus(p2.Status)
                : (score >= 70 ? "Ready for Reintegration" : score >= 45 ? "Improving" : "At Risk");

            rows.Add(new ResidentInsightRowDto(
                resident.ResidentId,
                code,
                status,
                score,
                concerns,
                unresolvedIncidents,
                interventionCount,
                lastActivity.ToString("MMM d, yyyy", CultureInfo.CurrentCulture)));

            timelinePool.AddRange(recs.Take(3).Select(r => (r.SessionDate, new ResidentTimelineEventDto(resident.ResidentId, code, r.SessionDate.ToString("MMM d, yyyy", CultureInfo.CurrentCulture), "Process Recording", r.ConcernsFlagged ? "Concern flagged in session." : "Session completed with notes."))));
            timelinePool.AddRange(visits.Take(2).Select(v => (v.VisitDate, new ResidentTimelineEventDto(resident.ResidentId, code, v.VisitDate.ToString("MMM d, yyyy", CultureInfo.CurrentCulture), "Home Visit", v.FollowUpNeeded ? "Follow-up needed after visit." : "Visit completed."))));
        }

        var alerts = rows.Where(r => r.Status == "At Risk" || r.UnresolvedIncidents > 0).OrderByDescending(r => r.UnresolvedIncidents).ThenBy(r => r.ProgressScore).Take(12).ToList();
        var lifecycle = new CaseLifecycleDto(residents.Count, recordings.Count, visitations.Count, residents.Count(r => r.ReintegrationStatus == "Completed"));

        return new ResidentAnalyticsDto(
            rows.OrderBy(r => r.ProgressScore).ToList(),
            alerts,
            timelinePool.OrderByDescending(t => t.Date).Select(t => t.Event).Take(30).ToList(),
            lifecycle);
    }

    public async Task<int> RecalculateAsync(CancellationToken ct)
    {
        var residents = await _db.Residents.AsNoTracking().Where(r => r.CaseStatus == "Active").ToListAsync(ct);
        var recordings = await _db.ProcessRecordings.AsNoTracking().ToListAsync(ct);
        var visitations = await _db.HomeVisitations.AsNoTracking().ToListAsync(ct);
        var incidents = await _db.IncidentReports.AsNoTracking().ToListAsync(ct);
        var recByResident = recordings.GroupBy(r => r.ResidentId).ToDictionary(g => g.Key, g => g.ToList());
        var visitsByResident = visitations.GroupBy(v => v.ResidentId).ToDictionary(g => g.Key, g => g.ToList());
        var incidentsByResident = incidents.GroupBy(i => i.ResidentId).ToDictionary(g => g.Key, g => g.ToList());

        var computed = new List<Models.ResidentAnalytics>();
        foreach (var resident in residents)
        {
            var recs = recByResident.GetValueOrDefault(resident.ResidentId, new List<ProcessRecording>());
            var visits = visitsByResident.GetValueOrDefault(resident.ResidentId, new List<HomeVisitation>());
            var incs = incidentsByResident.GetValueOrDefault(resident.ResidentId, new List<IncidentReport>());
            var unresolvedIncidents = incs.Count(i => !i.Resolved);
            var concerns = recs.Count(r => r.ConcernsFlagged);
            var progressNotes = recs.Count(r => r.ProgressNoted);
            var followups = visits.Count(v => v.FollowUpNeeded || v.SafetyConcernsNoted);

            var baseScore = 55.0;
            baseScore += resident.CurrentRiskLevel switch { "Low" => 20, "Medium" => 8, "High" => -12, "Critical" => -22, _ => 0 };
            baseScore += Math.Min(20, progressNotes * 3);
            baseScore -= Math.Min(22, concerns * 4);
            baseScore -= Math.Min(18, unresolvedIncidents * 5);
            baseScore -= Math.Min(12, followups * 3);
            if (resident.ReintegrationStatus == "Completed") baseScore += 10;
            if (resident.ReintegrationStatus == "On Hold") baseScore -= 7;
            var progressScore = Math.Clamp(Math.Round(baseScore, 1), 0, 100);
            var status = progressScore >= 70 ? "Ready" : progressScore >= 45 ? "Improving" : "AtRisk";

            computed.Add(new Models.ResidentAnalytics
            {
                ResidentId = resident.ResidentId,
                ProgressScore = (decimal)progressScore,
                Status = status,
                LastUpdated = DateTime.UtcNow
            });
        }

        var existing = await _db.ResidentAnalytics.ToDictionaryAsync(x => x.ResidentId, ct);
        foreach (var row in computed)
        {
            if (existing.TryGetValue(row.ResidentId, out var cur))
            {
                cur.ProgressScore = row.ProgressScore;
                cur.Status = row.Status;
                cur.LastUpdated = DateTime.UtcNow;
            }
            else
            {
                _db.ResidentAnalytics.Add(row);
            }
        }
        var validIds = computed.Select(x => x.ResidentId).ToHashSet();
        var stale = await _db.ResidentAnalytics.Where(x => !validIds.Contains(x.ResidentId)).ToListAsync(ct);
        if (stale.Count > 0) _db.ResidentAnalytics.RemoveRange(stale);
        await _db.SaveChangesAsync(ct);
        return computed.Count;
    }

    private static string ToDisplayStatus(string status) => status switch
    {
        "AtRisk" => "At Risk",
        "Ready" => "Ready for Reintegration",
        _ => "Improving"
    };
}
