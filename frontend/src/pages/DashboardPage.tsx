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
import { API_PREFIX, apiUrl } from "@/lib/apiBase";

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
  stats?: {
    totalResidents: number;
    activeCases: number;
    highRiskCases: number;
    totalDonationsThisMonth: number;
    activeSafehouses: number;
    avgHealthScore: number | null;
    avgEducationProgress: number | null;
    recentIncidents: number;
  };
  isAuthenticated?: boolean;
};

const fallbackSnapshot: DashboardApiResponse["snapshotMetrics"] = {
  activeResidents: 0,
  highCriticalRiskCount: 0,
  upcomingVisits7Days: 0,
  monthlyDonations: "$0",
  repeatDonorRate: null,
  totalDonationsCount: 0,
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
    const endpoint = `${API_PREFIX}/dashboard`;
    try {
      console.info("[Dashboard] requesting data from", apiUrl(endpoint));
      const data = await apiFetchJson<DashboardApiResponse>(endpoint, { timeoutMs: 15000 });
      console.info("[Dashboard] data received");
      const hasFullPayload = Boolean(data.primaryMetric && data.snapshotMetrics);
      setPrimaryMetric(
        data.primaryMetric ?? {
          key: "residents",
          label: "Active cases",
          value: String(data.stats?.activeCases ?? 0),
          trendLabel: data.isAuthenticated === false ? "Limited public dashboard view" : "Current active census",
          trend: "neutral",
          icon: "users",
        }
      );
      setSupportingMetrics(data.supportingMetrics ?? []);
      setPriorityCallouts(data.priorityCallouts ?? []);
      setSnapshotMetrics(
        data.snapshotMetrics ?? {
          activeResidents: data.stats?.activeCases ?? 0,
          highCriticalRiskCount: data.stats?.highRiskCases ?? 0,
          upcomingVisits7Days: 0,
          monthlyDonations: `$${Math.round(data.stats?.totalDonationsThisMonth ?? 0)}`,
          repeatDonorRate: null,
          totalDonationsCount: 0,
        }
      );
      setResidentsOverview(
        (data.residentsOverview ?? []).map((r) => ({
          id: r.id,
          safehouse: r.safehouse,
          status: r.status as ResidentRow["status"],
          lastSession: r.lastSession,
        }))
      );
      setInsights(
        data.insights ?? [
          `${data.stats?.activeCases ?? 0} active cases`,
          `${data.stats?.highRiskCases ?? 0} high-risk cases`,
          `${data.stats?.activeSafehouses ?? 0} active safehouses`,
        ]
      );
      if (!hasFullPayload && data.isAuthenticated === false) {
        setLoadError("Unable to load live data. Showing last known snapshot.");
      }
    } catch (e) {
      console.error("[Dashboard]", e);
      setLoadError("Unable to load live data. Showing last known snapshot.");
      setSnapshotMetrics((existing) => existing ?? fallbackSnapshot);
      setPrimaryMetric((existing) =>
        existing ?? {
          key: "residents",
          label: "Active residents",
          value: "0",
          trendLabel: "Live data currently unavailable",
          trend: "neutral",
          icon: "users",
        }
      );
      setSupportingMetrics((existing) => existing ?? []);
      setPriorityCallouts((existing) => existing ?? []);
      setResidentsOverview((existing) => existing ?? []);
      setInsights((existing) =>
        existing.length > 0
          ? existing
          : ["Unable to load live data. Showing last known snapshot."]
      );
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

  const hasAnyDashboardData =
    supportingMetrics.length > 0 || priorityCallouts.length > 0 || residentsOverview.length > 0 || quickInsights.length > 0;

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        title="Command Center"
        description="High-level operations snapshot."
      >
        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-[1.1rem] border border-white/50 bg-white/40 px-6 py-16 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05]">
            <p className="font-display text-lg font-semibold text-foreground">Loading dashboard…</p>
            <p className="font-body text-sm text-muted-foreground">Fetching command center data.</p>
          </div>
        ) : (
          <>
            {loadError ? (
              <div
                className="mb-6 rounded-[1.1rem] border border-amber-400/30 bg-amber-500/5 px-6 py-4 text-center"
                role="status"
              >
                <p className="font-display text-base font-semibold text-foreground">
                  Unable to load live data. Showing last known snapshot.
                </p>
              </div>
            ) : null}
            {!primaryMetric || !snapshotMetrics ? (
              <div className="flex min-h-[32vh] flex-col items-center justify-center gap-3 rounded-[1.1rem] border border-amber-400/40 bg-amber-500/5 px-6 py-10 text-center">
                <p className="font-display text-lg font-semibold text-foreground">Dashboard data is unavailable</p>
                <p className="max-w-2xl font-body text-sm text-muted-foreground">
                  The API responded, but required fields were missing. Please verify the `GET /api/dashboard` payload.
                </p>
              </div>
            ) : !hasAnyDashboardData ? (
              <div className="flex min-h-[32vh] flex-col items-center justify-center gap-3 rounded-[1.1rem] border border-white/50 bg-white/40 px-6 py-10 text-center backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05]">
                <p className="font-display text-lg font-semibold text-foreground">No dashboard data yet</p>
                <p className="max-w-2xl font-body text-sm text-muted-foreground">
                  Data will appear here once residents, visits, donations, or activity records are available.
                </p>
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
          </>
        )}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default DashboardPage;
