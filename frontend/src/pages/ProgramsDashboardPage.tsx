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
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import { cn } from "@/lib/utils";
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
  Activity,
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

function asFiniteNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function pickRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Normalize API payload (camelCase or PascalCase, partial arrays). Returns null if KPI block is unusable. */
function normalizeProgramsData(raw: unknown): ProgramsData | null {
  const root = pickRecord(raw);
  if (!root) return null;

  const kpisRaw = pickRecord(root.kpis ?? root.Kpis);
  if (!kpisRaw) return null;

  const kpis: Kpis = {
    activeResidents: asFiniteNumber(kpisRaw.activeResidents ?? kpisRaw.ActiveResidents),
    highRiskResidents: asFiniteNumber(kpisRaw.highRiskResidents ?? kpisRaw.HighRiskResidents),
    reintegrationRate: asFiniteNumber(kpisRaw.reintegrationRate ?? kpisRaw.ReintegrationRate),
    sessionsThisMonth: asFiniteNumber(kpisRaw.sessionsThisMonth ?? kpisRaw.SessionsThisMonth),
    visitsThisMonth: asFiniteNumber(kpisRaw.visitsThisMonth ?? kpisRaw.VisitsThisMonth),
  };

  const goalArr = root.goalProgress ?? root.GoalProgress;
  const goalProgress: GoalProgress[] = Array.isArray(goalArr)
    ? goalArr
        .map((item) => {
          const g = pickRecord(item);
          if (!g) return null;
          const goalId = asFiniteNumber(g.goalId ?? g.GoalId, NaN);
          if (!Number.isFinite(goalId)) return null;
          const targetValue = asFiniteNumber(g.targetValue ?? g.TargetValue);
          const currentValue = asFiniteNumber(g.currentValue ?? g.CurrentValue);
          const percentComplete = asFiniteNumber(
            g.percentComplete ?? g.PercentComplete,
            targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 1000) / 10) : 0
          );
          return {
            goalId,
            goalCategory: String(g.goalCategory ?? g.GoalCategory ?? "Goal"),
            description: g.description != null ? String(g.description) : (g.Description != null ? String(g.Description) : null),
            safehouseName: g.safehouseName != null ? String(g.safehouseName) : (g.SafehouseName != null ? String(g.SafehouseName) : null),
            targetValue,
            currentValue,
            percentComplete,
            periodStart: String(g.periodStart ?? g.PeriodStart ?? ""),
            periodEnd: String(g.periodEnd ?? g.PeriodEnd ?? ""),
          } satisfies GoalProgress;
        })
        .filter((x): x is GoalProgress => x != null)
    : [];

  const safehouseArr = root.safehouseTable ?? root.SafehouseTable;
  const safehouseTable: SafehouseRow[] = Array.isArray(safehouseArr)
    ? safehouseArr
        .map((item) => {
          const s = pickRecord(item);
          if (!s) return null;
          const safehouseId = asFiniteNumber(s.safehouseId ?? s.SafehouseId, NaN);
          if (!Number.isFinite(safehouseId)) return null;
          return {
            safehouseId,
            name: String(s.name ?? s.Name ?? "Safehouse"),
            region: String(s.region ?? s.Region ?? ""),
            activeResidents: asFiniteNumber(s.activeResidents ?? s.ActiveResidents),
            capacityGirls: asFiniteNumber(s.capacityGirls ?? s.CapacityGirls),
            avgHealthScore: asFiniteNumber(s.avgHealthScore ?? s.AvgHealthScore),
            avgEducationProgress: asFiniteNumber(s.avgEducationProgress ?? s.AvgEducationProgress),
            incidentsThisMonth: asFiniteNumber(s.incidentsThisMonth ?? s.IncidentsThisMonth),
            sessionsThisMonth: asFiniteNumber(s.sessionsThisMonth ?? s.SessionsThisMonth),
          } satisfies SafehouseRow;
        })
        .filter((x): x is SafehouseRow => x != null)
    : [];

  const mapMonthSeries = (key: string, pascal: string) => {
    const arr = root[key] ?? root[pascal];
    if (!Array.isArray(arr)) return [] as { label: string; count: number }[];
    return arr
      .map((item) => {
        const m = pickRecord(item);
        if (!m) return { label: "", count: 0 };
        return {
          label: String(m.label ?? m.Label ?? ""),
          count: asFiniteNumber(m.count ?? m.Count),
        };
      })
      .filter((m) => m.label.length > 0);
  };

  const monthlyAdmissions = mapMonthSeries("monthlyAdmissions", "MonthlyAdmissions");
  const monthlyClosures = mapMonthSeries("monthlyClosures", "MonthlyClosures");

  const funnelArr = root.reintegrationFunnel ?? root.ReintegrationFunnel;
  const reintegrationFunnel: { status: string; count: number }[] = Array.isArray(funnelArr)
    ? funnelArr.map((item) => {
        const f = pickRecord(item);
        return {
          status: String(f?.status ?? f?.Status ?? ""),
          count: asFiniteNumber(f?.count ?? f?.Count),
        };
      })
    : [];

  const riskArr = root.riskTrend ?? root.RiskTrend;
  const riskTrend: { label: string; low: number; medium: number; high: number; critical: number }[] = Array.isArray(riskArr)
    ? riskArr.map((item) => {
        const r = pickRecord(item);
        return {
          label: String(r?.label ?? r?.Label ?? ""),
          low: asFiniteNumber(r?.low ?? r?.Low),
          medium: asFiniteNumber(r?.medium ?? r?.Medium),
          high: asFiniteNumber(r?.high ?? r?.High),
          critical: asFiniteNumber(r?.critical ?? r?.Critical),
        };
      })
    : [];

  const incArr = root.unresolvedIncidents ?? root.UnresolvedIncidents;
  const unresolvedIncidents: Incident[] = Array.isArray(incArr)
    ? incArr
        .map((item) => {
          const i = pickRecord(item);
          if (!i) return null;
          const incidentId = asFiniteNumber(i.incidentId ?? i.IncidentId, NaN);
          if (!Number.isFinite(incidentId)) return null;
          return {
            incidentId,
            residentCode: String(i.residentCode ?? i.ResidentCode ?? ""),
            safehouseName: i.safehouseName != null ? String(i.safehouseName) : (i.SafehouseName != null ? String(i.SafehouseName) : null),
            incidentType: String(i.incidentType ?? i.IncidentType ?? ""),
            severity: String(i.severity ?? i.Severity ?? ""),
            incidentDate: String(i.incidentDate ?? i.IncidentDate ?? ""),
            followUpRequired: Boolean(i.followUpRequired ?? i.FollowUpRequired),
            description: i.description != null ? String(i.description) : (i.Description != null ? String(i.Description) : null),
          } satisfies Incident;
        })
        .filter((x): x is Incident => x != null)
    : [];

  return {
    kpis,
    goalProgress,
    safehouseTable,
    monthlyAdmissions,
    monthlyClosures,
    reintegrationFunnel,
    riskTrend,
    unresolvedIncidents,
  };
}

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

