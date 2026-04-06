import { cn } from "@/lib/utils";
import type { AttentionItem, DashboardMetric } from "@/lib/dashboardMockData";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Calendar, Heart, Minus, Percent, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";

const iconMap = {
  users: Users,
  heart: Heart,
  percent: Percent,
  calendar: Calendar,
  home: Sparkles,
};

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const w = 100;
  const h = 32;
  const pad = 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
    const t = max === min ? 0.5 : (v - min) / (max - min);
    const y = pad + (1 - t) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-10 w-full text-[hsl(340_40%_58%)]", className)} aria-hidden>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.2} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={`${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`}
        fill="url(#sparkFill)"
        className="text-[hsl(340_40%_58%)]"
      />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({
  metric,
  index,
  spark,
}: {
  metric: DashboardMetric;
  index: number;
  spark?: number[];
}) {
  const Icon = iconMap[metric.icon] ?? Sparkles;
  const trendUp = metric.trend === "up";
  const trendDown = metric.trend === "down";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.06 * index, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-[1.15rem] border border-white/50 bg-white/55 p-6 shadow-[0_8px_36px_rgba(45,35,48,0.06)] backdrop-blur-md transition-shadow duration-200 hover:shadow-[0_16px_48px_rgba(45,35,48,0.1)]",
        "dark:border-white/10 dark:bg-white/[0.06] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,hsl(340_40%_85%)/0.35_0%,transparent_70%)] blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
            {metric.label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums tracking-tight text-foreground">{metric.value}</p>
          <p
            className={cn(
              "mt-2 inline-flex items-center gap-1 font-body text-xs font-medium",
              trendUp && "text-[hsl(150_28%_32%)] dark:text-[hsl(150_25%_72%)]",
              trendDown && "text-[hsl(0_30%_40%)] dark:text-[hsl(0_25%_72%)]",
              !trendUp && !trendDown && "text-muted-foreground"
            )}
          >
            {trendUp && <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />}
            {trendDown && <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2} />}
            {!trendUp && !trendDown && <Minus className="h-3.5 w-3.5 opacity-50" strokeWidth={2} />}
            {metric.trendLabel}
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 p-2.5 text-[hsl(340_32%_45%)] shadow-sm dark:bg-white/10 dark:text-[hsl(340_35%_78%)]">
          <Icon className="h-5 w-5" strokeWidth={1.35} />
        </div>
      </div>
      {spark && spark.length > 1 && (
        <div className="relative mt-4 opacity-90">
          <Sparkline values={spark} />
        </div>
      )}
    </motion.div>
  );
}

type CommandCenterKpisProps = {
  primary: DashboardMetric;
  supporting: DashboardMetric[];
  reintegration: DashboardMetric;
  activityItems: AttentionItem[];
  /** Last points for donation KPI sparkline (e.g. monthly totals) */
  donationSpark?: number[];
  /** Trend for active residents card (e.g. admissions per month) */
  residentSpark?: number[];
};

export function CommandCenterKpis({
  primary,
  supporting,
  reintegration,
  activityItems,
  donationSpark = [],
  residentSpark = [],
}: CommandCenterKpisProps) {

  const row = [
    primary,
    supporting.find((s) => s.key === "donations")!,
    supporting.find((s) => s.key === "conferences")!,
    reintegration,
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {row.map((m, i) => (
          <KpiCard
            key={m.key}
            metric={m}
            index={i}
            spark={
              m.key === "donations" && donationSpark.length > 1
                ? donationSpark
                : m.key === "residents" && residentSpark.length > 1
                  ? residentSpark
                  : undefined
            }
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[1.15rem] border border-white/50 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05] lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">Recent Activity</h3>
            <span className="rounded-full bg-[hsl(150_22%_94%)] px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-[hsl(150_28%_30%)] dark:bg-[hsl(150_18%_16%)] dark:text-[hsl(150_28%_78%)]">
              Live
            </span>
          </div>
          <ul className="space-y-4">
            {activityItems.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-white/50 hover:bg-white/50 dark:hover:bg-white/[0.06]"
              >
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{item.title}</p>
                  <p className="font-body text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="rounded-[1.15rem] border border-white/50 bg-gradient-to-br from-[hsl(340_32%_97%)] to-white/80 p-6 shadow-sm dark:border-white/10 dark:from-[hsl(340_22%_14%)] dark:to-transparent"
        >
          <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">Quick Actions</h3>
          <p className="mt-1 font-body text-xs text-muted-foreground">Jump to common workflows</p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              to="/dashboard/caseload"
              className="rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-center font-body text-sm font-medium text-foreground shadow-sm transition-all hover:border-[hsl(340_35%_80%)] hover:shadow-md dark:border-white/10 dark:bg-white/10"
            >
              Add Resident
            </Link>
            <Link
              to="/dashboard/donors"
              className="rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-center font-body text-sm font-medium text-foreground shadow-sm transition-all hover:border-[hsl(340_35%_80%)] hover:shadow-md dark:border-white/10 dark:bg-white/10"
            >
              Log Donation
            </Link>
            <Link
              to="/dashboard/recordings"
              className="rounded-xl border border-transparent bg-gradient-to-r from-[hsl(340_44%_62%)] to-[hsl(10_42%_56%)] px-4 py-3 text-center font-body text-sm font-semibold text-white shadow-md transition-transform hover:opacity-95 active:scale-[0.99]"
            >
              New Process Record
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
