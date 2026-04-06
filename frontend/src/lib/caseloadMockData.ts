import { safehouses } from "@/lib/donorsContributionsMockData";

export type CaseStatus = "Active" | "Pending" | "Reintegration" | "Closed";

export type CaseCategory =
  | "Trafficking"
  | "Abuse"
  | "Neglect"
  | "Domestic violence"
  | "Exploitation"
  | "Displacement";

export type RiskLevel = "Standard" | "Elevated" | "High";

export const caseCategories: CaseCategory[] = [
  "Trafficking",
  "Abuse",
  "Neglect",
  "Domestic violence",
  "Exploitation",
  "Displacement",
];

export const socialWorkers = [
  "Maria Gonzales, RSW",
  "Dr. James Kim",
  "Sarah Lin, MSW",
  "Elena Reyes, RSW",
  "Andre Walker, MSW",
];

export interface SocioDemoProfile {
  fourPsBeneficiary: boolean;
  soloParentHousehold: boolean;
  indigenousGroup: string | null;
  informalSettler: boolean;
}

export interface CaseTimelineEntry {
  id: string;
  at: string;
  summary: string;
}

export const reintegrationPhases = ["Intake", "Stabilization", "Intervention", "Reintegration"] as const;

export interface ResidentCase {
  id: string;
  displayName: string;
  anonymized: boolean;
  age: number;
  gender: string;
  category: CaseCategory;
  subcategory: string;
  disability: string | null;
  socio: SocioDemoProfile;
  admissionDate: string;
  referralSource: string;
  originLocation: string;
  safehouse: string;
  assignedWorker: string;
  caseNotes: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  /** 0–100 */
  reintegrationProgress: number;
  /** 0–3 index into reintegrationPhases */
  phaseIndex: number;
  lastUpdate: string;
  timeline: CaseTimelineEntry[];
  keywords: string[];
}

