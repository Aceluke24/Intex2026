import { API_PREFIX } from "@/lib/apiBase";
import { apiFetchJson } from "@/lib/apiFetch";
import { useCallback, useEffect, useMemo, useState } from "react";

export type DonationRecord = {
  donationId: number;
  supporterId: number | null;
  donationType: string;
  donationDate: string;
  amount: number | null;
  estimatedValue: number | null;
  impactUnit: string | null;
  isRecurring: boolean;
  campaignName: string | null;
  notes: string | null;
  supporterDisplayName: string | null;
  supporterOrganizationName: string | null;
  supporterFirstName: string | null;
  supporterLastName: string | null;
};

export type DonationFilters = {
  page: number;
  pageSize: number;
  donationType: string;
  campaignName: string;
  search: string;
  dateFrom: string | null;
  dateTo: string | null;
  minAmount: string | null;
  maxAmount: string | null;
};

const DEFAULT_DEBOUNCE_MS = 350;

export function useDonations(filters: DonationFilters, enabled = true, debounceMs = DEFAULT_DEBOUNCE_MS) {
  const [items, setItems] = useState<DonationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));
    if (filters.donationType !== "All") params.set("donationType", filters.donationType);
    if (filters.campaignName.trim()) params.set("campaignName", filters.campaignName.trim());
    if (filters.search.trim()) params.set("search", filters.search.trim());
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.minAmount?.trim()) params.set("minAmount", filters.minAmount.trim());
    if (filters.maxAmount?.trim()) params.set("maxAmount", filters.maxAmount.trim());
    return params.toString();
  }, [
    filters.page,
    filters.pageSize,
    filters.donationType,
    filters.campaignName,
    filters.search,
    filters.dateFrom,
    filters.dateTo,
    filters.minAmount,
    filters.maxAmount,
  ]);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const data = await apiFetchJson<{ total: number; items?: unknown[]; donations?: unknown[] }>(`${API_PREFIX}/donations?${query}`);
      const rows = Array.isArray(data.donations) ? data.donations : Array.isArray(data.items) ? data.items : [];
      console.log("Donations result:", rows.length);
      const normalized = rows.map((row) => {
        const r = row as Record<string, unknown>;
        const supporter = (r.supporter ?? null) as Record<string, unknown> | null;
        return {
          donationId: Number(r.donationId ?? r.donation_id ?? 0),
          supporterId: (r.supporterId ?? r.supporter_id ?? null) as number | null,
          donationType: String(r.donationType ?? r.donation_type ?? "Monetary"),
          donationDate: String(r.donationDate ?? r.donation_date ?? ""),
          amount: (r.amount ?? null) as number | null,
          estimatedValue: (r.estimatedValue ?? r.estimated_value ?? null) as number | null,
          impactUnit: (r.impactUnit ?? r.impact_unit ?? null) as string | null,
          isRecurring: Boolean(r.isRecurring ?? r.is_recurring ?? false),
          campaignName: (r.campaignName ?? r.campaign_name ?? null) as string | null,
          notes: (r.notes ?? null) as string | null,
          supporterDisplayName: (
            r.supporterDisplayName ??
            r.supporter_display_name ??
            r.display_name ??
            supporter?.display_name ??
            supporter?.displayName ??
            null
          ) as string | null,
          supporterOrganizationName: (
            r.supporterOrganizationName ??
            r.supporter_organization_name ??
            r.organization_name ??
            supporter?.organization_name ??
            supporter?.organizationName ??
            null
          ) as string | null,
          supporterFirstName: (
            r.supporterFirstName ??
            r.supporter_first_name ??
            r.first_name ??
            supporter?.first_name ??
            supporter?.firstName ??
            null
          ) as string | null,
          supporterLastName: (
            r.supporterLastName ??
            r.supporter_last_name ??
            r.last_name ??
            supporter?.last_name ??
            supporter?.lastName ??
            null
          ) as string | null,
        } satisfies DonationRecord;
      });
      setItems(normalized);
      setTotal(Number(data.total) || 0);
    } finally {
      setLoading(false);
    }
  }, [enabled, query]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      void load();
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [enabled, load, debounceMs]);

  return { items, total, loading, reload: load };
}
