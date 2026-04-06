/** Anonymized operational mock data — structure only; no real PHI. */

export type ResidentStatus = "Stable" | "At Risk" | "Progressing";

export interface ResidentRow {
  id: string;
  /** Optional; shown as subtle context under ID when present */
  safehouse?: string;
  status: ResidentStatus;
  /** Displayed as “Last update” */
  lastSession: string;
}

export interface DashboardMetric {
  key: string;
  label: string;
  value: string;
  trendLabel: string;
  trend: "up" | "down" | "neutral";
  icon: "users" | "home" | "heart" | "percent" | "calendar";
}

export interface DonationMonth {
  month: string;
  total: number;
  newDonors: number;
  returningDonors: number;
}

export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  severity: "review" | "soon";
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "conference" | "visit" | "other";
  datetime: string;
  location: string;
}

export interface PriorityCallout {
  id: string;
  headline: string;
  supporting: string;
  align?: "left" | "right";
}

/** Narrative intelligence — top of command center */
export const priorityCallouts: PriorityCallout[] = [
  {
    id: "p1",
    headline: "Two residents may need attention after recent sessions",
    supporting:
      "Care teams suggested follow-ups for Harbor House and Riverside — check-ins within the next few days.",
    align: "left",
  },
  {
    id: "p2",
    headline: "Three case conferences are scheduled this week",
    supporting: "Including cohort review Thursday and a multidisciplinary review on Friday.",
    align: "right",
  },
  {
    id: "p3",
    headline: "Donation activity has increased this month",
    supporting: "Recurring gifts and returning supporters account for most of the lift versus last quarter.",
    align: "left",
  },
];

/** Inline copy for “live context” — rendered as typography, not cards */
export const liveContext = {
  residentCount: 42,
  safehouseCount: 4,
  donationMonthLabel: "$61.2k",
  donationTrendPhrase: "trending upward",
  retentionLabel: "72%",
};

export const lightweightInsights: string[] = [
  "Residents are showing consistent progress on tracked wellness goals this week.",
  "Evening posts are reaching about 24% more supporters than morning posts on average.",
];

/** Primary hero KPI — Active residents (for MetricCard if reused elsewhere) */
export const primaryMetric: DashboardMetric = {
  key: "residents",
  label: "Active residents",
  value: "42",
  trendLabel: "+3 vs last week",
  trend: "up",
  icon: "users",
};

export const residentTrendSeries = [34, 36, 37, 39, 41, 42];

export const supportingMetrics: DashboardMetric[] = [
  {
    key: "donations",
    label: "Donations this month",
    value: "$61.2k",
    trendLabel: "+5.5% vs prior",
    trend: "up",
    icon: "heart",
  },
  {
    key: "retention",
    label: "Donor retention",
    value: "72%",
    trendLabel: "+3 pts YoY",
    trend: "up",
    icon: "percent",
  },
  {
    key: "conferences",
    label: "Case conferences",
    value: "6",
    trendLabel: "Next 14 days",
    trend: "neutral",
    icon: "calendar",
  },
];

export const safehousesSummary = {
  label: "Safehouses operating",
  value: "4",
  detail: "Network at planned capacity",
};

export const residentsOverview: ResidentRow[] = [
  { id: "R-A12", safehouse: "North Wing", status: "Stable", lastSession: "Apr 4, 2026" },
  { id: "R-B07", safehouse: "Harbor House", status: "Progressing", lastSession: "Apr 5, 2026" },
  { id: "R-C21", safehouse: "North Wing", status: "At Risk", lastSession: "Mar 28, 2026" },
  { id: "R-D03", safehouse: "Riverside", status: "Stable", lastSession: "Apr 5, 2026" },
  { id: "R-E18", safehouse: "Harbor House", status: "Progressing", lastSession: "Apr 3, 2026" },
  { id: "R-F09", safehouse: "Riverside", status: "Stable", lastSession: "Apr 6, 2026" },
];

export const donationActivity: DonationMonth[] = [
  { month: "Nov", total: 42000, newDonors: 28, returningDonors: 112 },
  { month: "Dec", total: 51000, newDonors: 34, returningDonors: 118 },
  { month: "Jan", total: 48000, newDonors: 22, returningDonors: 124 },
  { month: "Feb", total: 55000, newDonors: 31, returningDonors: 128 },
  { month: "Mar", total: 61200, newDonors: 29, returningDonors: 135 },
  { month: "Apr", total: 58400, newDonors: 26, returningDonors: 132 },
];

/** Shown above donation chart */
export const donationTrendInsight =
  "Donations have steadily increased over the past three months, with a softer dip in January as expected.";

export const attentionItems: AttentionItem[] = [
  {
    id: "1",
    title: "Missed counseling session",
    detail: "Resident C21 — no-show > 10 days since last session",
    severity: "review",
  },
  {
    id: "2",
    title: "Regression risk flagged",
    detail: "Care team note for R-B07 — follow-up window closing",
    severity: "soon",
  },
  {
    id: "3",
    title: "Home visit overdue",
    detail: "Scheduled check-in for Riverside unit — reschedule suggested",
    severity: "review",
  },
];

export const upcomingEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "Case conference — cohort A",
    type: "conference",
    datetime: "Apr 8, 2026 · 10:00 AM",
    location: "Conference room B",
  },
  {
    id: "e2",
    title: "Home visit — Harbor House",
    type: "visit",
    datetime: "Apr 9, 2026 · 2:30 PM",
    location: "External",
  },
  {
    id: "e3",
    title: "Multi-disciplinary review",
    type: "conference",
    datetime: "Apr 11, 2026 · 9:00 AM",
    location: "Virtual",
  },
  {
    id: "e4",
    title: "Wellness follow-up",
    type: "other",
    datetime: "Apr 12, 2026 · 11:15 AM",
    location: "North Wing",
  },
];
