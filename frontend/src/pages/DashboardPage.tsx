import { AdminLayout } from "@/components/AdminLayout";
import { PriorityCallouts, ResidentsList } from "@/components/dashboard";
import { DASHBOARD_CONTENT_MAX_WIDTH } from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import type {
  DashboardMetric,
  PriorityCallout,
  ResidentRow,
} from "@/lib/dashboardTypes";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";

const ease = [0.22, 1, 0.36, 1] as const;

type DashboardApiResponse = {
  primaryMetric: DashboardMetric;
  supportingMetrics: DashboardMetric[];
  priorityCallouts: PriorityCallout[];
  snapshotMetrics: {
    activeResidents: number;
    highCriticalRiskCount: number;
    upcomingVisits7Days: number;
    monthlyDonations: string;
    repeatDonorRate: number | null;
    totalDonationsCount: number;
  };
  residentsOverview: ResidentRow[];
  insights: string[];
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [primaryMetric, setPrimaryMetric] = useState<DashboardMetric | null>(null);
  const [supportingMetrics, setSupportingMetrics] = useState<DashboardMetric[]>([]);
  const [priorityCallouts, setPriorityCallouts] = useState<PriorityCallout[]>([]);
  const [snapshotMetrics, setSnapshotMetrics] = useState<DashboardApiResponse["snapshotMetrics"] | null>(null);
  const [residentsOverview, setResidentsOverview] = useState<ResidentRow[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetchJson<DashboardApiResponse>(`${API_PREFIX}/dashboard`);
      setPrimaryMetric(data.primaryMetric);
      setSupportingMetrics(data.supportingMetrics);
      setPriorityCallouts(data.priorityCallouts);
      setSnapshotMetrics(data.snapshotMetrics);
      setResidentsOverview(
        (data.residentsOverview ?? []).map((r) => ({
          id: r.id,
          safehouse: r.safehouse,
          status: r.status as ResidentRow["status"],
          lastSession: r.lastSession,
        }))
      );
      setInsights(data.insights);
    } catch (e) {
      console.error("[Dashboard]", e);
      setLoadError(e instanceof Error ? e.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const donationMetric = supportingMetrics.find((s) => s.key === "donations");
  const visitMetric = supportingMetrics.find((s) => s.key === "conferences");
  const retentionMetric = supportingMetrics.find((s) => s.key === "retention");

  const attentionRows = (() => {
    const urgent = residentsOverview.filter((r) => r.status === "At Risk");
    const recentNonStable = residentsOverview.filter((r) => r.status !== "Stable" && r.status !== "At Risk");
    return [...urgent, ...recentNonStable].slice(0, 7);
  })();

  const quickInsights = snapshotMetrics
    ? [
        `${snapshotMetrics.highCriticalRiskCount} residents currently High/Critical risk`,
        `${snapshotMetrics.monthlyDonations} donated this month across ${snapshotMetrics.totalDonationsCount} total gifts`,
        snapshotMetrics.repeatDonorRate !== null
          ? `${snapshotMetrics.repeatDonorRate.toFixed(1)}% repeat donor rate (strong retention)`
          : "Repeat donor rate will populate as donation history grows",
      ]
    : insights;

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        title="Command Center"
        description="High-level operations snapshot."
      >
        {loadError ? (
          <p
            className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive"
            role="alert"
          >
            Could not load live data: {loadError}. Check that the API is running and you are signed in as an admin.
          </p>
        ) : null}

        {loading || !primaryMetric || !snapshotMetrics ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-[1.1rem] border border-white/50 bg-white/40 px-6 py-16 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05]">
            <p className="font-display text-lg font-semibold text-foreground">Loading dashboard…</p>
            <p className="font-body text-sm text-muted-foreground">Fetching command center data.</p>
          </div>
        ) : (
          <>
            <section className="mb-8 lg:mb-10" aria-labelledby="priority-heading">
              <h2
                id="priority-heading"
                className="mb-4 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl"
              >
                Priority Alerts
              </h2>
              <PriorityCallouts items={priorityCallouts} />
            </section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease }}
              className="mb-8 lg:mb-10"
              aria-labelledby="metrics-heading"
            >
              <h2
                id="metrics-heading"
                className="mb-4 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl"
              >
                Key Metrics
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    label: "Active Residents",
                    value: String(snapshotMetrics.activeResidents),
                    trend: primaryMetric.trendLabel,
                  },
                  {
                    label: "High / Critical Risk",
                    value: String(snapshotMetrics.highCriticalRiskCount),
                    trend: snapshotMetrics.highCriticalRiskCount > 0 ? "Needs review" : "No urgent risk",
                  },
                  {
                    label: "Upcoming Home Visits (7 days)",
                    value: String(snapshotMetrics.upcomingVisits7Days),
                    trend: visitMetric?.trendLabel ?? "",
                  },
                  {
                    label: "Monthly Donations",
                    value: snapshotMetrics.monthlyDonations,
                    trend: donationMetric?.trendLabel ?? "",
                  },
                  {
                    label: "Repeat Donor Rate",
                    value:
                      snapshotMetrics.repeatDonorRate !== null ? `${snapshotMetrics.repeatDonorRate.toFixed(1)}%` : "—",
                    trend: retentionMetric?.trendLabel ?? "",
                  },
                  {
                    label: "Total Donations",
                    value: String(snapshotMetrics.totalDonationsCount),
                    trend: "",
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/50 bg-white/55 px-4 py-4 shadow-[0_6px_24px_rgba(45,35,48,0.06)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]"
                  >
                    <p className="font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground">{metric.value}</p>
                    <p className="mt-1 font-body text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {metric.label}
                    </p>
                    {metric.trend ? <p className="mt-2 font-body text-xs text-muted-foreground">{metric.trend}</p> : null}
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease }}
              className="mb-4"
              aria-labelledby="snapshot-heading"
            >
              <h2
                id="snapshot-heading"
                className="mb-4 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl"
              >
                Operational Snapshot
              </h2>
              <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
                <div className="rounded-2xl border border-white/50 bg-white/45 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]">
                  <h3 className="mb-3 font-display text-lg font-semibold tracking-tight text-foreground">
                    Residents Requiring Attention
                  </h3>
                  <ResidentsList rows={attentionRows} />
                  {!loadError && attentionRows.length === 0 && (
                    <p className="mt-4 font-body text-sm text-muted-foreground">No high-risk or recently updated residents.</p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/45 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]">
                  <h3 className="mb-3 font-display text-lg font-semibold tracking-tight text-foreground">Quick Insights</h3>
                  <ul className="space-y-3">
                    {quickInsights.slice(0, 3).map((line, i) => (
                      <li key={i} className="font-body text-sm leading-relaxed text-foreground/85">
                        - {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.section>
          </>
        )}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default DashboardPage;
