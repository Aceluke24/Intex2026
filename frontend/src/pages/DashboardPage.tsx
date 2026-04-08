import { AdminLayout } from "@/components/AdminLayout";
import { CommandCenterKpis, PriorityCallouts, ResidentsList, DonationChart } from "@/components/dashboard";
import type {
  AttentionItem,
  DashboardMetric,
  DonationMonth,
  PriorityCallout,
  ResidentRow,
} from "@/lib/dashboardTypes";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";

const ease = [0.22, 1, 0.36, 1] as const;

type DashboardApiResponse = {
  primaryMetric: DashboardMetric;
  supportingMetrics: DashboardMetric[];
  reintegrationMetric: DashboardMetric;
  donationSpark: number[];
  residentSpark: number[];
  activityItems: AttentionItem[];
  priorityCallouts: PriorityCallout[];
  liveContext: {
    residentCount: number;
    safehouseCount: number;
    donationMonthLabel: string;
    donationTrendPhrase: string;
    retentionLabel: string;
  };
  donationActivity: DonationMonth[];
  donationInsight: string;
  residentsOverview: ResidentRow[];
  insights: string[];
};

const DashboardPage = () => {
  usePageHeader("Command Center", "Live operations overview");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [primaryMetric, setPrimaryMetric] = useState<DashboardMetric | null>(null);
  const [supportingMetrics, setSupportingMetrics] = useState<DashboardMetric[]>([]);
  const [reintegrationMetric, setReintegrationMetric] = useState<DashboardMetric | null>(null);
  const [donationSpark, setDonationSpark] = useState<number[]>([]);
  const [residentSpark, setResidentSpark] = useState<number[]>([]);
  const [activityItems, setActivityItems] = useState<AttentionItem[]>([]);
  const [priorityCallouts, setPriorityCallouts] = useState<PriorityCallout[]>([]);
  const [liveContext, setLiveContext] = useState<DashboardApiResponse["liveContext"] | null>(null);
  const [donationActivity, setDonationActivity] = useState<DonationMonth[]>([]);
  const [donationInsight, setDonationInsight] = useState("");
  const [residentsOverview, setResidentsOverview] = useState<ResidentRow[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetchJson<DashboardApiResponse>(`${API_PREFIX}/dashboard`);
      setPrimaryMetric(data.primaryMetric);
      setSupportingMetrics(data.supportingMetrics);
      setReintegrationMetric(data.reintegrationMetric);
      setDonationSpark(data.donationSpark);
      setResidentSpark(data.residentSpark);
      setActivityItems(data.activityItems);
      setPriorityCallouts(data.priorityCallouts);
      setLiveContext(data.liveContext);
      setDonationActivity(data.donationActivity);
      setDonationInsight(data.donationInsight);
      setResidentsOverview(
        data.residentsOverview.map((r) => ({
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

  const supportingForKpis = supportingMetrics.filter((s) => s.key !== "retention");

  return (
    <AdminLayout contentClassName="max-w-[1200px]">
      <div className="relative pb-24">
        <div
          className="pointer-events-none fixed inset-0 -z-10 opacity-95"
          style={{
            background:
              "radial-gradient(ellipse 110% 70% at 0% 0%, hsl(350 36% 96% / 0.85) 0%, transparent 48%), radial-gradient(ellipse 90% 55% at 100% 15%, hsl(36 38% 98% / 0.95) 0%, transparent 44%), hsl(36 32% 99%)",
          }}
        />

        {loadError && (
          <div
            className="mb-8 rounded-xl border border-[hsl(0,30%,88%)] bg-[hsl(0,40%,97%)] px-4 py-3 font-body text-sm text-[hsl(0,35%,28%)]"
            role="alert"
          >
            Could not load live data: {loadError}. Check that the API is running and you are signed in as an admin.
          </div>
        )}

        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-14 max-w-2xl lg:mb-16"
        >
          <p className="font-body text-sm font-medium text-[hsl(340,24%,42%)]">North Star Sanctuary</p>
          <h1 className="mt-2 font-display text-[clamp(1.95rem,4vw,2.5rem)] font-bold tracking-tight text-foreground">
            Command Center
          </h1>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-muted-foreground">
            What needs attention today — data from your connected systems.
          </p>
        </motion.header>

        {loading || !primaryMetric || !reintegrationMetric || !liveContext ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/40 px-6 py-16">
            <p className="font-display text-lg font-semibold text-foreground">Loading dashboard…</p>
            <p className="font-body text-sm text-muted-foreground">Fetching command center data.</p>
          </div>
        ) : (
          <>
            <section className="mb-16 lg:mb-20" aria-labelledby="kpi-heading">
              <h2 id="kpi-heading" className="mb-8 font-display text-xl font-semibold tracking-tight text-foreground">
                Operations At A Glance
              </h2>
              <CommandCenterKpis
                primary={primaryMetric}
                supporting={supportingForKpis}
                reintegration={reintegrationMetric}
                activityItems={activityItems}
                donationSpark={donationSpark}
                residentSpark={residentSpark}
              />
            </section>

            <section className="mb-20 lg:mb-24" aria-labelledby="priority-heading">
              <h2 id="priority-heading" className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground">
                Priority Intelligence
              </h2>
              <p className="mb-8 font-body text-sm text-muted-foreground">Signals that may need a response this week</p>
              <PriorityCallouts items={priorityCallouts} />
            </section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease }}
              className="mb-20 space-y-8 lg:mb-24"
              aria-labelledby="context-heading"
            >
              <h2 id="context-heading" className="font-display text-xl font-semibold tracking-tight text-foreground">
                Live Context
              </h2>
              <div className="max-w-3xl space-y-6 font-body text-[17px] leading-[1.65] text-foreground/88 sm:text-lg">
                <p>
                  Currently supporting{" "}
                  <strong className="font-semibold text-foreground tabular-nums">{liveContext.residentCount}</strong>{" "}
                  active residents across{" "}
                  <strong className="font-semibold text-foreground tabular-nums">{liveContext.safehouseCount}</strong>{" "}
                  safehouses.
                </p>
                <p>
                  <strong className="font-semibold tabular-nums text-foreground">{liveContext.donationMonthLabel}</strong>{" "}
                  in donations this month, {liveContext.donationTrendPhrase}. Repeat gift rate (supporters with 2+ gifts) is{" "}
                  <strong className="font-semibold tabular-nums text-foreground">{liveContext.retentionLabel}</strong>.
                </p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease }}
              className="mb-20 lg:mb-24"
              aria-labelledby="donations-heading"
            >
              <h2 id="donations-heading" className="mb-8 font-display text-xl font-semibold tracking-tight text-foreground">
                Donation Trends
              </h2>
              <DonationChart
                data={
                  donationActivity.length
                    ? donationActivity
                    : [{ month: "—", total: 0, newDonors: 0, returningDonors: 0 }]
                }
                insight={donationInsight}
              />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease }}
              className="mb-20 lg:mb-24"
              aria-labelledby="residents-heading"
            >
              <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h2 id="residents-heading" className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    Resident Overview
                  </h2>
                  <p className="mt-2 font-body text-sm text-muted-foreground">Status and last touchpoint</p>
                </div>
                <p className="font-body text-xs text-muted-foreground">IDs are anonymized.</p>
              </div>
              <ResidentsList rows={residentsOverview} />
              {!loadError && residentsOverview.length === 0 && (
                <p className="mt-4 font-body text-sm text-muted-foreground">
                  No active residents in census. Add cases or check caseload.
                </p>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease }}
              className="border-t border-[hsl(350,16%,92%)]/80 pt-16"
              aria-labelledby="insights-heading"
            >
              <h2 id="insights-heading" className="font-display text-xl font-semibold tracking-tight text-foreground">
                Insights
              </h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">Light signals from your data</p>
              <ul className="mt-10 max-w-2xl space-y-6 border-l-2 border-[hsl(340,22%,88%)] pl-8">
                {insights.map((line, i) => (
                  <li key={i} className="font-body text-[15px] leading-relaxed text-foreground/85">
                    {line}
                  </li>
                ))}
              </ul>
            </motion.section>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