const emptyGoalForm = (): GoalFormData => ({
  goalCategory: "HomeVisits",
  safehouseId: "",
  targetValue: "",
  periodStart: "",
  periodEnd: "",
  description: "",
});

export default function ProgramsDashboardPage() {
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
      const d = await apiFetchJson<unknown>(`${API_PREFIX}/programs-dashboard`);
      if (import.meta.env.DEV) {
        console.log("[ProgramsDashboard] raw response", {
          type: typeof d,
          keys: d && typeof d === "object" ? Object.keys(d as object) : [],
          payload: d,
        });
      }
      const normalized = normalizeProgramsData(d);
      if (!normalized) {
        const msg = "Dashboard response was empty or invalid.";
        if (silent) {
          console.error("[ProgramsDashboard] normalize failed", d);
          toast.error("Could not refresh dashboard");
        } else {
          setError(msg);
          setData(null);
        }
        return;
      }
      setData(normalized);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      if (silent) {
        console.error("[ProgramsDashboard] refresh failed", e);
        toast.error("Could not refresh dashboard");
      } else {
        setError(msg);
        setData(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const admissions = data?.monthlyAdmissions ?? [];
  const closures = data?.monthlyClosures ?? [];
  const admissionsChart = admissions.map((m, i) => ({
    month: m.label,
    admissions: m.count,
    closures: closures[i]?.count ?? 0,
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
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        title="Programs Dashboard"
        description="Operations, goals, and safehouse performance at a glance."
      >
        {error ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            <p>{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void load()}
            >
              Try again
            </Button>
          </div>
        ) : null}

        {!loading && !error && !data ? (
          <p className="mb-6 rounded-lg border border-border bg-muted/30 px-4 py-3 font-body text-sm text-muted-foreground">
            No dashboard data is available. Use refresh or try again later.
          </p>
        ) : null}

        <section className="mb-12 xl:mb-16">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-[1.1rem] bg-white/45" />
              ))}
            </div>
          ) : data?.kpis ? (
            <>
              <DashboardSectionHeader
                icon={Activity}
                eyebrow="Key metrics"
                title="Program KPIs"
                description="Live counts from resident and field activity."
              />
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <CaseloadMetricCard
                  label="Active residents"
                  value={data.kpis?.activeResidents ?? 0}
                  icon={Users}
                  motionDelay={0}
                />
                <CaseloadMetricCard
                  label="High / critical risk"
                  value={data.kpis?.highRiskResidents ?? 0}
                  icon={AlertTriangle}
                  motionDelay={0.05}
                  variant="critical"
                />
                <CaseloadMetricCard
                  label="Reintegration rate"
                  value={data.kpis?.reintegrationRate ?? 0}
                  format={(n) => `${Math.round(n)}%`}
                  icon={RefreshCw}
                  motionDelay={0.1}
                />
                <CaseloadMetricCard
                  label="Sessions this month"
                  value={data.kpis?.sessionsThisMonth ?? 0}
                  icon={MessageSquare}
                  motionDelay={0.14}
                />
                <CaseloadMetricCard
                  label="Home visits this month"
                  value={data.kpis?.visitsThisMonth ?? 0}
                  icon={MapPin}
                  motionDelay={0.18}
                />
              </div>
            </>
          ) : !loading && !error ? (
            <p className="font-body text-sm text-muted-foreground">Metrics could not be loaded.</p>
          ) : null}
        </section>

        {data && (
          <section className="mb-12">
            <DashboardSectionHeader
              icon={Target}
              eyebrow="Planning"
              title="Active goals"
              description="Track organizational targets for the current period."
              right={
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setGoalDialogOpen(true)}
                  className="h-12 rounded-2xl border border-white/50 bg-white/50 px-5 font-body font-medium backdrop-blur-md dark:border-white/10 dark:bg-white/[0.07]"
                >
                  <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Add goal
                </Button>
              }
            />
            {(data.goalProgress ?? []).length === 0 ? (
              <div className="rounded-[1.1rem] border border-dashed border-white/50 bg-white/30 px-8 py-12 text-center font-body text-sm text-muted-foreground backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
                No active goals for this period. Add one above.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data.goalProgress ?? []).map((g) => {
                  const current = g.currentValue ?? 0;
                  const target = g.targetValue ?? 0;
                  const pct = g.percentComplete ?? 0;
                  return (
                  <DashboardGlassPanel key={g.goalId} padding="sm" className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{g.goalCategory ?? "—"}</span>
                      {g.safehouseName && (
                        <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{g.safehouseName}</span>
                      )}
                    </div>
                    {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{current.toLocaleString()} / {target.toLocaleString()}</span>
                        <span className={cn("font-semibold", pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500")}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", progressColor(pct))}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{g.periodStart ?? ""} → {g.periodEnd ?? ""}</p>
                  </DashboardGlassPanel>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {data && (data.safehouseTable ?? []).length > 0 && (
          <section className="mb-12">
            <DashboardSectionHeader
              icon={MapPin}
              eyebrow="Safehouses"
              title="Safehouse overview"
              description="Capacity, wellbeing scores, and monthly activity by location."
            />
            <div className={dashboardTableShellClass}>
              <table className="w-full text-sm">
                <thead className={dashboardTableHeadRowClass}>
                  <tr>
                    {["Safehouse", "Residents / Capacity", "Avg Health", "Avg Education", "Incidents", "Sessions"].map((h) => (
                      <th key={h} className={dashboardTableHeadCellClass}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={dashboardTableBodyClass}>
                  {(data.safehouseTable ?? []).map((s) => (
                    <tr key={s.safehouseId} className={dashboardTableRowClass}>
                      <td className={`${dashboardTableCellClass} font-medium`}>{s.name ?? "—"}</td>
                      <td className={`${dashboardTableCellClass} text-muted-foreground`}>
                        {s.activeResidents ?? 0} / {s.capacityGirls ?? 0}
                      </td>
                      <td className={`${dashboardTableCellClass} text-muted-foreground`}>
                        {(s.avgHealthScore ?? 0) > 0 ? (s.avgHealthScore ?? 0).toFixed(1) : "—"}
                      </td>
                      <td className={`${dashboardTableCellClass} text-muted-foreground`}>
                        {(s.avgEducationProgress ?? 0) > 0 ? `${(s.avgEducationProgress ?? 0).toFixed(0)}%` : "—"}
                      </td>
                      <td className={dashboardTableCellClass}>
                        <span
                          className={
                            (s.incidentsThisMonth ?? 0) > 0 ? "font-medium text-red-500" : "text-muted-foreground"
                          }
                        >
                          {s.incidentsThisMonth ?? 0}
                        </span>
                      </td>
                      <td className={`${dashboardTableCellClass} text-muted-foreground`}>{s.sessionsThisMonth ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {data && (
          <div className="mb-12 grid gap-8 lg:grid-cols-2">
            <DashboardGlassPanel>
              <p className={dashboardPanelEyebrowClass}>Admissions &amp; closures</p>
              <p className={dashboardPanelSubtitleClass}>Twelve-month trend</p>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={admissionsChart.length > 0 ? admissionsChart : [{ month: "—", admissions: 0, closures: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(0, 6)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip {...softTooltip} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="admissions" stroke="#c8877a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="closures" stroke="#a09090" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DashboardGlassPanel>

            <DashboardGlassPanel>
              <p className={dashboardPanelEyebrowClass}>Reintegration status</p>
              <p className={dashboardPanelSubtitleClass}>Cases by pipeline stage</p>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(data.reintegrationFunnel ?? []).length > 0 ? data.reintegrationFunnel : [{ status: "No data", count: 0 }]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 25% 90%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip {...softTooltip} />
                    <Bar dataKey="count" fill="#c8877a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashboardGlassPanel>

            <DashboardGlassPanel className="lg:col-span-2">
              <p className={dashboardPanelEyebrowClass}>Risk distribution</p>
              <p className={dashboardPanelSubtitleClass}>Six-month stacked levels</p>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(data.riskTrend ?? []).length > 0 ? data.riskTrend : [{ label: "—", low: 0, medium: 0, high: 0, critical: 0 }]}>
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
              </div>
            </DashboardGlassPanel>
          </div>
        )}

        {data && (data.unresolvedIncidents ?? []).length > 0 && (
          <section className="mb-6">
            <DashboardSectionHeader
              icon={AlertTriangle}
              eyebrow="Incidents"
              title="Unresolved incidents"
              description={
                <>
                  <span className="text-red-500">{(data.unresolvedIncidents ?? []).length}</span> open — resolve or escalate from this list.
                </>
              }
            />
            <div className={dashboardTableShellClass}>
              <table className="w-full text-sm">
                <thead className={dashboardTableHeadRowClass}>
                  <tr>
                    {["Resident", "Safehouse", "Type", "Severity", "Date", "Follow-Up", ""].map((h) => (
                      <th key={h} className={dashboardTableHeadCellClass}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={dashboardTableBodyClass}>
                  {(data.unresolvedIncidents ?? []).map((inc) => {
                    const rowId = getIncidentRowId(inc);
                    return (
                      <tr key={rowId ?? `${inc.residentCode ?? "?"}-${inc.incidentDate ?? ""}`} className={dashboardTableRowClass}>
                        <td className={`${dashboardTableCellClass} font-mono text-xs`}>{inc.residentCode ?? "—"}</td>
                        <td className={`${dashboardTableCellClass} text-muted-foreground`}>{inc.safehouseName ?? "—"}</td>
                        <td className={`${dashboardTableCellClass} text-muted-foreground`}>{inc.incidentType ?? "—"}</td>
                        <td className={cn(dashboardTableCellClass, "font-medium", severityColor(inc.severity ?? ""))}>
                          {inc.severity ?? "—"}
                        </td>
                        <td className={`${dashboardTableCellClass} text-muted-foreground`}>{inc.incidentDate ?? "—"}</td>
                        <td className={dashboardTableCellClass}>
                          {inc.followUpRequired ? (
                            <Circle className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className={dashboardTableCellClass}>
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
                            className="h-8 rounded-xl px-2 font-body text-xs hover:bg-white/50 dark:hover:bg-white/10"
                          >
                            <CheckCircle className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
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
      </StaffPageShell>

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
