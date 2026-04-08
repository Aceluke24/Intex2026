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
import type {
  DonorAnalyticsResponse,
  ResidentAnalyticsResponse,
  SocialAnalyticsResponse,
} from "@/lib/analyticsTypes";

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
  const [donorAnalytics, setDonorAnalytics] = useState<DonorAnalyticsResponse | null>(null);
  const [residentAnalytics, setResidentAnalytics] = useState<ResidentAnalyticsResponse | null>(null);
  const [socialAnalytics, setSocialAnalytics] = useState<SocialAnalyticsResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetchJson<DashboardApiResponse>(`${API_PREFIX}/dashboard`);
      const [donorsRes, residentsRes, socialRes] = await Promise.allSettled([
        apiFetchJson<DonorAnalyticsResponse>(`${API_PREFIX}/analytics/donors`),
        apiFetchJson<ResidentAnalyticsResponse>(`${API_PREFIX}/analytics/residents`),
        apiFetchJson<SocialAnalyticsResponse>(`${API_PREFIX}/analytics/social`),
      ]);
      const donors =
        donorsRes.status === "fulfilled"
          ? donorsRes.value
          : ({
              donors: [],
              retentionTrend: [],
              donationFrequency: [],
              impactSummary: "No analytics yet. Donor pipeline data is unavailable.",
            } satisfies DonorAnalyticsResponse);
      const residents =
        residentsRes.status === "fulfilled"
          ? residentsRes.value
          : ({
              residents: [],
              alerts: [],
              timeline: [],
              caseLifecycle: {
                activeIntake: 0,
                processRecordings: 0,
                homeVisits: 0,
                reintegrationCompleted: 0,
              },
            } satisfies ResidentAnalyticsResponse);
      const social =
        socialRes.status === "fulfilled"
          ? socialRes.value
          : ({
              bestPostingTimes: [],
              bestContentTypes: [],
              platformPerformance: [],
              suggestedNextPosts: ["No analytics yet. Social pipeline data is unavailable."],
              engagementDonationCorrelation: 0,
            } satisfies SocialAnalyticsResponse);
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
      setDonorAnalytics(donors);
      setResidentAnalytics(residents);
      setSocialAnalytics(social);
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-14 max-w-2xl lg:mb-16"
        >
          <p className="font-body text-[15px] leading-relaxed text-muted-foreground">
            What needs attention today — data from your connected systems.
          </p>
        </motion.div>

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
              className="mb-20 lg:mb-24"
              aria-labelledby="donor-insights-heading"
            >
              <h2 id="donor-insights-heading" className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground">
                Donor Insights Panel
              </h2>
              <p className="mb-8 font-body text-sm text-muted-foreground">
                Risk, value, and action suggestions operationalized from pipeline features.
              </p>
              <div className="rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/80 p-5">
                <p className="mb-4 font-body text-sm text-muted-foreground">{donorAnalytics?.impactSummary ?? "Loading donor impact linkage..."}</p>
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  {(donorAnalytics?.retentionTrend ?? []).slice(-3).map((r) => (
                    <div key={r.month} className="rounded-lg border border-[hsl(350,16%,92%)]/80 bg-[hsl(36,36%,98%)] p-3">
                      <p className="font-body text-xs text-muted-foreground">{r.month} retention</p>
                      <p className="font-display text-lg font-semibold text-foreground">{r.retentionRate.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead>
                      <tr className="border-b border-[hsl(350,16%,92%)]/90 font-body text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-2 py-2">Donor</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Risk</th>
                        <th className="px-2 py-2">LTV</th>
                        <th className="px-2 py-2">Days Since Gift</th>
                        <th className="px-2 py-2">Suggested Outreach</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(donorAnalytics?.donors ?? []).slice(0, 8).map((d) => (
                        <tr key={d.supporterId} className="border-b border-[hsl(350,16%,94%)]/80 font-body text-sm text-foreground/90">
                          <td className="px-2 py-2">{d.displayName}</td>
                          <td className="px-2 py-2">{d.status}</td>
                          <td className="px-2 py-2">{(d.riskScore * 100).toFixed(0)}%</td>
                          <td className="px-2 py-2">${d.ltvEstimate.toLocaleString()}</td>
                          <td className="px-2 py-2">{d.daysSinceLastDonation}</td>
                          <td className="px-2 py-2">{d.suggestedAction}</td>
                        </tr>
                      ))}
                      {!(donorAnalytics?.donors?.length ?? 0) && (
                        <tr>
                          <td className="px-2 py-3 text-sm text-muted-foreground" colSpan={6}>
                            No analytics yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease }}
              className="mb-20 lg:mb-24"
              aria-labelledby="resident-insights-heading"
            >
              <h2 id="resident-insights-heading" className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground">
                Resident Risk &amp; Progress Panel
              </h2>
              <p className="mb-8 font-body text-sm text-muted-foreground">
                Case lifecycle, alerts, and intervention timeline for case management.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/80 p-5">
                  <h3 className="mb-3 font-display text-lg font-semibold text-foreground">At-Risk Alerts</h3>
                  <ul className="space-y-2 font-body text-sm text-foreground/90">
                    {(residentAnalytics?.alerts ?? []).slice(0, 6).map((a) => (
                      <li key={a.residentId} className="rounded-md bg-[hsl(0,50%,97%)] px-3 py-2">
                        {a.caseCode} - {a.status} ({a.progressScore.toFixed(1)}), unresolved incidents: {a.unresolvedIncidents}
                      </li>
                    ))}
                  {!(residentAnalytics?.alerts?.length ?? 0) && <li className="text-muted-foreground">No analytics yet.</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/80 p-5">
                  <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Case Lifecycle</h3>
                  <div className="space-y-2 font-body text-sm text-foreground/90">
                    <p>Intake: {residentAnalytics?.caseLifecycle.activeIntake ?? 0}</p>
                    <p>Services (process recordings): {residentAnalytics?.caseLifecycle.processRecordings ?? 0}</p>
                    <p>Home visits: {residentAnalytics?.caseLifecycle.homeVisits ?? 0}</p>
                    <p>Outcome (reintegration completed): {residentAnalytics?.caseLifecycle.reintegrationCompleted ?? 0}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/80 p-5">
                <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Recent Interventions Timeline</h3>
                <ul className="space-y-2 font-body text-sm text-foreground/90">
                  {(residentAnalytics?.timeline ?? []).slice(0, 8).map((t, idx) => (
                    <li key={`${t.residentId}-${idx}`} className="rounded-md bg-[hsl(36,36%,98%)] px-3 py-2">
                      {t.dateLabel} - {t.caseCode} - {t.eventType}: {t.summary}
                    </li>
                  ))}
                  {!(residentAnalytics?.timeline?.length ?? 0) && <li className="text-muted-foreground">No analytics yet.</li>}
                </ul>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease }}
              className="mb-20 lg:mb-24"
              aria-labelledby="social-insights-heading"
            >
              <h2 id="social-insights-heading" className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground">
                Social Media Insights Panel
              </h2>
              <p className="mb-8 font-body text-sm text-muted-foreground">
                What is working, when to post, and donation impact by platform.
              </p>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/80 p-5">
                  <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Best Posting Times</h3>
                  <ul className="space-y-2 font-body text-sm text-foreground/90">
                    {(socialAnalytics?.bestPostingTimes ?? []).slice(0, 4).map((w, idx) => (
                      <li key={`${w.dayOfWeek}-${w.hour}-${idx}`}>
                        {w.dayOfWeek} {String(w.hour).padStart(2, "0")}:00 - score {w.engagementScore.toFixed(1)}
                      </li>
                    ))}
                    {!(socialAnalytics?.bestPostingTimes?.length ?? 0) && <li className="text-muted-foreground">No analytics yet.</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/80 p-5">
                  <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Best Content Types</h3>
                  <ul className="space-y-2 font-body text-sm text-foreground/90">
                    {(socialAnalytics?.bestContentTypes ?? []).slice(0, 4).map((c) => (
                      <li key={c.postType}>
                        {c.postType}: {c.avgEngagementScore.toFixed(1)} avg engagement
                      </li>
                    ))}
                    {!(socialAnalytics?.bestContentTypes?.length ?? 0) && <li className="text-muted-foreground">No analytics yet.</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/80 p-5">
                  <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Platform Comparison</h3>
                  <ul className="space-y-2 font-body text-sm text-foreground/90">
                    {(socialAnalytics?.platformPerformance ?? []).slice(0, 4).map((p) => (
                      <li key={p.platform}>
                        {p.platform}: ${p.estimatedDonationValue.toLocaleString()} est. donation value
                      </li>
                    ))}
                    {!(socialAnalytics?.platformPerformance?.length ?? 0) && <li className="text-muted-foreground">No analytics yet.</li>}
                  </ul>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/80 p-5">
                <p className="font-body text-sm text-muted-foreground">
                  Engagement-to-donation correlation: {socialAnalytics?.engagementDonationCorrelation?.toFixed(3) ?? "0.000"}
                </p>
                <h3 className="mb-2 mt-3 font-display text-lg font-semibold text-foreground">Suggested Next Posts</h3>
                <ul className="space-y-2 font-body text-sm text-foreground/90">
                  {(socialAnalytics?.suggestedNextPosts ?? []).map((s, i) => (
                    <li key={i} className="rounded-md bg-[hsl(36,36%,98%)] px-3 py-2">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.section>

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
