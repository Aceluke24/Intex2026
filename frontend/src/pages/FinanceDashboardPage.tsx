import { AdminLayout } from "@/components/AdminLayout";
import { CaseloadMetricCard } from "@/components/caseload/CaseloadMetricCard";
import {
  DASHBOARD_CONTENT_MAX_WIDTH,
  DashboardGlassPanel,
  DashboardSectionHeader,
  dashboardPanelEyebrowClass,
  dashboardPanelSubtitleClass,
  dashboardTableBodyClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
  dashboardTableRowClass,
  dashboardTableShellClass,
} from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
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
import { formatUSD, formatUSDCompactThousands } from "@/lib/currency";

const softTooltip = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid hsl(36 25% 90%)",
    boxShadow: "0 8px 32px rgba(45,35,48,0.08)",
    fontSize: "12px",
    color: "hsl(213 15% 18%)",
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

function GoalBar({ goal, label }: { goal: NonNullable<GoalInfo>; label: string }) {
  const pct = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <DashboardGlassPanel padding="sm" className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn("font-semibold text-xs", pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500")}>{pct}%</span>
      </div>
      {goal.description && <p className="text-xs text-muted-foreground">{goal.description}</p>}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatUSD(goal.currentValue, 0)} / {formatUSD(goal.targetValue, 0)} · {goal.periodStart} → {goal.periodEnd}
      </p>
    </DashboardGlassPanel>
  );
}

const PERIOD_LABELS: Record<string, string> = { month: "This Month", quarter: "This Quarter", year: "This Year" };

export default function FinanceDashboardPage() {
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
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        title="Finance Dashboard"
        description="Donations, spending, and donor concentration for the selected period."
      >
        {error ? (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <section className="mb-12 xl:mb-16">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-[1.1rem] bg-white/45" />
              ))}
            </div>
          ) : data ? (
            <>
              <DashboardSectionHeader
                icon={DollarSign}
                eyebrow="Key metrics"
                title="Financial snapshot"
                description={`Values reflect ${PERIOD_LABELS[period]} unless noted.`}
              />
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <CaseloadMetricCard
                  label="Monetary donations"
                  value={data.kpis.monetaryThisMonth}
                  format={(n) => formatUSD(n, 0)}
                  icon={DollarSign}
                  motionDelay={0}
                />
                <CaseloadMetricCard
                  label="In-kind value (est.)"
                  value={data.kpis.inKindThisMonth}
                  format={(n) => formatUSD(n, 0)}
                  icon={Package}
                  motionDelay={0.05}
                />
                <CaseloadMetricCard
                  label="Expenses"
                  value={data.kpis.expensesThisMonth}
                  format={(n) => formatUSD(n, 0)}
                  icon={TrendingDown}
                  motionDelay={0.1}
                  variant={data.kpis.expensesThisMonth > 0 ? "critical" : "neutral"}
                />
                <CaseloadMetricCard
                  label="Net position"
                  value={data.kpis.netThisMonth}
                  format={(n) => formatUSD(n, 0)}
                  icon={data.kpis.netThisMonth >= 0 ? TrendingUp : TrendingDown}
                  motionDelay={0.14}
                  variant={data.kpis.netThisMonth < 0 ? "critical" : "neutral"}
                />
                <CaseloadMetricCard
                  label="Active donors"
                  value={data.kpis.activeDonorCount}
                  icon={Users}
                  motionDelay={0.18}
                />
              </div>
            </>
          ) : null}
        </section>

        {data && (data.donationGoal || data.expenseGoal) && (
          <section className="mb-12 grid gap-4 sm:grid-cols-2">
            {data.donationGoal && <GoalBar goal={data.donationGoal} label="Donation goal" />}
            {data.expenseGoal && <GoalBar goal={data.expenseGoal} label="Expense budget goal" />}
          </section>
        )}

        {data && (
          <section className="mb-12">
            <DashboardGlassPanel>
              <p className={dashboardPanelEyebrowClass}>Cash flow</p>
              <p className={dashboardPanelSubtitleClass}>Income vs. spending (12 months)</p>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.incomeVsSpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 6)} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatUSDCompactThousands(v)} />
                    <Tooltip {...softTooltip} formatter={(v: number) => formatUSD(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="income" name="Donations" fill="#c8877a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spending" name="Expenses" fill="#a09090" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashboardGlassPanel>
          </section>
        )}

        {data && (
          <div className="mb-12 grid gap-8 lg:grid-cols-2">
            <DashboardGlassPanel>
              <p className={dashboardPanelEyebrowClass}>Allocations</p>
              <p className={dashboardPanelSubtitleClass}>Donations by program area</p>
              {data.byProgramArea.length === 0 ? (
                <p className="mt-4 font-body text-sm text-muted-foreground">No allocation data.</p>
              ) : (
                <div className="mt-6 flex items-center gap-6">
                  <PieChart width={160} height={160}>
                    <Pie data={data.byProgramArea} dataKey="total" nameKey="programArea" cx={75} cy={75} innerRadius={45} outerRadius={72}>
                      {data.byProgramArea.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatUSD(v)} />
                  </PieChart>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {data.byProgramArea.map((row, i) => (
                      <div key={row.programArea} className="flex items-center gap-2 font-body text-xs">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="truncate text-muted-foreground">{row.programArea}</span>
                        <span className="ml-auto font-medium text-foreground">{formatUSD(row.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DashboardGlassPanel>

            <DashboardGlassPanel>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={dashboardPanelEyebrowClass}>Spending</p>
                  <p className={dashboardPanelSubtitleClass}>By category</p>
                </div>
                <div className="flex items-center gap-1 rounded-2xl border border-white/50 bg-white/45 p-1 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08]">
                  {(["month", "quarter", "year"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "rounded-xl px-3 py-2 font-body text-xs font-medium transition-all",
                        period === p
                          ? "bg-white text-foreground shadow-sm dark:bg-white/15"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              {data.byCategory.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">No expense data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.byCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatUSDCompactThousands(v)} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(v: number) => formatUSD(v)} contentStyle={softTooltip.contentStyle} />
                    <Bar dataKey="total" fill="#a09090" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </DashboardGlassPanel>
          </div>
        )}

        {data && data.topDonors.length > 0 && (
          <section className="mb-6">
            <DashboardSectionHeader
              icon={Users}
              eyebrow="Supporters"
              title="Top donors"
              description="Ranked by total monetary giving."
            />
            <div className={dashboardTableShellClass}>
              <table className="w-full text-sm">
                <thead className={dashboardTableHeadRowClass}>
                  <tr>
                    {["Donor", "Type", "Status", "Total monetary", "Last donation"].map((h) => (
                      <th key={h} className={dashboardTableHeadCellClass}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={dashboardTableBodyClass}>
                  {data.topDonors.map((d) => (
                    <tr key={d.supporterId} className={dashboardTableRowClass}>
                      <td className={`${dashboardTableCellClass} font-medium`}>{d.displayName}</td>
                      <td className={`${dashboardTableCellClass} text-muted-foreground`}>{d.supporterType ?? "—"}</td>
                      <td className={dashboardTableCellClass}>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-body text-xs",
                            d.status === "Active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {d.status ?? "—"}
                        </span>
                      </td>
                      <td className={`${dashboardTableCellClass} font-medium`}>{formatUSD(d.totalMonetary)}</td>
                      <td className={`${dashboardTableCellClass} text-muted-foreground`}>{d.lastDonation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </StaffPageShell>
    </AdminLayout>
  );
}
