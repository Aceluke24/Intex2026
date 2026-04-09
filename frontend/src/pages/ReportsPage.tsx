import { AdminLayout } from "@/components/AdminLayout";
import { DASHBOARD_CONTENT_MAX_WIDTH } from "@/components/dashboard-shell";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { CaseloadMetricCard } from "@/components/caseload/CaseloadMetricCard";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  GraduationCap,
  HeartHandshake,
  LineChart as LineChartIcon,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const softTooltip = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid hsl(36 25% 90%)",
    boxShadow: "0 8px 32px rgba(45,35,48,0.08)",
    fontSize: "12px",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "hsl(213 15% 18%)",
  },
};

type ReportsAnalytics = {
  totalCases: number;
  activeCases: number;
  closedCases: number;
  highRiskCases: number;
  reintegrationRate: number;
  monthlyAdmissions: { month: string; count: number }[];
  monthlyClosures: { month: string; count: number }[];
  donationTrends: { month: string; total: number }[];
  caseTrends: { month: string; active: number; closed: number }[];
  safehouseDistribution: { safehouse: string; count: number }[];
};

const ReportsPage = () => {
  usePageHeader("Reports & Analytics", "Impact & performance");

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metricsData, setMetricsData] = useState<ReportsAnalytics | null>(null);

  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsError, setChartsError] = useState<string | null>(null);
  const [chartsData, setChartsData] = useState<ReportsAnalytics | null>(null);

  const [range, setRange] = useState("1y");

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const data = await apiFetchJson<ReportsAnalytics>(`${API_PREFIX}/reports?range=1y`);
      setMetricsData(data);
    } catch (e) {
      console.error(e);
      setMetricsError(e instanceof Error ? e.message : "Failed to load key metrics.");
      setMetricsData(null);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const loadCharts = useCallback(async () => {
    setChartsLoading(true);
    setChartsError(null);
    try {
      const data = await apiFetchJson<ReportsAnalytics>(`${API_PREFIX}/reports?range=${range}`);
      setChartsData(data);
    } catch (e) {
      console.error(e);
      setChartsError(e instanceof Error ? e.message : "Failed to load charts.");
      setChartsData(null);
    } finally {
      setChartsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    void loadCharts();
  }, [loadCharts]);

  const donationChart = useMemo(() => {
    if (!chartsData?.donationTrends?.length) return [];
    return chartsData.donationTrends.map((d) => ({ month: d.month, amount: d.total }));
  }, [chartsData]);

  const residentOutcomeBars = useMemo(() => {
    if (!chartsData) return [];
    const t = Math.max(chartsData.totalCases, 1);
    const a = Math.max(chartsData.activeCases, 1);
    return [
      { label: "Active share of census", value: Math.min(100, Math.round((chartsData.activeCases / t) * 100)) },
      { label: "Closed cases share", value: Math.min(100, Math.round((chartsData.closedCases / t) * 100)) },
      {
        label: "High risk (of active)",
        value: Math.min(100, Math.round((chartsData.highRiskCases / a) * 100)),
      },
      { label: "Reintegration rate", value: Math.min(100, Math.round(chartsData.reintegrationRate)) },
    ];
  }, [chartsData]);

  const safehouseComparison = useMemo(() => {
    if (!chartsData?.safehouseDistribution?.length) return [];
    const max = Math.max(...chartsData.safehouseDistribution.map((s) => s.count), 1);
    return chartsData.safehouseDistribution.map((s) => ({
      name: s.safehouse,
      score: Math.round((s.count / max) * 100),
    }));
  }, [chartsData]);

  const reintegrationTrend = useMemo(() => {
    if (!chartsData) return [];
    const r = Math.round(chartsData.reintegrationRate);
    return chartsData.caseTrends.slice(-6).map((c) => ({
      quarter: c.month.length > 6 ? c.month.slice(0, 6) : c.month,
      rate: r,
    }));
  }, [chartsData]);

  const donationsForKeyMetrics = metricsData?.donationTrends?.length
    ? metricsData.donationTrends[metricsData.donationTrends.length - 1]?.total ?? 0
    : 0;

  const annualBlocks = useMemo(() => {
    if (!chartsData) {
      return {
        caring: { title: "Caring", subtitle: "Shelter & services", items: [] as { label: string; value: string }[] },
        healing: { title: "Healing", subtitle: "Risk & recovery", items: [] as { label: string; value: string }[] },
        teaching: { title: "Teaching", subtitle: "Movement & resources", items: [] as { label: string; value: string }[] },
      };
    }
    const latestDonations =
      chartsData.donationTrends?.length && chartsData.donationTrends.length > 0
        ? chartsData.donationTrends[chartsData.donationTrends.length - 1]?.total ?? 0
        : 0;
    return {
      caring: {
        title: "Caring",
        subtitle: "Shelter & case census",
        items: [
          { label: "Residents in database", value: chartsData.totalCases.toLocaleString() },
          { label: "Active cases", value: chartsData.activeCases.toLocaleString() },
          { label: "Closed cases", value: chartsData.closedCases.toLocaleString() },
        ],
      },
      healing: {
        title: "Healing",
        subtitle: "Risk & reintegration",
        items: [
          { label: "High-risk (active)", value: chartsData.highRiskCases.toLocaleString() },
          { label: "Reintegration rate", value: `${Math.round(chartsData.reintegrationRate)}%` },
          { label: "Admissions (last month in series)", value: String(chartsData.monthlyAdmissions.at(-1)?.count ?? "—") },
        ],
      },
      teaching: {
        title: "Teaching",
        subtitle: "Resources & movement",
        items: [
          { label: "Donations (latest month in chart)", value: `$${Math.round(latestDonations).toLocaleString()}` },
          { label: "Closures (last month in series)", value: String(chartsData.monthlyClosures.at(-1)?.count ?? "—") },
          { label: "Safehouses with residents", value: String(chartsData.safehouseDistribution.length) },
        ],
      },
    };
  }, [chartsData]);

  const timeframeControl = (
    <div
      role="group"
      aria-label="Chart timeframe"
      className="flex w-full flex-wrap items-stretch justify-start gap-2 sm:items-center"
    >
      <div className="inline-flex w-full min-w-0 flex-1 flex-wrap items-center gap-1 rounded-2xl border border-white/50 bg-white/45 p-1 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08] sm:w-auto sm:flex-initial">
        {(["3m", "6m", "9m", "1y"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "min-h-[44px] flex-1 rounded-xl px-3 py-2 font-body text-xs font-medium transition-all sm:min-h-0 sm:flex-none sm:px-3",
              range === r
                ? "bg-white text-foreground shadow-sm dark:bg-white/15"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        eyebrow="Impact intelligence"
        eyebrowIcon={<BarChart3 className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />}
        title="Reports & Analytics"
        description="Track impact, outcomes, and organizational performance."
      >
        {metricsError && (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            {metricsError}
          </p>
        )}

        {metricsLoading ? (
          <div className="mb-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-[1.1rem] bg-white/45" />
            ))}
          </div>
        ) : metricsData ? (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground/65" strokeWidth={1.5} />
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                Key metrics
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <CaseloadMetricCard label="Total residents served" value={metricsData.totalCases} icon={Users} motionDelay={0} />
              <CaseloadMetricCard
                label="Reintegration success rate"
                value={metricsData.reintegrationRate}
                format={(n) => `${Math.round(n)}%`}
                icon={HeartHandshake}
                motionDelay={0.05}
              />
              <CaseloadMetricCard label="Active cases" value={metricsData.activeCases} icon={Sparkles} motionDelay={0.1} />
              <CaseloadMetricCard
                label="Donations (latest month in chart)"
                value={donationsForKeyMetrics}
                format={(n) => `$${Math.round(n).toLocaleString()}`}
                icon={LineChartIcon}
                motionDelay={0.14}
              />
            </div>
          </section>
        ) : null}

        {!metricsLoading && (
          <div className="mt-8 mb-10 sm:mt-10 sm:mb-12">{timeframeControl}</div>
        )}

        {!metricsLoading && chartsError && (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            {chartsError}
          </p>
        )}

        {!metricsLoading && chartsLoading && !chartsData ? (
          <div className="mb-12 grid gap-8 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="min-h-[320px] rounded-[1.25rem] bg-white/45" />
            ))}
          </div>
        ) : null}

        {!metricsLoading && chartsData && (
          <div
            className={cn("relative", chartsLoading && "pointer-events-none opacity-60")}
            aria-busy={chartsLoading}
          >
            {chartsLoading && (
              <div
                className="absolute inset-0 z-10 flex items-start justify-center pt-16"
                aria-hidden
              >
                <span className="rounded-full border border-white/40 bg-white/70 px-4 py-2 font-body text-xs font-medium text-foreground shadow-sm backdrop-blur-md dark:bg-white/10">
                  Updating charts…
                </span>
              </div>
            )}
            <div className="mb-12 grid gap-8 xl:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="rounded-[1.25rem] border border-white/50 bg-white/50 p-6 shadow-[0_8px_40px_rgba(45,35,48,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
              >
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                  Donation trends
                </p>
                <p className="mt-1 font-body text-sm text-muted-foreground">Monthly revenue trajectory</p>
                <div className="mt-6 h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={donationChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="donationFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(340 45% 68%)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(340 45% 68%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="hsl(36 20% 88% / 0.6)" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "hsl(213 15% 48%)" }}
                        dy={6}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "hsl(213 15% 48%)" }}
                        tickFormatter={(v) => `$${v / 1000}k`}
                      />
                      <Tooltip {...softTooltip} formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(340 42% 58%)"
                        strokeWidth={2.25}
                        fill="url(#donationFill)"
                        dot={{ r: 3, fill: "hsl(340 42% 58%)", strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06 }}
                className="rounded-[1.25rem] border border-white/50 bg-white/50 p-6 shadow-[0_8px_40px_rgba(45,35,48,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
              >
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                  Resident outcomes
                </p>
                <p className="mt-1 font-body text-sm text-muted-foreground">Case mix indicators (0–100)</p>
                <div className="mt-6 h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={residentOutcomeBars} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(340 42% 62%)" />
                          <stop offset="100%" stopColor="hsl(150 28% 48%)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 8" horizontal={false} stroke="hsl(36 20% 88% / 0.5)" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={118}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "hsl(213 15% 45%)" }}
                      />
                      <Tooltip {...softTooltip} formatter={(v: number) => [`${v}%`, "Score"]} />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={18} fill="url(#barGrad)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            <div className="mb-12 grid gap-8 xl:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="rounded-[1.25rem] border border-white/50 bg-white/50 p-6 shadow-[0_8px_40px_rgba(45,35,48,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
              >
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                  Safehouse comparison
                </p>
                <p className="mt-1 font-body text-sm text-muted-foreground">Residents by safehouse (relative)</p>
                <div className="mt-8 space-y-5">
                  {safehouseComparison.map((s, i) => (
                    <div key={s.name}>
                      <div className="mb-1.5 flex justify-between font-body text-xs">
                        <span className="font-medium text-foreground/90">{s.name}</span>
                        <span className="tabular-nums text-muted-foreground">{s.score}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[hsl(210_18%_92%)] dark:bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[hsl(340_40%_62%)] to-[hsl(210_30%_58%)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${s.score}%` }}
                          transition={{ duration: 0.9, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.14 }}
                className="rounded-[1.25rem] border border-white/50 bg-white/50 p-6 shadow-[0_8px_40px_rgba(45,35,48,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
              >
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                  Reintegration success
                </p>
                <p className="mt-1 font-body text-sm text-muted-foreground">Rolling rate (shown across recent months)</p>
                <div className="mt-6 flex items-end gap-3">
                  <div>
                    <p className="font-display text-4xl font-bold tabular-nums tracking-tight text-foreground">
                      {Math.round(chartsData.reintegrationRate)}%
                    </p>
                    <p className="mt-1 font-body text-xs text-muted-foreground">Model summary from resident records</p>
                  </div>
                </div>
                <div className="mt-8 h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reintegrationTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 8" stroke="hsl(36 20% 88% / 0.5)" />
                      <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213 15% 48%)" }} />
                      <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "hsl(213 15% 48%)" }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip {...softTooltip} formatter={(v: number) => [`${v}%`, "Rate"]} />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="hsl(150 28% 42%)"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "hsl(150 28% 42%)", strokeWidth: 2, stroke: "#fff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mb-6"
            >
              <div className="mb-6 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground/70" strokeWidth={1.5} />
                <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                  Annual accomplishment report
                </h2>
              </div>
              <p className="mb-8 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
                Structured summary — caring, healing, and teaching dimensions — populated from live database aggregates.
              </p>
              <div className="grid gap-6 lg:grid-cols-3">
                {([annualBlocks.caring, annualBlocks.healing, annualBlocks.teaching] as const).map((block, i) => (
                  <motion.div
                    key={block.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                    whileHover={{ y: -3 }}
                    className="rounded-[1.15rem] border border-white/50 bg-gradient-to-b from-white/65 to-[hsl(36_32%_98%)]/90 p-6 shadow-[0_8px_36px_rgba(45,35,48,0.06)] backdrop-blur-md dark:border-white/10 dark:from-white/[0.08] dark:to-white/[0.04]"
                  >
                    <h3 className="font-display text-lg font-semibold text-foreground">{block.title}</h3>
                    <p className="mt-1 font-body text-xs text-muted-foreground">{block.subtitle}</p>
                    <ul className="mt-6 space-y-4">
                      {block.items.map((item) => (
                        <li
                          key={item.label}
                          className="flex items-baseline justify-between gap-3 border-b border-white/40 pb-3 last:border-0 dark:border-white/10"
                        >
                          <span className="font-body text-sm text-foreground/85">{item.label}</span>
                          <span className="font-display text-lg font-semibold tabular-nums text-foreground">{item.value}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>
        )}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default ReportsPage;
