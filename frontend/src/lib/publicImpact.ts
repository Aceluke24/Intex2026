import { API_BASE, apiUrl } from "@/lib/apiBase";

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

/** Accepts number, numeric string, camelCase or PascalCase keys. */
function readNum(obj: unknown, ...keys: string[]): number | null {
  if (obj === null || obj === undefined || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

function arrayLength(data: unknown): number | null {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object" && "data" in data) {
    const inner = (data as { data: unknown }).data;
    if (Array.isArray(inner)) return inner.length;
  }
  return null;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

/**
 * Loads homepage impact metrics from public APIs in parallel.
 * Merges `/api/public/stats` with dedicated count endpoints so values populate
 * even if one response shape differs or a single call fails.
 */
export async function fetchPublicHomeStats(): Promise<PublicHomeStats> {
  const empty: PublicHomeStats = {
    totalResidents: null,
    totalSafehouses: null,
    counselingSessionsCount: null,
    reintegrationRatePercent: null,
  };

  try {
    const [
      statsRes,
      residentsRes,
      safehousesCountRes,
      recordingsRes,
      reintRes,
      safehousesListRes,
    ] = await Promise.all([
      fetch(apiUrl("/api/public/stats")),
      fetch(apiUrl("/api/public/residents/count")),
      fetch(apiUrl("/api/public/safehouses/count")),
      fetch(apiUrl("/api/public/recordings/count")),
      fetch(apiUrl("/api/public/residents/reintegration-rate")),
      fetch(apiUrl("/api/public/safehouses")),
    ]);

    const [statsJson, residentsJson, shCountJson, recJson, reintJson, safehousesListJson] = await Promise.all([
      parseJson(statsRes),
      parseJson(residentsRes),
      parseJson(safehousesCountRes),
      parseJson(recordingsRes),
      parseJson(reintRes),
      parseJson(safehousesListRes),
    ]);

    if (import.meta.env.DEV) {
      console.log("API BASE:", API_BASE || "(same-origin)");
      console.log("SAFEHOUSES (list /api/public/safehouses):", safehousesListJson);
      console.log("PROCESS RECORDINGS (count payload):", recJson);
    }

    const fromStats = {
      totalResidents: readNum(statsJson, "totalResidents", "TotalResidents"),
      totalSafehouses: readNum(statsJson, "totalSafehouses", "TotalSafehouses"),
      counselingSessionsCount: readNum(statsJson, "counselingSessionsCount", "CounselingSessionsCount"),
      reintegrationRatePercent: readNum(statsJson, "reintegrationRatePercent", "ReintegrationRatePercent"),
    };

    const residentsFromCount = readNum(residentsJson, "count", "Count");
    const safehousesFromCount = readNum(shCountJson, "count", "Count");
    const recordingsFromCount = readNum(recJson, "count", "Count");
    const reintFromDedicated = readNum(reintJson, "reintegrationRatePercent", "ReintegrationRatePercent");
    const residentsFromReint = readNum(reintJson, "totalResidents", "TotalResidents");
    const safehousesFromList = arrayLength(safehousesListJson);

    // ?? preserves 0; only falls through on null/undefined
    const merged: PublicHomeStats = {
      totalResidents: fromStats.totalResidents ?? residentsFromCount ?? residentsFromReint ?? null,
      totalSafehouses: fromStats.totalSafehouses ?? safehousesFromCount ?? safehousesFromList ?? null,
      counselingSessionsCount: fromStats.counselingSessionsCount ?? recordingsFromCount ?? null,
      reintegrationRatePercent: fromStats.reintegrationRatePercent ?? reintFromDedicated ?? null,
    };

    if (import.meta.env.DEV) {
      console.log({
        residents: merged.totalResidents,
        safehouses: merged.totalSafehouses,
        counselingSessions: merged.counselingSessionsCount,
        reintegrationRate: merged.reintegrationRatePercent,
      });
    }

    return merged;
  } catch (error) {
    console.error("[fetchPublicHomeStats]", error);
    return empty;
  }
}

const toNumberOrNull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

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
      fetch(apiUrl("/api/public/residents/count")),
      fetch(apiUrl("/api/public/impact/summary")),
      fetch(apiUrl("/api/public/impact/program-outcomes")),
      fetch(apiUrl("/api/public/impact/campaigns")),
      fetch(apiUrl("/api/public/impact/allocation")),
      fetch(apiUrl("/api/public/impact/donations-trend")),
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
