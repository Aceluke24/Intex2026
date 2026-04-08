import { apiFetch } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";

export type VisitationsFieldOptionsResident = {
  id: number;
  residentId: number;
  name: string;
  internalCode: string;
  caseControlNo: string;
};

export type VisitationsFieldOptions = {
  residents: VisitationsFieldOptionsResident[];
  interventionOptions: { value: string; label: string }[];
  followUpOptions: { value: string; label: string }[];
};

const empty: VisitationsFieldOptions = {
  residents: [],
  interventionOptions: [],
  followUpOptions: [],
};

/** Map API resident rows to the shape used by visit forms and filters. */
export function mapFieldOptionsResidentsToOptions(
  rows: VisitationsFieldOptionsResident[]
): { residentId: number; internalCode: string; caseControlNo: string }[] {
  return (rows ?? []).map((r) => ({
    residentId: typeof r.residentId === "number" ? r.residentId : r.id,
    internalCode: r.internalCode ?? "",
    caseControlNo: r.caseControlNo ?? "",
  }));
}

/**
 * Loads `/api/visitations/field-options` with auth. Never throws; returns safe defaults on failure.
 */
export async function fetchFieldOptions(): Promise<VisitationsFieldOptions> {
  try {
    const res = await apiFetch(`${API_PREFIX}/visitations/field-options`);
    if (!res.ok) {
      console.error("Field options failed:", res.status);
      return empty;
    }
    const raw = (await res.json()) as Partial<VisitationsFieldOptions> | null;
    return {
      residents: Array.isArray(raw?.residents) ? raw.residents : [],
      interventionOptions: Array.isArray(raw?.interventionOptions) ? raw.interventionOptions : [],
      followUpOptions: Array.isArray(raw?.followUpOptions) ? raw.followUpOptions : [],
    };
  } catch (err) {
    console.error("Field options error:", err);
    return empty;
  }
}
