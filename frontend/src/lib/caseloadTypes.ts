export type CaseStatus = "Active" | "Pending" | "Reintegration" | "Closed" | "HighRisk" | "Transferred";

export type CaseCategory =
  | "Trafficking"
  | "Abuse"
  | "Neglect"
  | "Domestic violence"
  | "Exploitation"
  | "Displacement"
  | "Abandoned"
  | "Foundling"
  | "Surrendered"
  | string;

export type RiskLevel = "Standard" | "Elevated" | "High";

export const caseCategories: CaseCategory[] = [
  "Trafficking",
  "Abuse",
  "Neglect",
  "Domestic violence",
  "Exploitation",
  "Displacement",
  "Abandoned",
  "Foundling",
  "Surrendered",
];

export const reintegrationPhases = ["Intake", "Stabilization", "Intervention", "Reintegration"] as const;

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

export interface ResidentCase {
  id: string;
  displayName: string;
  anonymized: boolean;
  age: number;
  ageUponAdmission: string;
  presentAge: string;
  lengthOfStay: string;
  gender: string;
  birthStatus: string | null;
  religion: string | null;
  category: CaseCategory;
  subcategory: string;
  disability: string | null;
  socio: SocioDemoProfile;
  familyParentPwd: boolean;
  admissionDate: string;
  referralSource: string;
  referringAgencyPerson: string | null;
  originLocation: string;
  dateColbRegistered: string | null;
  dateColbObtained: string | null;
  dateCaseStudyPrepared: string | null;
  safehouse: string;
  assignedWorker: string;
  reintegrationType: string | null;
  reintegrationStatus: string | null;
  dateClosed: string | null;
  caseNotes: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  reintegrationProgress: number;
  phaseIndex: number;
  lastUpdate: string;
  timeline: CaseTimelineEntry[];
  keywords: string[];
}

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
