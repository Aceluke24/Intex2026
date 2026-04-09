import { AdminLayout } from "@/components/AdminLayout";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Users,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  MapPin,
  Target,
  Plus,
  CheckCircle,
  Circle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const softTooltip = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid hsl(36 25% 90%)",
    boxShadow: "0 8px 32px rgba(45,35,48,0.08)",
    fontSize: "12px",
    color: "hsl(213 15% 18%)",
  },
};

type Kpis = {
  activeResidents: number;
  highRiskResidents: number;
  reintegrationRate: number;
  sessionsThisMonth: number;
  visitsThisMonth: number;
};

type GoalProgress = {
  goalId: number;
  goalCategory: string;
  description: string | null;
  safehouseName: string | null;
  targetValue: number;
  currentValue: number;
  percentComplete: number;
  periodStart: string;
  periodEnd: string;
};

type SafehouseRow = {
  safehouseId: number;
  name: string;
  region: string;
  activeResidents: number;
  capacityGirls: number;
  avgHealthScore: number;
  avgEducationProgress: number;
  incidentsThisMonth: number;
  sessionsThisMonth: number;
};

type Incident = {
  incidentId: number;
  residentCode: string;
  safehouseName: string | null;
  incidentType: string;
  severity: string;
  incidentDate: string;
  followUpRequired: boolean;
  description: string | null;
};

