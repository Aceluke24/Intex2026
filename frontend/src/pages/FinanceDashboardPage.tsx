import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  DollarSign,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const softTooltip = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid hsl(36 25% 90%)",
    boxShadow: "0 8px 32px rgba(45,35,48,0.08)",
    fontSize: "12px",
  },
};

const PIE_COLORS = ["#c8877a", "#d4a5a0", "#a09090", "#8b6f6f", "#6b4f4f", "#e8c4b8"];

type Kpis = {
  monetaryThisMonth: number;
  inKindThisMonth: number;
  expensesThisMonth: number;
  netThisMonth: number;
  activeDonorCount: number;
};

type IncomeVsSpending = { label: string; income: number; spending: number };
type ProgramAreaRow = { programArea: string; total: number };
type CategoryRow = { category: string; total: number };
type TopDonor = {
  supporterId: number;
  displayName: string;
  supporterType: string | null;
  status: string | null;
  totalMonetary: number;
  lastDonation: string;
};
type GoalInfo = {
  goalId: number;
  description: string | null;
  targetValue: number;
  currentValue: number;
  periodStart: string;
  periodEnd: string;
} | null;

type FinanceData = {
  kpis: Kpis;
  incomeVsSpending: IncomeVsSpending[];
  byProgramArea: ProgramAreaRow[];
  byCategory: CategoryRow[];
  topDonors: TopDonor[];
  donationGoal: GoalInfo;
  expenseGoal: GoalInfo;
  spendingPeriod: string;
};

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  highlight?: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
      <div className={cn("rounded-xl p-2.5", highlight === "negative" ? "bg-red-50 dark:bg-red-950" : "bg-sidebar-accent/50")}>
        <Icon className={cn("w-5 h-5", highlight === "negative" ? "text-red-500" : highlight === "positive" ? "text-emerald-500" : "text-sidebar-primary")} />
      </div>
      <div>
        <p className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-display font-bold leading-tight", highlight === "positive" ? "text-emerald-600 dark:text-emerald-400" : highlight === "negative" ? "text-red-500" : "text-foreground")}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function GoalBar({ goal, label }: { goal: NonNullable<GoalInfo>; label: string }) {
  const pct = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn("font-semibold text-xs", pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500")}>{pct}%</span>
      </div>
      {goal.description && <p className="text-xs text-muted-foreground">{goal.description}</p>}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        ₱{goal.currentValue.toLocaleString()} / ₱{goal.targetValue.toLocaleString()} · {goal.periodStart} → {goal.periodEnd}
      </p>
    </div>
  );
}

const PHP = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const PERIOD_LABELS: Record<string, string> = { month: "This Month", quarter: "This Quarter", year: "This Year" };

export default function FinanceDashboardPage() {
  usePageHeader("Finance Dashboard", "Donations & spending overview");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("month");

  const load = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const d = await apiFetchJson<FinanceData>(`${API_PREFIX}/finance-dashboard?period=${p}`);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(period); }, [load, period]);

  return (
    <AdminLayout contentClassName="max-w-7xl">
      <div className="space-y-8">
        {/* KPI Cards */}
        <section>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : data ? (
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-5 gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <KpiCard icon={DollarSign} label="Monetary Donations" value={PHP(data.kpis.monetaryThisMonth)} sub="this month" highlight="positive" />
              <KpiCard icon={Package} label="In-Kind Value" value={PHP(data.kpis.inKindThisMonth)} sub="est. this month" />
              <KpiCard icon={TrendingDown} label="Expenses" value={PHP(data.kpis.expensesThisMonth)} sub="this month" highlight={data.kpis.expensesThisMonth > 0 ? "negative" : "neutral"} />
              <KpiCard
                icon={data.kpis.netThisMonth >= 0 ? TrendingUp : TrendingDown}
                label="Net Position"
                value={PHP(data.kpis.netThisMonth)}
                sub="donations − expenses"
                highlight={data.kpis.netThisMonth >= 0 ? "positive" : "negative"}
              />
              <KpiCard icon={Users} label="Active Donors" value={data.kpis.activeDonorCount.toLocaleString()} sub="donated in last 90 days" />
            </motion.div>
          ) : null}
        </section>

        {/* Goal Progress */}
        {data && (data.donationGoal || data.expenseGoal) && (
          <section className="grid sm:grid-cols-2 gap-4">
            {data.donationGoal && <GoalBar goal={data.donationGoal} label="Donation Goal" />}
            {data.expenseGoal && <GoalBar goal={data.expenseGoal} label="Expense Budget Goal" />}
          </section>
        )}

        {/* Income vs Spending Chart */}
        {data && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display font-semibold text-base text-foreground mb-4">Income vs. Spending (12 months)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.incomeVsSpending}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 6)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...softTooltip} formatter={(v: number) => PHP(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" name="Donations" fill="#c8877a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spending" name="Expenses" fill="#a09090" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Allocations + Spending by Category */}
        {data && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* By Program Area (donut) */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-semibold text-base text-foreground mb-4">Donations by Program Area</h3>
              {data.byProgramArea.length === 0 ? (
                <p className="text-sm text-muted-foreground">No allocation data.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <PieChart width={160} height={160}>
                    <Pie data={data.byProgramArea} dataKey="total" nameKey="programArea" cx={75} cy={75} innerRadius={45} outerRadius={72}>
                      {data.byProgramArea.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => PHP(v)} />
                  </PieChart>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {data.byProgramArea.map((row, i) => (
                      <div key={row.programArea} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-muted-foreground truncate">{row.programArea}</span>
                        <span className="ml-auto font-medium text-foreground">{PHP(row.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Spending by Category */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-base text-foreground">Spending by Category</h3>
                <div className="flex rounded-lg overflow-hidden border border-border text-xs">
                  {(["month", "quarter", "year"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "px-2.5 py-1 transition-colors",
                        period === p ? "bg-sidebar-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              {data.byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expense data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.byCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(v: number) => PHP(v)} contentStyle={softTooltip.contentStyle} />
                    <Bar dataKey="total" fill="#a09090" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>
          </div>
        )}

        {/* Top Donors */}
        {data && data.topDonors.length > 0 && (
          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Top Donors (by monetary total)</h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Donor", "Type", "Status", "Total Monetary", "Last Donation"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.topDonors.map((d) => (
                    <tr key={d.supporterId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{d.displayName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.supporterType ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", d.status === "Active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                          {d.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{PHP(d.totalMonetary)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.lastDonation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
