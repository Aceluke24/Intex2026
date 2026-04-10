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
  /** Distinct non-null campaign names on donations in the last 60 days */
  activeCampaignsCount: number | null;
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

function isMeaningfulCampaignName(name: string): boolean {
  const t = name.trim();
  if (t.length < 3) return false;
  if (t.length >= 5) return true;
  if (/\s/.test(t)) return true;
  if (/^[a-z]{3,4}$/i.test(t)) return false;
  return true;
}

/** Excludes placeholder names, zero-goal rows, and zero-raised campaigns with meaningless names. */
export function filterValidPublicCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((c) => {
    const name = (c.name ?? "").trim();
    const goal = Number(c.goal ?? 0);
    const raised = Number(c.raised ?? 0);
    if (!name || name.length < 3 || name.toLowerCase() === "d") return false;
    if (goal <= 0) return false;
    if (raised === 0 && !isMeaningfulCampaignName(name)) return false;
    return true;
  });
}

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
      statsResult,
      residentsResult,
      safehousesCountResult,
      recordingsResult,
      reintResult,
      safehousesListResult,
    ] = await Promise.allSettled([
      fetch(apiUrl("/api/public/stats")),
      fetch(apiUrl("/api/public/residents/count")),
      fetch(apiUrl("/api/public/safehouses/count")),
      fetch(apiUrl("/api/public/recordings/count")),
      fetch(apiUrl("/api/public/residents/reintegration-rate")),
      fetch(apiUrl("/api/public/safehouses")),
    ]);

    const parseSettled = async (result: PromiseSettledResult<Response>): Promise<unknown> => {
      if (result.status !== "fulfilled") return {};
      return parseJson(result.value);
    };

    const [statsJson, residentsJson, shCountJson, recJson, reintJson, safehousesListJson] = await Promise.all([
      parseSettled(statsResult),
      parseSettled(residentsResult),
      parseSettled(safehousesCountResult),
      parseSettled(recordingsResult),
      parseSettled(reintResult),
      parseSettled(safehousesListResult),
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

const toNumberOrNull = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
};

const defaultBundle: PublicImpactBundle = {
  residentsCount: null,
  summary: {
    survivors: null,
    totalDonations: null,
    activePrograms: null,
    completionRate: null,
    reintegrationRate: null,
    safehouses: null,
    activeCampaignsCount: null,
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
    const [
      residentsResult,
      summaryResult,
      outcomesResult,
      campaignsResult,
      allocationResult,
      trendResult,
    ] = await Promise.allSettled([
      fetch(apiUrl("/api/public/residents/count")),
      fetch(apiUrl("/api/public/impact/summary")),
      fetch(apiUrl("/api/public/impact/program-outcomes")),
      fetch(apiUrl("/api/public/impact/campaigns")),
      fetch(apiUrl("/api/public/impact/allocation")),
      fetch(apiUrl("/api/public/impact/donations-trend")),
    ]);

    const jsonOrDefault = async (result: PromiseSettledResult<Response>, fallback: unknown) => {
      if (result.status !== "fulfilled") return fallback;
      return result.value.ok ? await result.value.json().catch(() => fallback) : fallback;
    };

    const residentsJson = await jsonOrDefault(residentsResult, {});
    const summaryJson = await jsonOrDefault(summaryResult, {});
    const outcomesJson = await jsonOrDefault(outcomesResult, {});
    const campaignsJson = await jsonOrDefault(campaignsResult, []);
    const allocationJson = await jsonOrDefault(allocationResult, {});
    const trendJson = await jsonOrDefault(trendResult, []);

    const residentsCount = readNum(residentsJson, "count", "Count");
    const survivors = readNum(summaryJson, "survivors", "Survivors");
    const totalDonations = readNum(summaryJson, "totalDonations", "TotalDonations");
    const activePrograms = readNum(summaryJson, "activePrograms", "ActivePrograms");
    const activeCampaignsCount = readNum(summaryJson, "activeCampaignsCount", "ActiveCampaignsCount");
    const completionRate = readNum(summaryJson, "completionRate", "CompletionRate");
    const reintegrationRate = readNum(summaryJson, "reintegrationRate", "ReintegrationRate");
    const safehouses = readNum(summaryJson, "safehouses", "Safehouses");

    const safeHousing = readNum(outcomesJson, "safeHousing", "SafeHousing");
    const education = readNum(outcomesJson, "education", "Education");
    const counseling = readNum(outcomesJson, "counseling", "Counseling");
    const interventionPlans = readNum(outcomesJson, "interventionPlans", "InterventionPlans");

    const direct = readNum(allocationJson, "direct", "Direct");
    const outreach = readNum(allocationJson, "outreach", "Outreach");
    const operations = readNum(allocationJson, "operations", "Operations");

    return {
      residentsCount,
      summary: {
        survivors,
        totalDonations,
        activePrograms,
        activeCampaignsCount,
        completionRate,
        reintegrationRate,
        safehouses,
      },
      outcomes: {
        safeHousing,
        education,
        counseling,
        interventionPlans,
      },
      campaigns: Array.isArray(campaignsJson) ? campaignsJson : [],
      allocation: {
        direct,
        outreach,
        operations,
      },
      trend: Array.isArray(trendJson) ? trendJson : [],
    };
  } catch (error) {
    console.error("[publicImpact]", error);
    return defaultBundle;
  }
}