/** API uses camelCase; tolerate PascalCase if a proxy or older client changed casing. */
function getIncidentRowId(inc: Incident & { IncidentId?: number }): number | undefined {
  const raw = inc.incidentId ?? inc.IncidentId;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

type ProgramsData = {
  kpis: Kpis;
  goalProgress: GoalProgress[];
  safehouseTable: SafehouseRow[];
  monthlyAdmissions: { label: string; count: number }[];
  monthlyClosures: { label: string; count: number }[];
  reintegrationFunnel: { status: string; count: number }[];
  riskTrend: { label: string; low: number; medium: number; high: number; critical: number }[];
  unresolvedIncidents: Incident[];
};

type GoalFormData = {
  goalCategory: string;
  safehouseId: string;
  targetValue: string;
  periodStart: string;
  periodEnd: string;
  description: string;
};

const GOAL_CATEGORIES = [
  "Admissions",
  "HomeVisits",
  "ProcessRecordings",
  "MonetaryDonations",
  "Reintegrations",
  "IncidentResolutions",
  "Expenses",
];

const severityColor = (s: string) =>
  s === "High" ? "text-red-600 dark:text-red-400" : s === "Medium" ? "text-amber-600 dark:text-amber-400" : "text-blue-500";

const progressColor = (pct: number) =>
  pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";

function KpiCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
      <div className="rounded-xl bg-sidebar-accent/50 p-2.5">
        <Icon className="w-5 h-5 text-sidebar-primary" />
      </div>
      <div>
        <p className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-2xl font-display font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const emptyGoalForm = (): GoalFormData => ({
  goalCategory: "HomeVisits",
  safehouseId: "",
  targetValue: "",
  periodStart: "",
  periodEnd: "",
  description: "",
});

export default function ProgramsDashboardPage() {
  usePageHeader("Programs Dashboard", "Operations & outcomes overview");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProgramsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalFormData>(emptyGoalForm());
  const [savingGoal, setSavingGoal] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const d = await apiFetchJson<ProgramsData>(`${API_PREFIX}/programs-dashboard`);
      setData(d);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      if (silent) {
        console.error("[ProgramsDashboard] refresh failed", e);
        toast.error("Could not refresh dashboard");
      } else {
        setError(msg);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const admissionsChart = (data?.monthlyAdmissions ?? []).map((m, i) => ({
    month: m.label,
    admissions: m.count,
    closures: data?.monthlyClosures[i]?.count ?? 0,
  }));

  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      const body = {
        goalCategory: goalForm.goalCategory,
        safehouseId: goalForm.safehouseId ? parseInt(goalForm.safehouseId) : null,
        targetValue: parseFloat(goalForm.targetValue) || 0,
        periodStart: goalForm.periodStart,
        periodEnd: goalForm.periodEnd,
        description: goalForm.description || null,
        createdBy: null,
      };
      const res = await apiFetch(`${API_PREFIX}/goals`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save goal");
      toast.success("Goal added");
      setGoalDialogOpen(false);
      setGoalForm(emptyGoalForm());
      void load();
    } catch {
      toast.error("Could not save goal");
    } finally {
      setSavingGoal(false);
    }
  };

  const handleResolve = async (id: number) => {
    if (!Number.isFinite(id)) {
      console.error("Failed to resolve incident: invalid id", id);
      toast.error("Invalid incident.");
      return;
    }
    setResolvingId(id);
    try {
      const res = await apiFetch(`${API_PREFIX}/incidents/${id}/resolve`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail ? `${res.status}: ${detail.slice(0, 120)}` : `${res.status}`);
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              unresolvedIncidents: prev.unresolvedIncidents.filter((row) => getIncidentRowId(row) !== id),
            }
          : prev
      );
      toast.success("Incident resolved");
      await load({ silent: true });
    } catch (err) {
      console.error("Failed to resolve incident", err);
      toast.error("Failed to resolve incident");
      await load({ silent: true });
    } finally {
      setResolvingId(null);
    }
  };

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
              <KpiCard icon={Users} label="Active Residents" value={data.kpis.activeResidents.toLocaleString()} />
              <KpiCard icon={AlertTriangle} label="High / Critical Risk" value={data.kpis.highRiskResidents.toLocaleString()} sub="active cases" />
              <KpiCard icon={RefreshCw} label="Reintegration Rate" value={`${data.kpis.reintegrationRate}%`} sub="of those with a plan" />
              <KpiCard icon={MessageSquare} label="Sessions This Month" value={data.kpis.sessionsThisMonth.toLocaleString()} />
              <KpiCard icon={MapPin} label="Home Visits This Month" value={data.kpis.visitsThisMonth.toLocaleString()} />
            </motion.div>
          ) : null}
        </section>

        {/* Goal Progress */}
        {data && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg text-foreground">Active Goals</h2>
              <Button size="sm" variant="outline" onClick={() => setGoalDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Add Goal
              </Button>
            </div>
            {data.goalProgress.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                No active goals for this period. Add one above.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.goalProgress.map((g) => (
                  <div key={g.goalId} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{g.goalCategory}</span>
                      {g.safehouseName && (
                        <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{g.safehouseName}</span>
                      )}
                    </div>
                    {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{g.currentValue.toLocaleString()} / {g.targetValue.toLocaleString()}</span>
                        <span className={cn("font-semibold", g.percentComplete >= 75 ? "text-emerald-600" : g.percentComplete >= 50 ? "text-amber-600" : "text-red-500")}>
                          {g.percentComplete}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", progressColor(g.percentComplete))}
                          style={{ width: `${Math.min(100, g.percentComplete)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{g.periodStart} → {g.periodEnd}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Safehouse Comparison Table */}
        {data && data.safehouseTable.length > 0 && (
          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Safehouse Overview</h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Safehouse", "Residents / Capacity", "Avg Health", "Avg Education", "Incidents", "Sessions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.safehouseTable.map((s) => (
                    <tr key={s.safehouseId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.activeResidents} / {s.capacityGirls}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.avgHealthScore > 0 ? s.avgHealthScore.toFixed(1) : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.avgEducationProgress > 0 ? `${s.avgEducationProgress.toFixed(0)}%` : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={s.incidentsThisMonth > 0 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                          {s.incidentsThisMonth}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.sessionsThisMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Charts row */}
        {data && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Admissions vs Closures */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-semibold text-base text-foreground mb-4">Admissions vs. Closures (12 months)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={admissionsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 6)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip {...softTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="admissions" stroke="#c8877a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="closures" stroke="#a09090" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </section>

            {/* Reintegration Funnel */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-semibold text-base text-foreground mb-4">Reintegration Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.reintegrationFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip {...softTooltip} />
                  <Bar dataKey="count" fill="#c8877a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Risk Trend */}
            <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
              <h3 className="font-display font-semibold text-base text-foreground mb-4">Risk Level Distribution (6 months)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.riskTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 6)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip {...softTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="low" stackId="a" fill="#86efac" name="Low" />
                  <Bar dataKey="medium" stackId="a" fill="#fcd34d" name="Medium" />
                  <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
                  <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>
        )}

        {/* Unresolved Incidents */}
        {data && data.unresolvedIncidents.length > 0 && (
          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              Unresolved Incidents
              <span className="ml-2 text-sm font-body font-normal text-red-500">({data.unresolvedIncidents.length})</span>
            </h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Resident", "Safehouse", "Type", "Severity", "Date", "Follow-Up", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.unresolvedIncidents.map((inc) => {
                    const rowId = getIncidentRowId(inc);
                    return (
                    <tr key={rowId ?? `${inc.residentCode}-${inc.incidentDate}`} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{inc.residentCode}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inc.safehouseName ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inc.incidentType}</td>
                      <td className={cn("px-4 py-3 font-medium", severityColor(inc.severity))}>{inc.severity}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inc.incidentDate}</td>
                      <td className="px-4 py-3">
                        {inc.followUpRequired
                          ? <Circle className="w-4 h-4 text-amber-500" />
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={rowId == null || resolvingId === rowId}
                          onClick={() => {
                            if (rowId == null) {
                              toast.error("Invalid incident.");
                              return;
                            }
                            void handleResolve(rowId);
                          }}
                          className="text-xs h-7 px-2 cursor-pointer hover:bg-accent/80"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          {resolvingId === rowId ? "…" : "Resolve"}
                        </Button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={goalForm.goalCategory}
                onChange={(e) => setGoalForm((f) => ({ ...f, goalCategory: e.target.value }))}
              >
                {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Target Value</label>
              <input
                type="number"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={goalForm.targetValue}
                onChange={(e) => setGoalForm((f) => ({ ...f, targetValue: e.target.value }))}
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Safehouse (optional)</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={goalForm.safehouseId}
                onChange={(e) => setGoalForm((f) => ({ ...f, safehouseId: e.target.value }))}
              >
                <option value="">Org-wide</option>
                {(data?.safehouseTable ?? []).map((s) => (
                  <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Period Start</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={goalForm.periodStart}
                  onChange={(e) => setGoalForm((f) => ({ ...f, periodStart: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Period End</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={goalForm.periodEnd}
                  onChange={(e) => setGoalForm((f) => ({ ...f, periodEnd: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description (optional)</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={goalForm.description}
                onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Q2 home visits target"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSaveGoal()} disabled={savingGoal || !goalForm.targetValue || !goalForm.periodStart || !goalForm.periodEnd}>
              {savingGoal ? "Saving…" : "Save Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
