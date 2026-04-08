namespace Intex2026.Services.Analytics;

public sealed record DonorAnalyticsDto(
    List<DonorInsightRowDto> Donors,
    List<RetentionTrendDto> RetentionTrend,
    List<DonationFrequencyDto> DonationFrequency,
    string ImpactSummary);

public sealed record DonorInsightRowDto(
    int SupporterId,
    string DisplayName,
    string Status,
    double RiskScore,
    double LtvEstimate,
    int DaysSinceLastDonation,
    double AllocationCompleteness,
    string SuggestedAction,
    int ImpactedHighRiskResidents);

public sealed record RetentionTrendDto(string Month, double RetentionRate);
public sealed record DonationFrequencyDto(string Segment, int Count);

public sealed record ResidentAnalyticsDto(
    List<ResidentInsightRowDto> Residents,
    List<ResidentInsightRowDto> Alerts,
    List<ResidentTimelineEventDto> Timeline,
    CaseLifecycleDto CaseLifecycle);

public sealed record ResidentInsightRowDto(
    int ResidentId,
    string CaseCode,
    string Status,
    double ProgressScore,
    int ConcernsCount,
    int UnresolvedIncidents,
    int InterventionCount,
    string LastActivityDate);

public sealed record ResidentTimelineEventDto(
    int ResidentId,
    string CaseCode,
    string DateLabel,
    string EventType,
    string Summary);

public sealed record CaseLifecycleDto(
    int ActiveIntake,
    int ProcessRecordings,
    int HomeVisits,
    int ReintegrationCompleted);

public sealed record SocialAnalyticsDto(
    List<BestPostingWindowDto> BestPostingTimes,
    List<ContentTypePerformanceDto> BestContentTypes,
    List<PlatformPerformanceDto> PlatformPerformance,
    List<string> SuggestedNextPosts,
    double EngagementDonationCorrelation);

public sealed record BestPostingWindowDto(string DayOfWeek, int Hour, double EngagementScore, double AvgDonationValue);
public sealed record ContentTypePerformanceDto(string PostType, int Posts, double AvgEngagementScore, double TotalDonationValue);
public sealed record PlatformPerformanceDto(string Platform, int Posts, double AvgEngagementScore, double EstimatedDonationValue, int DonationReferrals);
