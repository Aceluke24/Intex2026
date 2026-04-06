import { AdminLayout } from "@/components/AdminLayout";
import { CommandCenterKpis, PriorityCallouts, ResidentsList, DonationChart } from "@/components/dashboard";
import type {
  AttentionItem,
  DashboardMetric,
  DonationMonth,
  PriorityCallout,
  ResidentRow,
  ResidentStatus,
} from "@/lib/dashboardMockData";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const DEFAULT_API_BASE = "https://intex-backend-fmb8dnaxb0dkd8gv.francecentral-01.azurewebsites.net";

function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE ?? DEFAULT_API_BASE).replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return res.json() as Promise<T>;
}

type Paged<T> = { total: number; page: number; pageSize: number; items: T[] };

type ResidentApi = {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  safehouseId: number;
  caseStatus: string;
  dateOfAdmission: string;
  currentRiskLevel: string;
  reintegrationStatus?: string | null;
};

type DonationApi = {
  donationId: number;
  donationDate: string;
  amount?: number | null;
  estimatedValue?: number | null;
  donationType: string;
  supporterId: number;
};

type VisitationApi = {
  visitationId: number;
  residentId: number;
  visitDate: string;
  visitType: string;
  followUpNeeded: boolean;
};

type RecordingApi = {
  recordingId: number;
  residentId: number;
  sessionDate: string;
  concernsFlagged: boolean;
  sessionType: string;
};

type SafehouseApi = {
  safehouseId: number;
  name: string;
};

function mapRiskToStatus(level: string): ResidentStatus {
  const l = (level || "").trim();
  if (l === "Low") return "Stable";
  if (l === "High" || l === "Critical") return "At Risk";
  return "Progressing";
}

