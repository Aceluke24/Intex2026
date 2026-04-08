import { API_BASE } from "@/lib/apiBase";

/** GET /api/public/stats — aggregate DB metrics for homepage / impact (no PII). */
export type PublicHomeStats = {
  totalResidents: number | null;
  totalSafehouses: number | null;
  counselingSessionsCount: number | null;
  reintegrationRatePercent: number | null;
};

type ImpactSummary = {
  survivors: number | null;
  totalDonations: number | null;
  activePrograms: number | null;
  completionRate: number | null;
  reintegrationRate: number | null;
  safehouses: number | null;
};

type ProgramOutcomes = {
  safeHousing: number | null;
  education: number | null;
  counseling: number | null;
  interventionPlans: number | null;
};

type Campaign = {
  name: string;
  raised: number;
  goal: number;
  daysLeft: number;
};

type Allocation = {
  direct: number | null;
  outreach: number | null;
  operations: number | null;
};

type TrendRow = {
  year: number;
  month: number;
  total: number;
};

export type PublicImpactBundle = {
  residentsCount: number | null;
  summary: ImpactSummary;
  outcomes: ProgramOutcomes;
  campaigns: Campaign[];
  allocation: Allocation;
  trend: TrendRow[];
};

const toNumberOrNull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export async function fetchPublicHomeStats(): Promise<PublicHomeStats | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/stats`);
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return {
      totalResidents: toNumberOrNull(json.totalResidents),
      totalSafehouses: toNumberOrNull(json.totalSafehouses),
      counselingSessionsCount: toNumberOrNull(json.counselingSessionsCount),
      reintegrationRatePercent: toNumberOrNull(json.reintegrationRatePercent),
    };
  } catch (error) {
    console.error("[fetchPublicHomeStats]", error);
    return null;
  }
}

const defaultBundle: PublicImpactBundle = {
  residentsCount: null,
  summary: {
    survivors: null,
    totalDonations: null,
    activePrograms: null,
    completionRate: null,
    reintegrationRate: null,
    safehouses: null,
  },
  outcomes: {
    safeHousing: null,
    education: null,
    counseling: null,
    interventionPlans: null,
  },
  campaigns: [],
  allocation: {
    direct: null,
    outreach: null,
    operations: null,
  },
  trend: [],
};

export async function fetchPublicImpactBundle(): Promise<PublicImpactBundle> {
  try {
    const [residentsRes, summaryRes, outcomesRes, campaignsRes, allocationRes, trendRes] = await Promise.all([
      fetch(`${API_BASE}/api/public/residents/count`),
      fetch(`${API_BASE}/api/public/impact/summary`),
      fetch(`${API_BASE}/api/public/impact/program-outcomes`),
      fetch(`${API_BASE}/api/public/impact/campaigns`),
      fetch(`${API_BASE}/api/public/impact/allocation`),
      fetch(`${API_BASE}/api/public/impact/donations-trend`),
    ]);

    const residentsJson = residentsRes.ok ? await residentsRes.json().catch(() => ({})) : {};
    const summaryJson = summaryRes.ok ? await summaryRes.json().catch(() => ({})) : {};
    const outcomesJson = outcomesRes.ok ? await outcomesRes.json().catch(() => ({})) : {};
    const campaignsJson = campaignsRes.ok ? await campaignsRes.json().catch(() => []) : [];
    const allocationJson = allocationRes.ok ? await allocationRes.json().catch(() => ({})) : {};
    const trendJson = trendRes.ok ? await trendRes.json().catch(() => []) : [];

    return {
      residentsCount: toNumberOrNull(residentsJson.count),
      summary: {
        survivors: toNumberOrNull(summaryJson.survivors),
        totalDonations: toNumberOrNull(summaryJson.totalDonations),
        activePrograms: toNumberOrNull(summaryJson.activePrograms),
        completionRate: toNumberOrNull(summaryJson.completionRate),
        reintegrationRate: toNumberOrNull(summaryJson.reintegrationRate),
        safehouses: toNumberOrNull(summaryJson.safehouses),
      },
      outcomes: {
        safeHousing: toNumberOrNull(outcomesJson.safeHousing),
        education: toNumberOrNull(outcomesJson.education),
        counseling: toNumberOrNull(outcomesJson.counseling),
        interventionPlans: toNumberOrNull(outcomesJson.interventionPlans),
      },
      campaigns: Array.isArray(campaignsJson) ? campaignsJson : [],
      allocation: {
        direct: toNumberOrNull(allocationJson.direct),
        outreach: toNumberOrNull(allocationJson.outreach),
        operations: toNumberOrNull(allocationJson.operations),
      },
      trend: Array.isArray(trendJson) ? trendJson : [],
    };
  } catch (error) {
    console.error("[publicImpact]", error);
    return defaultBundle;
  }
}
