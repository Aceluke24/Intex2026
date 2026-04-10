import { AdminLayout } from "@/components/AdminLayout";
import { DASHBOARD_CONTENT_MAX_WIDTH } from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { SkeletonCard } from "@/components/SkeletonLoaders";
import { API_PREFIX } from "@/lib/apiBase";
import { apiFetchJson } from "@/lib/apiFetch";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

type RiskLevelCountDto = {
  level: string;
  count: number;
};

type SafehouseCapacityRowDto = {
  safehouseId: number;
  name: string;
  currentOccupancy: number;
  capacityGirls: number;
  occupancyRatio: number;
};

type DashboardResponseDto = {
  kpis?: {
    residentRiskSummary: {
      activeResidents: number;
      byRiskLevel: RiskLevelCountDto[];
      highCriticalCount: number;
    };
    visits: {
      next7Days: number;
      overdueFollowUps: number;
    };
    donorHealth: {
      repeatDonorRate: number | null;
      repeatDonors: number;
      totalDonors: number;
      activeDonors30Days: number;
      totalThisMonth: number;
    };
    impactValue: {
      totalThisMonth: number;
      monetaryThisMonth: number;
      inKindThisMonth: number;
      timeThisMonth: number;
    };
    safehouseCapacity: {
      nearCapacityCount: number;
      nearCapacity: SafehouseCapacityRowDto[];
    };
    incidents: {
      last7Days: number;
      unresolvedCount: number;
      severityBreakdown: RiskLevelCountDto[];
    };
    caseProgress: {
      inProgressPercent: number;
      achievedPercent: number;
      overduePlans: number;
      totalPlans: number;
    };
    wellbeing: {
      avgGeneralHealthScore30Days: number | null;
      isCritical: boolean;
    };
    education: {
      avgProgressPercent: number | null;
      avgAttendanceRate: number | null;
    };
  };
  insights?: string[];
  generatedAtUtc?: string;
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} className="rounded-xl p-5 shadow-sm" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded-md bg-muted/60" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 rounded-md bg-muted/60" />
            ))}
          </div>
        </div>
      </div>
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

function formatPct(v: number | null | undefined) {
  if (v == null) return "No data available";
  return `${v.toFixed(1)}%`;
}