function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatDisplayDate(s: string): string {
  try {
    return parseDateOnly(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return s;
  }
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short" });
}

/** Monetary + in-kind estimated value for dashboard money charts */
function donationMoneyValue(d: DonationApi): number {
  if (d.donationType === "Monetary") return Number(d.amount ?? 0);
  if (d.donationType === "InKind") return Number(d.estimatedValue ?? d.amount ?? 0);
  return Number(d.amount ?? d.estimatedValue ?? 0);
}

function formatMoneyCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

const defaultPrimary: DashboardMetric = {
  key: "residents",
  label: "Active residents",
  value: "—",
  trendLabel: "No data yet",
  trend: "neutral",
  icon: "users",
};

const defaultDonationsMetric: DashboardMetric = {
  key: "donations",
  label: "Donations this month",
  value: "—",
  trendLabel: "",
  trend: "neutral",
  icon: "heart",
};

const defaultVisitsMetric: DashboardMetric = {
  key: "conferences",
  label: "Upcoming visits (14 days)",
  value: "—",
  trendLabel: "Scheduled home visits",
  trend: "neutral",
  icon: "calendar",
};

const defaultReint: DashboardMetric = {
  key: "reintegration",
  label: "Reintegration success rate",
  value: "—",
  trendLabel: "Among cases with reintegration activity",
  trend: "neutral",
  icon: "percent",
};

const DashboardPage = () => {
  usePageHeader("Command Center", "Live operations overview");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [primaryMetric, setPrimaryMetric] = useState<DashboardMetric>(defaultPrimary);
  const [supportingMetrics, setSupportingMetrics] = useState<DashboardMetric[]>([
    defaultDonationsMetric,
    {
      key: "retention",
      label: "Donor retention",
      value: "—",
      trendLabel: "Supporters with repeat gifts",
      trend: "neutral",
      icon: "percent",
    },
    defaultVisitsMetric,
  ]);
  const [reintegrationMetric, setReintegrationMetric] = useState<DashboardMetric>(defaultReint);
  const [donationSpark, setDonationSpark] = useState<number[]>([]);
  const [residentSpark, setResidentSpark] = useState<number[]>([]);
  const [activityItems, setActivityItems] = useState<AttentionItem[]>([]);
  const [priorityCallouts, setPriorityCallouts] = useState<PriorityCallout[]>([]);
  const [liveContext, setLiveContext] = useState({
    residentCount: 0,
    safehouseCount: 0,
    donationMonthLabel: "—",
    donationTrendPhrase: "not enough history to compare",
    retentionLabel: "—",
  });
  const [donationActivity, setDonationActivity] = useState<DonationMonth[]>([]);
  const [donationInsight, setDonationInsight] = useState<string>(
    "Totals combine monetary gifts and estimated in-kind value by donation month."
  );
  const [residentsOverview, setResidentsOverview] = useState<ResidentRow[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [activePaged, donationsPaged, visitsPaged, recordingsPaged, safehouses] = await Promise.all([
        fetchJson<Paged<ResidentApi>>("/api/residents?caseStatus=Active&page=1&pageSize=5000"),
        fetchJson<Paged<DonationApi>>("/api/donations?page=1&pageSize=5000"),
        fetchJson<Paged<VisitationApi>>("/api/visitations?page=1&pageSize=5000"),
        fetchJson<Paged<RecordingApi>>("/api/recordings?page=1&pageSize=5000"),
        fetchJson<SafehouseApi[]>("/api/safehouses"),
      ]);

      const residents = activePaged.items ?? [];
      const donations = donationsPaged.items ?? [];
      const visitations = visitsPaged.items ?? [];
      const recordings = recordingsPaged.items ?? [];
      const houseById = new Map((safehouses ?? []).map((s) => [s.safehouseId, s.name]));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in14 = new Date(today);
      in14.setDate(in14.getDate() + 14);

      const upcomingVisits = visitations.filter((v) => {
        const vd = parseDateOnly(v.visitDate);
        vd.setHours(0, 0, 0, 0);
        return vd >= today && vd <= in14;
      }).length;

      const highRiskCount = residents.filter((r) => {
        const x = (r.currentRiskLevel || "").trim();
        return x === "High" || x === "Critical";
      }).length;

      const lastSessionByResident = new Map<number, string>();
      for (const rec of recordings) {
        const cur = lastSessionByResident.get(rec.residentId);
        if (!cur || rec.sessionDate > cur) lastSessionByResident.set(rec.residentId, rec.sessionDate);
      }

      const rows: ResidentRow[] = residents.slice(0, 6).map((r) => {
        const lastRec = lastSessionByResident.get(r.residentId);
        const last =
          lastRec != null
            ? formatDisplayDate(lastRec)
            : formatDisplayDate(r.dateOfAdmission);
        return {
          id: r.internalCode || r.caseControlNo || `R-${r.residentId}`,
          safehouse: houseById.get(r.safehouseId),
          status: mapRiskToStatus(r.currentRiskLevel),
          lastSession: last,
        };
      });
      setResidentsOverview(rows);

      const activeTotal = activePaged.total ?? residents.length;

      // Donations by calendar month (last 6 complete months + current)
      const months: DonationMonth[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = monthKey(d);
        const monthDonations = donations.filter((x) => monthKey(parseDateOnly(x.donationDate)) === key);
        const total = monthDonations.reduce((s, x) => s + donationMoneyValue(x), 0);
        const donorIds = new Set(monthDonations.map((x) => x.supporterId));
        const priorMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
        const priorKey = monthKey(priorMonth);
        const priorDonations = donations.filter((x) => monthKey(parseDateOnly(x.donationDate)) === priorKey);
        const priorDonorIds = new Set(priorDonations.map((x) => x.supporterId));
        let returningDonors = 0;
        for (const id of donorIds) {
          if (priorDonorIds.has(id)) returningDonors++;
        }
        const newDonors = donorIds.size - returningDonors;
        months.push({
          month: monthLabel(d),
          total: Math.round(total * 100) / 100,
          newDonors: Math.max(0, newDonors),
          returningDonors,
        });
      }
      setDonationActivity(months);
      setDonationSpark(months.map((m) => m.total));

      const curMonthKey = monthKey(today);
      const priorMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const priorMonthKey = monthKey(priorMonthDate);

      const sumMonth = (key: string) =>
        donations
          .filter((x) => monthKey(parseDateOnly(x.donationDate)) === key)
          .reduce((s, x) => s + donationMoneyValue(x), 0);

      const curSum = sumMonth(curMonthKey);
      const priorSum = sumMonth(priorMonthKey);
      let donationTrend: DashboardMetric["trend"] = "neutral";
      let donationTrendLabel = "No prior month to compare";
      if (priorSum > 0) {
        const pct = ((curSum - priorSum) / priorSum) * 100;
        donationTrend = pct >= 0 ? "up" : "down";
        donationTrendLabel = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs prior month`;
      } else if (curSum > 0) {
        donationTrendLabel = "First gifts this period";
      }

      // Resident admissions per month (last 6) for sparkline
      const admSpark: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const count = residents.filter((r) => {
          const ad = parseDateOnly(r.dateOfAdmission);
          return ad >= d && ad < next;
        }).length;
        admSpark.push(count);
      }
      setResidentSpark(admSpark);

      setPrimaryMetric({
        key: "residents",
        label: "Active residents",
        value: String(activeTotal),
        trendLabel: "Current active census",
        trend: "neutral",
        icon: "users",
      });

      const supporterIdsWithDonation = new Set(donations.map((d) => d.supporterId));
      const countBySup = new Map<number, number>();
      for (const d of donations) {
        countBySup.set(d.supporterId, (countBySup.get(d.supporterId) ?? 0) + 1);
      }
      const multiDonorIds = new Set<number>();
      for (const [id, c] of countBySup) {
        if (c >= 2) multiDonorIds.add(id);
      }
      const donorDen = supporterIdsWithDonation.size;
      const retPct = donorDen > 0 ? Math.round((multiDonorIds.size / donorDen) * 100) : null;

      setSupportingMetrics([
        {
          key: "donations",
          label: "Donations this month",
          value: formatMoneyCompact(curSum),
          trendLabel: donationTrendLabel,
          trend: donationTrend,
          icon: "heart",
        },
        {
          key: "retention",
          label: "Donor retention",
          value: retPct !== null ? `${retPct}%` : "—",
          trendLabel: donorDen > 0 ? `${multiDonorIds.size} repeat of ${donorDen} donors` : "No donations yet",
          trend: "neutral",
          icon: "percent",
        },
        {
          key: "conferences",
          label: "Upcoming visits (14 days)",
          value: String(upcomingVisits),
          trendLabel: "Home visitations on the calendar",
          trend: upcomingVisits > 0 ? "up" : "neutral",
          icon: "calendar",
        },
      ]);

      const withReint = residents.filter(
        (r) => r.reintegrationStatus && r.reintegrationStatus !== "Not Started"
      );
      const completed = withReint.filter((r) => r.reintegrationStatus === "Completed").length;
      const ratePct =
        withReint.length > 0 ? Math.round((completed / withReint.length) * 100) : null;
      setReintegrationMetric({
        key: "reintegration",
        label: "Reintegration success rate",
        value: ratePct !== null ? `${ratePct}%` : "—",
        trendLabel:
          withReint.length > 0
            ? `${completed} completed of ${withReint.length} with reintegration activity`
            : "No reintegration activity recorded",
        trend: "neutral",
        icon: "percent",
      });

      setLiveContext({
        residentCount: activeTotal,
        safehouseCount: safehouses?.length ?? 0,
        donationMonthLabel: formatMoneyCompact(curSum),
        donationTrendPhrase:
          priorSum > 0
            ? curSum >= priorSum
              ? "trending at or above last month"
              : "softening versus last month"
            : "building your baseline",
        retentionLabel: retPct !== null ? `${retPct}%` : "—",
      });

      const thisWeekEnd = new Date(today);
      thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
      const visitsThisWeek = visitations.filter((v) => {
        const vd = parseDateOnly(v.visitDate);
        return vd >= today && vd <= thisWeekEnd;
      }).length;

      setPriorityCallouts([
        {
          id: "p1",
          headline:
            highRiskCount > 0
              ? `${highRiskCount} active ${highRiskCount === 1 ? "case is" : "cases are"} High or Critical risk`
              : "No High/Critical risk cases in active census",
          supporting:
            highRiskCount > 0
              ? "Prioritize safety planning and staffing touchpoints for these residents."
              : "Continue routine monitoring for Medium and Low risk cases.",
          align: "left",
        },
        {
          id: "p2",
          headline:
            visitsThisWeek > 0
              ? `${visitsThisWeek} home visitation${visitsThisWeek === 1 ? "" : "s"} in the next 7 days`
              : "No home visitations scheduled in the next 7 days",
          supporting:
            visitsThisWeek > 0
              ? "Confirm logistics and resident notifications for field visits."
              : "Consider scheduling follow-ups where case plans require them.",
          align: "right",
        },
        {
          id: "p3",
          headline:
            curSum >= priorSum
              ? "Donation volume is at or above the prior month"
              : "Donation volume is below the prior month",
          supporting:
            donations.length > 0
              ? `${donations.length} donation record${donations.length === 1 ? "" : "s"} on file — keep nurturing recurring supporters.`
              : "Log donations to see trends here.",
          align: "left",
        },
      ]);

      const lastInsight =
        months.length >= 2
          ? `Last month (${months[months.length - 2].month}) total was ${formatMoneyCompact(months[months.length - 2].total)} vs ${formatMoneyCompact(months[months.length - 1].total)} in ${months[months.length - 1].month}.`
          : "";
      setDonationInsight(
        lastInsight ||
          (donations.length === 0
            ? "No donations recorded yet — totals will appear as gifts are logged."
            : "Totals combine monetary gifts and estimated in-kind value by donation month.")
      );

      type Scored = { ts: number; item: AttentionItem };
      const pool: Scored[] = [];
      for (const rec of recordings) {
        if (rec.concernsFlagged) {
          pool.push({
            ts: parseDateOnly(rec.sessionDate).getTime(),
            item: {
              id: `rec-${rec.recordingId}`,
              title: "Process recording flagged",
              detail: `Resident #${rec.residentId} — ${rec.sessionType} on ${formatDisplayDate(rec.sessionDate)}`,
              severity: "review",
            },
          });
        }
      }
      for (const v of visitations) {
        if (v.followUpNeeded) {
          pool.push({
            ts: parseDateOnly(v.visitDate).getTime(),
            item: {
              id: `vis-${v.visitationId}`,
              title: "Follow-up needed — home visit",
              detail: `${v.visitType} on ${formatDisplayDate(v.visitDate)} (resident #${v.residentId})`,
              severity: "soon",
            },
          });
        }
      }
      for (const d of donations) {
        pool.push({
          ts: parseDateOnly(d.donationDate).getTime(),
          item: {
            id: `don-${d.donationId}`,
            title: "Donation recorded",
            detail: `${formatMoneyCompact(donationMoneyValue(d))} — ${d.donationType} on ${formatDisplayDate(d.donationDate)}`,
            severity: "review",
          },
        });
      }
      pool.sort((a, b) => b.ts - a.ts);
      const items = pool.slice(0, 5).map((x) => x.item);
      setActivityItems(
        items.length > 0
          ? items
          : [
              {
                id: "empty",
                title: "No recent activity",
                detail: "Add process recordings, visitations, or donations to see them here.",
                severity: "review",
              },
            ]
      );

      setInsights([
        highRiskCount > 0
          ? `${highRiskCount} active resident${highRiskCount === 1 ? "" : "s"} ${highRiskCount === 1 ? "has" : "have"} High or Critical current risk.`
          : "No active residents are currently marked High or Critical risk.",
        donations.length > 0
          ? `${formatMoneyCompact(donations.reduce((s, x) => s + donationMoneyValue(x), 0))} total value across ${donations.length} logged donation${donations.length === 1 ? "" : "s"}.`
          : "No donations logged yet — financial insights will populate as gifts are recorded.",
      ]);
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
            Could not load live data: {loadError}. Showing empty placeholders. Check that the API is running and you are
            signed in as an admin.
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

        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-[hsl(350,16%,92%)]/80 bg-white/40 px-6 py-16">
            <p className="font-display text-lg font-semibold text-foreground">Loading dashboard…</p>
            <p className="font-body text-sm text-muted-foreground">Fetching residents, donations, and visitations.</p>
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
              <DonationChart data={donationActivity.length ? donationActivity : [{ month: "—", total: 0, newDonors: 0, returningDonors: 0 }]} insight={donationInsight} />
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
