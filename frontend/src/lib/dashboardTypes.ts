export type ResidentStatus = "Stable" | "At Risk" | "Progressing";

export interface ResidentRow {
  id: string;
  safehouse?: string;
  status: ResidentStatus;
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
