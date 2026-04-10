import { AdminLayout } from "@/components/AdminLayout";
import { DASHBOARD_CONTENT_MAX_WIDTH } from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { SkeletonCard } from "@/components/SkeletonLoaders";
import { API_PREFIX } from "@/lib/apiBase";
import { apiFetchJson } from "@/lib/apiFetch";
import { useCallback, useEffect, useState } from "react";
type DashboardResponseDto = {
  success: boolean;
  overview?: {
    totalResidents: number;
    activeResidents: number;
    totalSupporters: number;
    totalDonationsThisMonth: number;
    totalIncidents: number;
  };
  risk?: {
    highRisk: number;
  };
  safehouses?: {
    total: number;
    overCapacity: number;
  };
};

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonCard key={i} className="rounded-xl p-5 shadow-sm" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 shadow-sm" role="alert">
      <p className="font-display text-lg font-semibold text-destructive">Unable to load overview</p>
      <p className="mt-2 font-body text-sm text-destructive/90">{message}</p>
    </div>
  );
}

const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function formatMoney(v: number | null | undefined) {
  if (v == null) return "No data available";
  return currency.format(v);
}

const DashboardPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponseDto | null>(null);

  const loadOverview = useCallback(async () => {
    setError(null);
    try {
      const response = await apiFetchJson<DashboardResponseDto>(`${API_PREFIX}/dashboard`, { timeoutMs: 20000 });
      setData(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data");
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const overview = data?.overview;
  const risk = data?.risk;
  const safehouses = data?.safehouses;

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell title="Overview" description="Executive operational summary.">
        {error ? <ErrorState message={error} /> : null}
        {!data?.overview ? (
          <LoadingSkeleton />
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Total Residents</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">{overview?.totalResidents ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Active Cases</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">{overview?.activeResidents ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Donations This Month</p>
              <p className="mt-2 font-display text-3xl font-semibold text-foreground">{formatMoney(overview?.totalDonationsThisMonth)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">High Risk Residents</p>
              <p className="mt-2 font-display text-3xl font-semibold text-red-700 dark:text-red-300">{risk?.highRisk ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Capacity Alerts</p>
              <p className="mt-2 font-display text-3xl font-semibold text-amber-700 dark:text-amber-300">{safehouses?.overCapacity ?? 0}</p>
            </div>
          </section>
        )}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default DashboardPage;
