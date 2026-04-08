export interface DonorInsightRow {
  supporterId: number;
  displayName: string;
  status: "Active" | "At Risk" | "High Potential" | string;
  riskScore: number;
  ltvEstimate: number;
  daysSinceLastDonation: number;
  allocationCompleteness: number;
  suggestedAction: string;
  impactedHighRiskResidents: number;
}

export interface DonorAnalyticsResponse {
  donors: DonorInsightRow[];
  retentionTrend: { month: string; retentionRate: number }[];
  donationFrequency: { segment: string; count: number }[];
  impactSummary: string;
}

export interface ResidentInsightRow {
  residentId: number;
  caseCode: string;
  status: "Improving" | "At Risk" | "Ready for Reintegration" | string;
  progressScore: number;
  concernsCount: number;
  unresolvedIncidents: number;
  interventionCount: number;
  lastActivityDate: string;
}

export interface ResidentAnalyticsResponse {
  residents: ResidentInsightRow[];
  alerts: ResidentInsightRow[];
  timeline: {
    residentId: number;
    caseCode: string;
    dateLabel: string;
    eventType: string;
    summary: string;
  }[];
  caseLifecycle: {
    activeIntake: number;
    processRecordings: number;
    homeVisits: number;
    reintegrationCompleted: number;
  };
}

export interface SocialAnalyticsResponse {
  bestPostingTimes: {
    dayOfWeek: string;
    hour: number;
    engagementScore: number;
    avgDonationValue: number;
  }[];
  bestContentTypes: {
    postType: string;
    posts: number;
    avgEngagementScore: number;
    totalDonationValue: number;
  }[];
  platformPerformance: {
    platform: string;
    posts: number;
    avgEngagementScore: number;
    estimatedDonationValue: number;
    donationReferrals: number;
  }[];
  suggestedNextPosts: string[];
  engagementDonationCorrelation: number;
}
