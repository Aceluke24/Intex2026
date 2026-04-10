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
      const data = await apiFetchJson<{ total: number; items: DonationRecord[] }>(`${API_PREFIX}/donations?${query}`);
      setItems(Array.isArray(data.items) ? data.items : []);
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
