import { socialWorkers } from "@/lib/caseloadMockData";

export type VisitType = "Initial assessment" | "Routine follow-up" | "Reintegration" | "Emergency";

export type CooperationLevel = "Strong" | "Moderate" | "Limited";

export interface HomeVisitEntry {
  id: string;
  visitType: VisitType;
  date: string;
  time: string;
  resident: string;
  residentCaseId: string;
  worker: string;
  address: string;
  environmentObservations: string;
  cooperation: CooperationLevel;
  safetyConcerns: string | null;
  followUp: string;
  status: "Scheduled" | "Completed" | "Cancelled";
}

export interface ConferenceUpcoming {
  id: string;
  date: string;
  time: string;
  title: string;
  resident: string;
  residentCaseId: string;
  participants: string[];
  location: string;
}

export interface ConferencePast {
  id: string;
  date: string;
  title: string;
  resident: string;
  residentCaseId: string;
  participants: string[];
  summary: string;
  outcomes: string;
}

export const initialHomeVisits: HomeVisitEntry[] = [
  {
    id: "HV-106",
    visitType: "Emergency",
    date: "2026-04-07",
    time: "4:30 PM",
    resident: "Resident G.",
    residentCaseId: "CS-2026-0195",
    worker: socialWorkers[2],
    address: "███ Riverside district",
    environmentObservations:
      "Neighbor dispute audible; front door lock recently replaced. Lighting adequate on stairwell.",
    cooperation: "Moderate",
    safetyConcerns: "Possible surveillance by former partner’s associate — documented photos of unknown vehicle.",
    followUp: "Coordinate with barangay tanod; escort for next school run.",
    status: "Scheduled",
  },
  {
    id: "HV-105",
    visitType: "Reintegration",
    date: "2026-04-06",
    time: "10:00 AM",
    resident: "Resident C.",
    residentCaseId: "CS-2025-0921",
    worker: socialWorkers[1],
    address: "███ Subdivision unit",
    environmentObservations:
      "Unit clean; children's study corner set up. Landlord responsive to minor repairs.",
    cooperation: "Strong",
    safetyConcerns: null,
    followUp: "Confirm utilities transfer; school transport subsidy application.",
    status: "Completed",
  },
  {
    id: "HV-104",
    visitType: "Routine follow-up",
    date: "2026-04-05",
    time: "2:00 PM",
    resident: "Resident A.",
    residentCaseId: "CS-2026-0142",
    worker: socialWorkers[0],
    address: "███ Oak Street",
    environmentObservations: "Quiet neighborhood; supportive cousin present during visit.",
    cooperation: "Strong",
    safetyConcerns: null,
    followUp: "Continue biweekly visits through April.",
    status: "Completed",
  },
  {
    id: "HV-103",
    visitType: "Initial assessment",
    date: "2026-04-08",
    time: "9:30 AM",
    resident: "Resident B.",
    residentCaseId: "CS-2026-0188",
    worker: socialWorkers[2],
    address: "███ Coastal barangay",
    environmentObservations: "Pending — intake walkthrough scheduled.",
    cooperation: "Moderate",
    safetyConcerns: null,
    followUp: "Complete housing safety checklist; interpreter on site.",
    status: "Scheduled",
  },
];

export const upcomingConferences: ConferenceUpcoming[] = [
  {
    id: "CC-U1",
    date: "2026-04-12",
    time: "10:00 AM",
    title: "Reintegration readiness — Resident C.",
    resident: "Resident C.",
    residentCaseId: "CS-2025-0921",
    participants: ["Maria Gonzales", "Dr. James Kim", "School liaison", "Legal advocate"],
    location: "North Safehouse — Conference room A",
  },
  {
    id: "CC-U2",
    date: "2026-04-14",
    time: "3:00 PM",
    title: "Safeguarding review — Resident D.",
    resident: "Resident D.",
    residentCaseId: "CS-2026-0201",
    participants: ["Sarah Lin", "Elena Reyes", "PNP WCPD representative"],
    location: "Harbor Safehouse — Secure VC",
  },
];

export const pastConferences: ConferencePast[] = [
  {
    id: "CC-P1",
    date: "2026-03-22",
    title: "Multi-agency plan — Resident B.",
    resident: "Resident B.",
    residentCaseId: "CS-2026-0188",
    participants: ["Sarah Lin", "NGO partner", "DSWD"],
    summary:
      "Aligned on protection timeline and education continuity. Agreed shared communication log.",
    outcomes: "Signed MOU addendum; weekly case notes to guardian until May.",
  },
  {
    id: "CC-P2",
    date: "2026-03-08",
    title: "Quarterly outcomes — cohort Q1",
    resident: "Multiple",
    residentCaseId: "—",
    participants: ["Leadership team", "All RSW leads"],
    summary: "Reviewed KPIs for counseling hours, reintegration exits, and donor-funded slots.",
    outcomes: "Approved two additional trauma training seats; revised referral SLA to 48h.",
  },
];
