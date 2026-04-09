/** Derived UI status for list cards, filters, and metrics (from server rules). */
export type CaseStatus = "Active" | "Pending" | "Reintegration" | "Closed" | "HighRisk" | "Transferred";

/** Stored on Residents.CaseStatus */
export type DbCaseStatus = "Active" | "Closed" | "Transferred";

/** Stored on Residents.CaseCategory */
export type SchemaCaseCategory = "Abandoned" | "Foundling" | "Surrendered" | "Neglected";

/** Stored on Residents.InitialRiskLevel / CurrentRiskLevel */
export type SchemaRiskLevel = "Low" | "Medium" | "High" | "Critical";

/** UI-friendly risk label derived from CurrentRiskLevel */
export type RiskLevel = "Standard" | "Elevated" | "High";

export const caseStatuses: DbCaseStatus[] = ["Active", "Closed", "Transferred"];

export const caseCategories: SchemaCaseCategory[] = ["Abandoned", "Foundling", "Surrendered", "Neglected"];

export const sexOptions = ["F", "M"] as const;

export const birthStatuses = ["Marital", "Non-Marital"] as const;

export const referralSources = [
  "Government Agency",
  "NGO",
  "Police",
  "Self-Referral",
  "Community",
  "Court Order",
] as const;

export const reintegrationTypes = [
  "Family Reunification",
  "Foster Care",
  "Adoption (Domestic)",
  "Adoption (Inter-Country)",
  "Independent Living",
  "None",
] as const;

export const reintegrationStatuses = ["Not Started", "In Progress", "Completed", "On Hold"] as const;

export const reintegrationPhases = ["Intake", "Stabilization", "Intervention", "Reintegration"] as const;

export const schemaRiskLevels: SchemaRiskLevel[] = ["Low", "Medium", "High", "Critical"];

export interface CaseTimelineEntry {
  id: string;
  at: string;
  summary: string;
}

export interface ResidentCase {
  residentId: number;
  /** CaseControlNo */
  id: string;
  /** InternalCode — editable display label in forms */
  displayName: string;
  caseStatus: DbCaseStatus;
  sex: string;
  dateOfBirth: string;
  birthStatus: string | null;
  placeOfBirth: string | null;
  religion: string | null;
  caseCategory: SchemaCaseCategory;
  /** Read-only summary of SubCat* flags (for list row) */
  subcategory: string;
  subCatOrphaned: boolean;
  subCatTrafficked: boolean;
  subCatChildLabor: boolean;
  subCatPhysicalAbuse: boolean;
  subCatSexualAbuse: boolean;
  subCatOsaec: boolean;
  subCatCicl: boolean;
  subCatAtRisk: boolean;
  subCatStreetChild: boolean;
  subCatChildWithHiv: boolean;
  isPwd: boolean;
  pwdType: string | null;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis: string | null;
  familyIs4ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyParentPwd: boolean;
  familyInformalSettler: boolean;
  admissionDate: string;
  dateEnrolled: string;
  referralSource: string | null;
  referringAgencyPerson: string | null;
  dateColbRegistered: string | null;
  dateColbObtained: string | null;
  dateCaseStudyPrepared: string | null;
  initialCaseAssessment: string | null;
  reintegrationType: string | null;
  reintegrationStatus: string | null;
  dateClosed: string | null;
  initialRiskLevel: SchemaRiskLevel;
  currentRiskLevel: SchemaRiskLevel;
  notesRestricted: string | null;
  safehouse: string;
  assignedWorker: string;
  /** Derived for list UI */
  status: CaseStatus;
  riskLevel: RiskLevel;
  reintegrationProgress: number;
  phaseIndex: number;
  lastUpdate: string;
  timeline: CaseTimelineEntry[];
  keywords: string[];
}

export type SubCatFlagKey =
  | "subCatOrphaned"
  | "subCatTrafficked"
  | "subCatChildLabor"
  | "subCatPhysicalAbuse"
  | "subCatSexualAbuse"
  | "subCatOsaec"
  | "subCatCicl"
  | "subCatAtRisk"
  | "subCatStreetChild"
  | "subCatChildWithHiv";

export const subcategoryFormFields: { key: SubCatFlagKey; label: string }[] = [
  { key: "subCatOrphaned", label: "Orphaned" },
  { key: "subCatTrafficked", label: "Trafficking" },
  { key: "subCatChildLabor", label: "Child labor" },
  { key: "subCatPhysicalAbuse", label: "Physical abuse" },
  { key: "subCatSexualAbuse", label: "Sexual abuse" },
  { key: "subCatOsaec", label: "OSAEC" },
  { key: "subCatCicl", label: "CICL" },
  { key: "subCatAtRisk", label: "At risk" },
  { key: "subCatStreetChild", label: "Street child" },
  { key: "subCatChildWithHiv", label: "Child with HIV" },
];

/** Mirrors backend CasesController.BuildSubcategory */
export function buildSubcategorySummary(c: Pick<ResidentCase, SubCatFlagKey>): string {
  const parts: string[] = [];
  for (const { key, label } of subcategoryFormFields) {
    if (c[key]) parts.push(label);
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}

/** Aligns with CasesController.MapRiskLabel (current risk → card UI). */
export function uiRiskFromSchemaCurrent(current: SchemaRiskLevel): RiskLevel {
  if (current === "High" || current === "Critical") return "High";
  if (current === "Medium") return "Elevated";
  return "Standard";
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
