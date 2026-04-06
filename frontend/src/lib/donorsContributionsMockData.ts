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
  /** Primary display for “total contributions” — monetary + in-kind proxy */
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
  amount?: number;
  hours?: number;
  description: string;
  at: string;
}

export interface AllocationSlice {
  id: string;
  label: string;
  value: number;
  fill: string;
  /** For grouped “Safehouses” vs “Programs” visualization */
  category: "safehouse" | "program";
}

export const donorMetrics = {
  totalSupporters: 248,
  activeDonors: 186,
  monthlyContributions: 47200,
  volunteerHoursLogged: 1240,
  inKindValue: 89200,
};

export const allocationByDestination: AllocationSlice[] = [
  { id: "sh1", label: "North Safehouse", value: 128000, fill: "hsl(340, 42%, 78%)", category: "safehouse" },
  { id: "sh2", label: "Riverside Safehouse", value: 94500, fill: "hsl(350, 38%, 82%)", category: "safehouse" },
  { id: "sh3", label: "Harbor Safehouse", value: 67200, fill: "hsl(330, 35%, 76%)", category: "safehouse" },
  { id: "pr1", label: "Trauma Counseling", value: 156000, fill: "hsl(25, 45%, 72%)", category: "program" },
  { id: "pr2", label: "Job Training", value: 88400, fill: "hsl(43, 48%, 78%)", category: "program" },
  { id: "pr3", label: "Legal Aid Fund", value: 62300, fill: "hsl(150, 22%, 72%)", category: "program" },
];

export const safehouses = ["North Safehouse", "Riverside Safehouse", "Harbor Safehouse"];
export const programAreas = [
  "Trauma Counseling",
  "Job Training",
  "Legal Aid Fund",
  "Children's Education",
  "Emergency Shelter Operations",
];

export const supporters: Supporter[] = [
  {
    id: "S001",
    name: "Sarah Mitchell",
    email: "sarah.m@email.com",
    phone: "(503) 555-0142",
    kind: "Monetary",
    status: "Active",
    totalContributionsValue: 12500,
    lastActivity: "2026-03-28",
    notes: "Prefers quarterly impact letters. Interested in matching gift program.",
    breakdown: {
      monetary: 11800,
      timeHours: 12,
      skillsSessions: 0,
      inKindValue: 700,
      socialActions: 4,
    },
  },
  {
    id: "S002",
    name: "Robert Chen",
    email: "r.chen@corp.com",
    phone: "(415) 555-0198",
    kind: "Monetary",
    status: "Active",
    totalContributionsValue: 45000,
    lastActivity: "2026-01-20",
    notes: "Corporate liaison — annual gala table sponsor.",
    breakdown: {
      monetary: 44200,
      timeHours: 0,
      skillsSessions: 2,
      inKindValue: 800,
      socialActions: 6,
    },
  },
  {
    id: "S003",
    name: "Elena Rodriguez",
    email: "elena.r@email.com",
    phone: "(206) 555-0167",
    kind: "Volunteer",
    status: "Inactive",
    totalContributionsValue: 3200,
    lastActivity: "2025-11-05",
    notes: "Paused volunteering — follow up in Q2.",
    breakdown: {
      monetary: 3200,
      timeHours: 64,
      skillsSessions: 0,
      inKindValue: 0,
      socialActions: 2,
    },
  },
  {
    id: "S004",
    name: "James Walker",
    email: "j.walker@email.com",
    phone: "(971) 555-0123",
    kind: "Skills",
    status: "Active",
    totalContributionsValue: 28000,
    lastActivity: "2026-03-30",
    notes: "Pro bono legal consults — family law.",
    breakdown: {
      monetary: 21000,
      timeHours: 8,
      skillsSessions: 14,
      inKindValue: 0,
      socialActions: 3,
    },
  },
  {
    id: "S005",
    name: "Priya Patel",
    email: "priya.p@email.com",
    phone: "(408) 555-0181",
    kind: "Social",
    status: "Active",
    totalContributionsValue: 8700,
    lastActivity: "2026-02-14",
    notes: "Amplifies campaigns on LinkedIn and Instagram.",
    breakdown: {
      monetary: 6200,
      timeHours: 4,
      skillsSessions: 0,
      inKindValue: 500,
      socialActions: 28,
    },
  },
  {
    id: "S006",
    name: "Michael Okafor",
    email: "m.okafor@email.com",
    phone: "(503) 555-0104",
    kind: "Volunteer",
    status: "Active",
    totalContributionsValue: 1500,
    lastActivity: "2026-03-12",
    notes: "Weekend meal prep at Harbor Safehouse.",
    breakdown: {
      monetary: 1500,
      timeHours: 96,
      skillsSessions: 0,
      inKindValue: 0,
      socialActions: 1,
    },
  },
  {
    id: "S007",
    name: "Lisa Yamamoto",
    email: "l.yama@email.com",
    phone: "(425) 555-0139",
    kind: "Monetary",
    status: "Active",
    totalContributionsValue: 67000,
    lastActivity: "2026-03-30",
    notes: "Leadership circle — unrestricted giving.",
    breakdown: {
      monetary: 66500,
      timeHours: 0,
      skillsSessions: 0,
      inKindValue: 500,
      socialActions: 8,
    },
  },
  {
    id: "S008",
    name: "David Foster",
    email: "d.foster@corp.com",
    phone: "(360) 555-0175",
    kind: "Skills",
    status: "Active",
    totalContributionsValue: 15000,
    lastActivity: "2026-02-28",
    notes: "IT security audits for resident devices.",
    breakdown: {
      monetary: 12000,
      timeHours: 6,
      skillsSessions: 9,
      inKindValue: 0,
      socialActions: 0,
    },
  },
];

