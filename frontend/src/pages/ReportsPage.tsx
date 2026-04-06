import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { CaseloadMetricCard } from "@/components/caseload/CaseloadMetricCard";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { delay } from "@/lib/mockData";
import {
  annualAccomplishment,
  donationTrends,
  reportsOverview,
  residentOutcomeBars,
  reintegrationTrend,
  safehouseComparison,
} from "@/lib/reportsAnalyticsMockData";
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
  Download,
  GraduationCap,
  HeartHandshake,
  LineChart as LineChartIcon,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const softTooltip = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid hsl(36 25% 90%)",
    boxShadow: "0 8px 32px rgba(45,35,48,0.08)",
    fontSize: "12px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

const ReportsPage = () => {
  usePageHeader("Reports & Analytics", "Impact & performance");

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("9m");

  useEffect(() => {
    delay(780).then(() => setLoading(false));
  }, []);

  return (
    <AdminLayout contentClassName="max-w-[min(100%,90rem)]">
      <StaffPageShell
        eyebrow="Impact intelligence"
        eyebrowIcon={<BarChart3 className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />}
        title="Reports & Analytics"
        description="Track impact, outcomes, and organizational performance."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-2xl border border-white/50 bg-white/45 p-1 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08]">
              {(["3m", "6m", "9m", "1y"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-xl px-3 py-2 font-body text-xs font-medium transition-all",
                    range === r
                      ? "bg-white text-foreground shadow-sm dark:bg-white/15"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => toast.success("PDF queued", { description: "You will receive a download link (demo)." })}
                className="h-11 rounded-2xl border border-white/50 bg-white/50 px-5 font-body font-medium backdrop-blur-md dark:border-white/10 dark:bg-white/[0.07]"
              >
                <Download className="mr-2 h-4 w-4 opacity-70" strokeWidth={1.5} />
                Export PDF
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => toast.success("CSV queued", { description: "Tabular export preparing (demo)." })}
                className="h-11 rounded-2xl border border-white/50 bg-white/50 px-5 font-body font-medium backdrop-blur-md dark:border-white/10 dark:bg-white/[0.07]"
              >
                <Download className="mr-2 h-4 w-4 opacity-70" strokeWidth={1.5} />
                Export CSV
              </Button>
            </motion.div>
          </div>
        }
      >
        {loading ? (
          <div className="mb-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-[1.1rem] bg-white/45" />
            ))}
          </div>
        ) : (
          <section className="mb-14 xl:mb-18">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground/65" strokeWidth={1.5} />
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                Key metrics
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <CaseloadMetricCard
                label="Total residents served"
                value={reportsOverview.totalResidentsServed}
                icon={Users}
                motionDelay={0}
              />
              <CaseloadMetricCard
                label="Reintegration success rate"
                value={reportsOverview.reintegrationSuccessRate}
                format={(n) => `${Math.round(n)}%`}
                icon={HeartHandshake}
                motionDelay={0.05}
              />
              <CaseloadMetricCard
                label="Active cases"
                value={reportsOverview.activeCases}
                icon={Sparkles}
                motionDelay={0.1}
              />
              <CaseloadMetricCard
                label="Donations this month"
                value={reportsOverview.donationsThisMonth}
                format={(n) => `$${Math.round(n).toLocaleString()}`}
                icon={LineChartIcon}
                motionDelay={0.14}
              />
            </div>
          </section>
        )}

        {!loading && (
          <>
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
                    <AreaChart data={donationTrends} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                      <Tooltip
                        {...softTooltip}
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]}
                      />
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
                <p className="mt-1 font-body text-sm text-muted-foreground">Program progress indicators</p>
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
                <p className="mt-1 font-body text-sm text-muted-foreground">Relative performance index</p>
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
                <p className="mt-1 font-body text-sm text-muted-foreground">Quarterly trend</p>
                <div className="mt-6 flex items-end gap-3">
                  <div>
                    <p className="font-display text-4xl font-bold tabular-nums tracking-tight text-foreground">
                      {reportsOverview.reintegrationSuccessRate}%
                    </p>
                    <p className="mt-1 font-body text-xs text-muted-foreground">Current rolling average</p>
                  </div>
                </div>
                <div className="mt-8 h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reintegrationTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 8" stroke="hsl(36 20% 88% / 0.5)" />
                      <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213 15% 48%)" }} />
                      <YAxis domain={[75, 90]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(213 15% 48%)" }} tickFormatter={(v) => `${v}%`} />
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
                Structured summary inspired by Philippine social welfare reporting — caring, healing, and teaching dimensions.
              </p>
              <div className="grid gap-6 lg:grid-cols-3">
                {([annualAccomplishment.caring, annualAccomplishment.healing, annualAccomplishment.teaching] as const).map(
                  (block, i) => (
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
                          <li key={item.label} className="flex items-baseline justify-between gap-3 border-b border-white/40 pb-3 last:border-0 dark:border-white/10">
                            <span className="font-body text-sm text-foreground/85">{item.label}</span>
                            <span className="font-display text-lg font-semibold tabular-nums text-foreground">{item.value}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )
                )}
              </div>
            </motion.section>
          </>
        )}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default ReportsPage;