export const initialCases: ResidentCase[] = [
  {
    id: "CS-2026-0142",
    displayName: "Resident A.",
    anonymized: true,
    age: 32,
    gender: "Female",
    category: "Domestic violence",
    subcategory: "Intimate partner violence",
    disability: null,
    socio: {
      fourPsBeneficiary: true,
      soloParentHousehold: true,
      indigenousGroup: null,
      informalSettler: false,
    },
    admissionDate: "2026-03-12",
    referralSource: "Barangay VAW desk",
    originLocation: "Cebu City",
    safehouse: safehouses[0],
    assignedWorker: socialWorkers[0],
    caseNotes: "Weekly check-ins; safety plan reviewed Apr 1.",
    status: "Active",
    riskLevel: "Elevated",
    reintegrationProgress: 62,
    phaseIndex: 2,
    lastUpdate: "2026-04-04",
    keywords: ["housing", "children"],
    timeline: [
      { id: "t1", at: "2026-03-12T10:00:00", summary: "Admission intake completed; risk screen documented." },
      { id: "t2", at: "2026-03-28T14:20:00", summary: "Counseling plan updated; legal referral sent." },
      { id: "t3", at: "2026-04-04T09:00:00", summary: "Home visit scheduled with partner agency." },
    ],
  },
  {
    id: "CS-2026-0188",
    displayName: "Resident B.",
    anonymized: true,
    age: 19,
    gender: "Female",
    category: "Trafficking",
    subcategory: "Labor exploitation",
    disability: "Hearing impairment — assistive devices",
    socio: {
      fourPsBeneficiary: false,
      soloParentHousehold: false,
      indigenousGroup: "Lumad",
      informalSettler: true,
    },
    admissionDate: "2026-04-02",
    referralSource: "NGO partner — coastal outreach",
    originLocation: "Davao del Norte",
    safehouse: safehouses[1],
    assignedWorker: socialWorkers[2],
    caseNotes: "High monitoring; coordination with DOLE pending.",
    status: "Active",
    riskLevel: "High",
    reintegrationProgress: 28,
    phaseIndex: 1,
    lastUpdate: "2026-04-05",
    keywords: ["minor", "legal"],
    timeline: [
      { id: "t1", at: "2026-04-02T16:00:00", summary: "Emergency admission; guardian notified per protocol." },
      { id: "t2", at: "2026-04-05T11:30:00", summary: "Trauma assessment scheduled; interpreter booked." },
    ],
  },
  {
    id: "CS-2025-0921",
    displayName: "Resident C.",
    anonymized: true,
    age: 41,
    gender: "Female",
    category: "Abuse",
    subcategory: "Child in home",
    disability: null,
    socio: {
      fourPsBeneficiary: true,
      soloParentHousehold: true,
      indigenousGroup: null,
      informalSettler: true,
    },
    admissionDate: "2025-11-03",
    referralSource: "School social worker",
    originLocation: "Iloilo",
    safehouse: safehouses[2],
    assignedWorker: socialWorkers[1],
    caseNotes: "Transition plan approved; housing voucher in progress.",
    status: "Reintegration",
    riskLevel: "Standard",
    reintegrationProgress: 84,
    phaseIndex: 3,
    lastUpdate: "2026-04-03",
    keywords: ["education", "transition"],
    timeline: [
      { id: "t1", at: "2026-03-15T10:00:00", summary: "Reintegration review — milestones on track." },
      { id: "t2", at: "2026-04-03T15:00:00", summary: "Follow-up call with landlord; lease signed." },
    ],
  },
  {
    id: "CS-2026-0201",
    displayName: "Resident D.",
    anonymized: true,
    age: 27,
    gender: "Non-binary",
    category: "Exploitation",
    subcategory: "Online coercion",
    disability: null,
    socio: {
      fourPsBeneficiary: false,
      soloParentHousehold: false,
      indigenousGroup: null,
      informalSettler: false,
    },
    admissionDate: "2026-04-05",
    referralSource: "PNP WCPD",
    originLocation: "Metro Manila",
    safehouse: safehouses[0],
    assignedWorker: socialWorkers[3],
    caseNotes: "Digital safety training started.",
    status: "Pending",
    riskLevel: "Elevated",
    reintegrationProgress: 12,
    phaseIndex: 0,
    lastUpdate: "2026-04-05",
    keywords: ["cyber", "urgent"],
    timeline: [{ id: "t1", at: "2026-04-05T08:30:00", summary: "Pending placement — documentation in review." }],
  },
  {
    id: "CS-2024-0603",
    displayName: "Resident E.",
    anonymized: true,
    age: 35,
    gender: "Female",
    category: "Neglect",
    subcategory: "Dependent adult",
    disability: "Mobility — wheelchair user",
    socio: {
      fourPsBeneficiary: true,
      soloParentHousehold: false,
      indigenousGroup: null,
      informalSettler: false,
    },
    admissionDate: "2024-08-20",
    referralSource: "Hospital SW",
    originLocation: "Bacolod",
    safehouse: safehouses[1],
    assignedWorker: socialWorkers[4],
    caseNotes: "Case closed — successful independent living.",
    status: "Closed",
    riskLevel: "Standard",
    reintegrationProgress: 100,
    phaseIndex: 3,
    lastUpdate: "2026-01-18",
    keywords: ["closed", "success"],
    timeline: [{ id: "t1", at: "2026-01-18T12:00:00", summary: "Exit interview; aftercare resources provided." }],
  },
  {
    id: "CS-2026-0110",
    displayName: "Resident F.",
    anonymized: true,
    age: 24,
    gender: "Male",
    category: "Displacement",
    subcategory: "Climate relocation",
    disability: null,
    socio: {
      fourPsBeneficiary: false,
      soloParentHousehold: false,
      indigenousGroup: "Mangyan",
      informalSettler: true,
    },
    admissionDate: "2026-02-14",
    referralSource: "DSWD regional office",
    originLocation: "Occidental Mindoro",
    safehouse: safehouses[2],
    assignedWorker: socialWorkers[0],
    caseNotes: "Livelihood assessment complete.",
    status: "Active",
    riskLevel: "Standard",
    reintegrationProgress: 55,
    phaseIndex: 2,
    lastUpdate: "2026-04-02",
    keywords: ["livelihood"],
    timeline: [{ id: "t1", at: "2026-04-02T09:15:00", summary: "Skills training enrollment confirmed." }],
  },
  {
    id: "CS-2026-0195",
    displayName: "Resident G.",
    anonymized: true,
    age: 29,
    gender: "Female",
    category: "Domestic violence",
    subcategory: "Post-separation stalking",
    disability: null,
    socio: {
      fourPsBeneficiary: true,
      soloParentHousehold: true,
      indigenousGroup: null,
      informalSettler: false,
    },
    admissionDate: "2026-04-01",
    referralSource: "Crisis hotline",
    originLocation: "Cagayan de Oro",
    safehouse: safehouses[0],
    assignedWorker: socialWorkers[2],
    caseNotes: "Protective order filed; court date Apr 20.",
    status: "Active",
    riskLevel: "High",
    reintegrationProgress: 40,
    phaseIndex: 1,
    lastUpdate: "2026-04-06",
    keywords: ["legal", "safety"],
    timeline: [
      { id: "t1", at: "2026-04-01T20:00:00", summary: "After-hours admission; immediate risk mitigation." },
      { id: "t2", at: "2026-04-06T10:00:00", summary: "Legal advocate assigned; court prep packet sent." },
    ],
  },
  {
    id: "CS-2025-0444",
    displayName: "Resident H.",
    anonymized: true,
    age: 16,
    gender: "Female",
    category: "Abuse",
    subcategory: "Familial",
    disability: null,
    socio: {
      fourPsBeneficiary: true,
      soloParentHousehold: false,
      indigenousGroup: null,
      informalSettler: true,
    },
    admissionDate: "2025-06-10",
    referralSource: "Child protection network",
    originLocation: "Zamboanga",
    safehouse: safehouses[1],
    assignedWorker: socialWorkers[3],
    caseNotes: "Guardianship hearing completed.",
    status: "Closed",
    riskLevel: "Elevated",
    reintegrationProgress: 100,
    phaseIndex: 3,
    lastUpdate: "2025-12-12",
    keywords: ["minor", "guardianship"],
    timeline: [{ id: "t1", at: "2025-12-12T16:00:00", summary: "Case closed — reunification with approved kin." }],
  },
];

export function computeCaseloadMetrics(cases: ResidentCase[], now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const active = cases.filter((c) => c.status === "Active").length;
  const newThisMonth = cases.filter((c) => {
    const d = new Date(c.admissionDate);
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
  const reint = cases.filter((c) => c.status === "Reintegration").length;
  const highRisk = cases.filter((c) => c.riskLevel === "High").length;
  const closed = cases.filter((c) => c.status === "Closed").length;
  return { active, newThisMonth, reint, highRisk, closed };
}