function timelineFor(s: Supporter): TimelineEntry[] {
  const base: TimelineEntry[] = [
    {
      id: `${s.id}-t1`,
      supporterId: s.id,
      at: s.lastActivity,
      kind: "monetary",
      title: "Gift recorded",
      detail: `$${(s.breakdown.monetary * 0.15).toLocaleString()} → Trauma Counseling`,
    },
    {
      id: `${s.id}-t2`,
      supporterId: s.id,
      at: "2026-02-10",
      kind: s.kind === "Volunteer" ? "volunteer" : "skills",
      title: s.kind === "Volunteer" ? "Volunteer shift" : "Skills session",
      detail:
        s.kind === "Volunteer"
          ? `${Math.min(8, s.breakdown.timeHours)} hrs — meal service`
          : `${Math.min(3, s.breakdown.skillsSessions || 1)} sessions — pro bono`,
    },
    {
      id: `${s.id}-t3`,
      supporterId: s.id,
      at: "2026-01-05",
      kind: "in-kind",
      title: "In-kind donation",
      detail: `Estimated value $${s.breakdown.inKindValue || 200}`,
    },
  ];
  return base;
}

export function getTimelineForSupporter(id: string): TimelineEntry[] {
  const s = supporters.find((x) => x.id === id);
  return s ? timelineFor(s) : [];
}

export const contributionFeed: FeedEntry[] = [
  {
    id: "F001",
    supporterName: "Lisa Yamamoto",
    kind: "monetary",
    amount: 5000,
    description: "Unrestricted — monthly pledge",
    at: "2026-03-30T14:22:00",
  },
  {
    id: "F002",
    supporterName: "Michael Okafor",
    kind: "volunteer",
    hours: 6,
    description: "Weekend kitchen — Harbor Safehouse",
    at: "2026-03-29T09:15:00",
  },
  {
    id: "F003",
    supporterName: "James Walker",
    kind: "skills",
    description: "Legal consult — custody paperwork",
    at: "2026-03-28T16:40:00",
  },
  {
    id: "F004",
    supporterName: "Priya Patel",
    kind: "social",
    description: "Campaign share — Spring appeal (12.4k reach)",
    at: "2026-03-27T11:05:00",
  },
  {
    id: "F005",
    supporterName: "Sarah Mitchell",
    kind: "monetary",
    amount: 1200,
    description: "Designated — Riverside Safehouse utilities",
    at: "2026-03-26T10:00:00",
  },
  {
    id: "F006",
    supporterName: "David Foster",
    kind: "in-kind",
    description: "Laptops refurbished — est. $2,400",
    at: "2026-03-25T13:30:00",
  },
];
