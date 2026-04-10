import { AdminLayout } from "@/components/AdminLayout";
import { DASHBOARD_CONTENT_MAX_WIDTH } from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { SkeletonCard } from "@/components/SkeletonLoaders";
import { API_PREFIX } from "@/lib/apiBase";
import { apiFetchJson } from "@/lib/apiFetch";
import { useCallback, useEffect, useState } from "react";

type SummaryCardDto = {
  key: string;
  label: string;
  value: string;
  detail: string;
};

type ResidentOverviewDto = {
  id: string;
  safehouse: string | null;
  status: string;
  lastSession: string;
};

type DashboardResponseDto = {
  snapshotMetrics?: {
    highCriticalRiskCount: number;
    upcomingVisits7Days: number;
    repeatDonorRate: number | null;
    totalDonationsCount: number;
  };
  supportingMetrics?: Array<{ key: string; value: string; trendLabel: string }>;
  residentsOverview?: ResidentOverviewDto[];
  insights?: string[];
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

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<SummaryCardDto[]>([]);
  const [residentsOverview, setResidentsOverview] = useState<ResidentOverviewDto[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const loadOverview = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetchJson<DashboardResponseDto>(`${API_PREFIX}/dashboard`, { timeoutMs: 20000 });
      const snapshot = data.snapshotMetrics;
      const retentionMetric = data.supportingMetrics?.find((m) => m.key === "retention");
      const donationsMetric = data.supportingMetrics?.find((m) => m.key === "donations");

      setCards([
        {
          key: "high-risk",
          label: "Residents At Risk",
          value: String(snapshot?.highCriticalRiskCount ?? 0),
          detail: (snapshot?.highCriticalRiskCount ?? 0) > 0 ? "High + Critical cases" : "No high-risk residents",
        },
        {
          key: "upcoming-visits",
          label: "Upcoming Visits",
          value: String(snapshot?.upcomingVisits7Days ?? 0),
          detail: "Due in next 7 days",
        },
        {
          key: "retention",
          label: "Donor Retention",
          value: retentionMetric?.value ?? "—",
          detail: retentionMetric?.trendLabel ?? "No donations yet",
        },
        {
          key: "donations-count",
          label: "Total Donations",
          value: String(snapshot?.totalDonationsCount ?? 0),
          detail: donationsMetric?.value ? `Current month: ${donationsMetric.value}` : "No donation activity recorded",
        },
      ]);
      setResidentsOverview(data.residentsOverview ?? []);
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

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell title="Overview" description="Executive operational summary.">
        {loading ? <DashboardSkeleton /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}
        {!loading && !error ? (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <article key={card.key} className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                  <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">{card.label}</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-foreground">{card.value}</p>
                  <p className="mt-1 font-body text-sm text-muted-foreground">{card.detail}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">Residents Requiring Attention</h2>
                {residentsOverview.length === 0 ? (
                  <p className="mt-4 font-body text-sm text-muted-foreground">No high-risk residents 🎉</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {residentsOverview.map((resident, index) => (
                      <li
                        key={`${resident.id}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2"
                      >
                        <p className="font-body text-sm font-medium text-foreground">{resident.id}</p>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              resident.status === "At Risk"
                                ? "rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
                                : "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                            }
                          >
                            {resident.status}
                          </span>
                          <span className="font-body text-xs text-muted-foreground">{resident.lastSession}</span>
                        </div>
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
              </div>
            </section>
          </div>
        ) : null}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default DashboardPage;
