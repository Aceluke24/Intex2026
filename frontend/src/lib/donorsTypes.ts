export type SupporterKind = "Monetary" | "Volunteer" | "Skills" | "Social";
export type SupporterStatus = "Active" | "Inactive";

export type ContributionKind = "monetary" | "volunteer" | "skills" | "in-kind" | "social";

export interface ContributionBreakdown {
  monetary: number;
  timeHours: number;
  skillsSessions: number;
  inKindValue: number;
  socialActions: number;
}

export interface Supporter {
  id: string;
  name: string;
  email: string;
  phone: string;
  kind: SupporterKind;
  status: SupporterStatus;
  totalContributionsValue: number;
  lastActivity: string;
  notes: string;
  breakdown: ContributionBreakdown;
}

export interface TimelineEntry {
  id: string;
  supporterId: string;
  at: string;
  kind: ContributionKind;
  title: string;
  detail: string;
}

export interface FeedEntry {
  id: string;
  supporterName: string;
  kind: ContributionKind;
  /** API may send null for non-applicable kinds */
  amount?: number | null;
  hours?: number | null;
  description: string;
  at: string;
}

export interface AllocationSlice {
  id: string;
  label: string;
  value: number;
  fill: string;
  category: "safehouse" | "program";
}

export interface ApiSupporterRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  kind: string;
  status: string;
  totalContributionsValue: number;
  lastActivity: string;
  notes: string;
  breakdown: ContributionBreakdown;
}

export interface DonorsDashboardResponse {
  supporters: ApiSupporterRow[];
  feed: FeedEntry[];
  metrics: {
    totalSupporters: number;
    activeDonors: number;
    monthlyContributions: number;
    volunteerHoursLogged: number;
    inKindValue: number;
  };
  allocationByDestination: AllocationSlice[];
}