function statusTone(level: string) {
  const value = level.trim().toLowerCase();
  if (value === "critical" || value === "high") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
  if (value === "medium") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
}

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponseDto | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

  const loadOverview = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetchJson<DashboardResponseDto>(`${API_PREFIX}/dashboard`, { timeoutMs: 20000 });
      setData(data);
      setInsights(data.insights ?? []);
    } catch (e) {
      console.error("Dashboard API error:", e);
      setError(e instanceof Error ? e.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadOverview();
  }, [loadOverview]);

  const kpis = data?.kpis;
  const riskBreakdown = kpis?.residentRiskSummary.byRiskLevel ?? [];
  const severityBreakdown = kpis?.incidents.severityBreakdown ?? [];

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell title="Overview" description="Executive operational summary.">
        {loading ? <DashboardSkeleton /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}
        {!loading && !error ? (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Link to="/dashboard/caseload" className="rounded-xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-red-300 hover:bg-red-50/40 dark:hover:bg-red-950/20">
                <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Resident Risk Summary</p>
                <p className="mt-2 font-display text-3xl font-semibold text-red-700 dark:text-red-300">{kpis ? kpis.residentRiskSummary.highCriticalCount : "No data available"}</p>
                <p className="mt-1 font-body text-sm text-muted-foreground">{kpis ? `${kpis.residentRiskSummary.activeResidents} active residents` : "No data available"}</p>
              </Link>
              <Link to="/dashboard/visitations" className="rounded-xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
                <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Upcoming / Missed Visits</p>
                <p className="mt-2 font-display text-3xl font-semibold text-foreground">{kpis ? `${kpis.visits.next7Days} / ${kpis.visits.overdueFollowUps}` : "No data available"}</p>
                <p className="mt-1 font-body text-sm text-muted-foreground">Next 7 days / Overdue follow-ups</p>
              </Link>
              <Link to="/dashboard/donors" className="rounded-xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20">
                <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Donor Health</p>
                <p className="mt-2 font-display text-3xl font-semibold text-foreground">{kpis ? formatPct(kpis.donorHealth.repeatDonorRate) : "No data available"}</p>
                <p className="mt-1 font-body text-sm text-muted-foreground">{kpis ? `${kpis.donorHealth.activeDonors30Days} active donors (30d)` : "No data available"}</p>
              </Link>
              <Link to="/dashboard/donors" className="rounded-xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20">
                <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Total Impact Value</p>
                <p className="mt-2 font-display text-3xl font-semibold text-foreground">{kpis ? formatMoney(kpis.impactValue.totalThisMonth) : "No data available"}</p>
                <p className="mt-1 font-body text-sm text-muted-foreground">Monetary + In-Kind + Time this month</p>
              </Link>
              <Link to="/dashboard/caseload" className="rounded-xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
                <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Safehouse Capacity Alert</p>
                <p className="mt-2 font-display text-3xl font-semibold text-amber-700 dark:text-amber-300">{kpis ? kpis.safehouseCapacity.nearCapacityCount : "No data available"}</p>
                <p className="mt-1 font-body text-sm text-muted-foreground">Safehouses above 90% occupancy</p>
              </Link>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">Resident Risk Breakdown</h2>
                {riskBreakdown.length === 0 ? <p className="mt-4 font-body text-sm text-muted-foreground">No data available</p> : (
                  <ul className="mt-4 space-y-2">
                    {riskBreakdown.map((risk) => (
                      <li key={risk.level} className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2">
                        <p className="font-body text-sm font-medium text-foreground">{risk.level}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(risk.level)}`}>{risk.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">Incident Alerts</h2>
                {!kpis ? <p className="mt-4 font-body text-sm text-muted-foreground">No data available</p> : (
                  <div className="mt-4 space-y-3">
                    <p className="font-body text-sm text-foreground">
                      Last 7 days: <span className="font-semibold">{kpis.incidents.last7Days}</span> | Unresolved: <span className="font-semibold text-red-700 dark:text-red-300">{kpis.incidents.unresolvedCount}</span>
                    </p>
                    <ul className="space-y-2">
                      {severityBreakdown.map((risk) => (
                        <li key={risk.level} className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2">
                          <p className="font-body text-sm text-foreground">{risk.level}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(risk.level)}`}>{risk.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">Case Progress Signal</h2>
                {!kpis ? <p className="mt-4 font-body text-sm text-muted-foreground">No data available</p> : (
                  <div className="mt-4 space-y-2 font-body text-sm text-foreground">
                    <p>In Progress: <span className="font-semibold text-amber-700 dark:text-amber-300">{formatPct(kpis.caseProgress.inProgressPercent)}</span></p>
                    <p>Achieved: <span className="font-semibold text-emerald-700 dark:text-emerald-300">{formatPct(kpis.caseProgress.achievedPercent)}</span></p>
                    <p>Overdue plans: <span className="font-semibold text-red-700 dark:text-red-300">{kpis.caseProgress.overduePlans}</span></p>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">Wellbeing + Education Snapshot</h2>
                {!kpis ? <p className="mt-4 font-body text-sm text-muted-foreground">No data available</p> : (
                  <div className="mt-4 space-y-2 font-body text-sm text-foreground">
                    <p>
                      Health score (30d):{" "}
                      <span className={kpis.wellbeing.isCritical ? "font-semibold text-red-700 dark:text-red-300" : "font-semibold text-emerald-700 dark:text-emerald-300"}>
                        {kpis.wellbeing.avgGeneralHealthScore30Days?.toFixed(2) ?? "No data available"}
                      </span>
                    </p>
                    <p>Avg progress: <span className="font-semibold">{formatPct(kpis.education.avgProgressPercent)}</span></p>
                    <p>
                      Avg attendance:{" "}
                      <span className="font-semibold">
                        {kpis.education.avgAttendanceRate == null ? "No data available" : formatPct(kpis.education.avgAttendanceRate * 100)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">Capacity Watchlist</h2>
                {!kpis || kpis.safehouseCapacity.nearCapacity.length === 0 ? (
                  <p className="mt-4 font-body text-sm text-muted-foreground">No data available</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {kpis.safehouseCapacity.nearCapacity.map((house) => (
                      <li key={house.safehouseId} className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2">
                        <p className="font-body text-sm font-medium text-foreground">{house.name}</p>
                        <span className={house.occupancyRatio >= 1 ? "rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-200" : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"}>
                          {house.currentOccupancy}/{house.capacityGirls}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">Operational Insights</h2>
                <ul className="mt-4 space-y-2">
                  {insights.map((line) => (
                    <li key={line} className="rounded-lg border border-border/60 bg-background px-3 py-2 font-body text-sm text-foreground">
                      {line}
                    </li>
                  ))}
                </ul>
                {!insights.length ? <p className="mt-4 font-body text-sm text-muted-foreground">No data available</p> : null}
              </div>
            </section>
          </div>
        ) : null}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default DashboardPage;
