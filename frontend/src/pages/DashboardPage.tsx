import { AdminLayout } from "@/components/AdminLayout";
import { DASHBOARD_CONTENT_MAX_WIDTH } from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { SkeletonCard } from "@/components/SkeletonLoaders";
import { API_PREFIX } from "@/lib/apiBase";
import { apiFetchJson } from "@/lib/apiFetch";
import { useCallback, useEffect, useMemo, useState } from "react";

type ResidentItem = {
  residentId: number;
  internalCode: string;
  caseControlNo: string;
  caseStatus: string;
  currentRiskLevel: string;
  dateOfAdmission: string;
  createdAt?: string;
};

type DonationItem = {
  supporterId: number | null;
  donationDate: string;
  donationType: string;
  amount: number | null;
  estimatedValue: number | null;
};

type VisitationItem = {
  id: number;
  residentId: number;
  residentName: string;
  date: string;
  status: string;
};

type PagedResponse<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

type SummaryCard = {
  label: string;
  value: string;
  detail: string;
};

const STALE_DONOR_DAYS = 60;

function asDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function differenceInDays(later: Date, earlier: Date): number {
  const ms = later.getTime() - earlier.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function isWithinNext7Days(value: string): boolean {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const date = asDate(value);
  return date >= start && date <= end;
}

function isWithinLast7Days(value: string): boolean {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - 7);
  const date = asDate(value);
  return date >= start;
}

function isThisMonth(value: string): boolean {
  const now = new Date();
  const date = asDate(value);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function donationValue(d: DonationItem): number {
  if (d.donationType === "Monetary") return d.amount ?? 0;
  if (d.donationType === "InKind") return d.estimatedValue ?? d.amount ?? 0;
  return d.amount ?? d.estimatedValue ?? 0;
}

async function fetchAllPages<T>(path: string, pageSize = 250): Promise<T[]> {
  let page = 1;
  let total = 0;
  const rows: T[] = [];

  do {
    const data = await apiFetchJson<PagedResponse<T>>(`${path}?page=${page}&pageSize=${pageSize}`, { timeoutMs: 20000 });
    rows.push(...(data.items ?? []));
    total = data.total ?? rows.length;
    if ((data.items ?? []).length === 0) break;
    page += 1;
  } while (rows.length < total);

  return rows;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} className="rounded-xl p-5 shadow-sm" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded-md bg-muted/60" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 rounded-md bg-muted/60" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 shadow-sm" role="alert">
      <p className="font-display text-lg font-semibold text-destructive">Unable to load overview</p>
      <p className="mt-2 font-body text-sm text-destructive/90">{message}</p>
    </div>
  );
}

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [visits, setVisits] = useState<VisitationItem[]>([]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [residentRows, donationRows, visitRows] = await Promise.all([
        fetchAllPages<ResidentItem>(`${API_PREFIX}/residents`),
        fetchAllPages<DonationItem>(`${API_PREFIX}/donations`),
        fetchAllPages<VisitationItem>(`${API_PREFIX}/visitations`),
      ]);
      setResidents(residentRows);
      setDonations(donationRows);
      setVisits(visitRows);
    } catch (e) {
      console.error("Dashboard API error:", e);
      setError(e instanceof Error ? e.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const derived = useMemo(() => {
    const activeResidents = residents.filter((r) => r.caseStatus === "Active");
    const highRiskResidents = activeResidents.filter((r) =>
      ["HIGH", "CRITICAL"].includes((r.currentRiskLevel ?? "").toUpperCase())
    );
    const upcomingVisits = visits.filter((v) => isWithinNext7Days(v.date));
    const openActionItems = visits.filter((v) => v.status === "Pending").length;
    const residentsAddedLast7 = residents.filter((r) => isWithinLast7Days(r.dateOfAdmission)).length;
    const donationsLast7 = donations.filter((d) => isWithinLast7Days(d.donationDate)).length;
    const visitsLast7 = visits.filter((v) => isWithinLast7Days(v.date)).length;

    const lastDonationBySupporter = new Map<number, Date>();
    donations.forEach((d) => {
      if (!d.supporterId) return;
      const donationDate = asDate(d.donationDate);
      const prev = lastDonationBySupporter.get(d.supporterId);
      if (!prev || donationDate > prev) {
        lastDonationBySupporter.set(d.supporterId, donationDate);
      }
    });
    const now = new Date();
    const atRiskDonors = Array.from(lastDonationBySupporter.values()).filter(
      (last) => differenceInDays(now, last) >= STALE_DONOR_DAYS
    ).length;

    const attentionResidents = highRiskResidents
      .map((r) => {
        const lastUpdatedAt = r.createdAt ? new Date(r.createdAt) : asDate(r.dateOfAdmission);
        return {
          key: `${r.residentId}`,
          idLabel: r.internalCode?.trim() || r.caseControlNo || `Resident #${r.residentId}`,
          risk: (r.currentRiskLevel || "Unknown").toUpperCase(),
          daysSinceUpdate: differenceInDays(now, lastUpdatedAt),
        };
      })
      .sort((a, b) => {
        const riskWeight = (risk: string) => (risk === "CRITICAL" ? 0 : risk === "HIGH" ? 1 : 2);
        const byRisk = riskWeight(a.risk) - riskWeight(b.risk);
        if (byRisk !== 0) return byRisk;
        return b.daysSinceUpdate - a.daysSinceUpdate;
      })
      .slice(0, 8);

    const totalThisMonth = donations
      .filter((d) => isThisMonth(d.donationDate))
      .reduce((sum, d) => sum + donationValue(d), 0);

    const insights: string[] = [];
    if (highRiskResidents.length > 0) {
      insights.push(`${highRiskResidents.length} residents require immediate attention.`);
    } else {
      insights.push("No high-risk residents.");
    }
    if (upcomingVisits.length === 0) {
      insights.push("No visits scheduled in the next 7 days.");
    }
    if (totalThisMonth === 0) {
      insights.push("No donation activity recorded this month.");
    }
    if (openActionItems > 0) {
      insights.push(`${openActionItems} action item${openActionItems === 1 ? "" : "s"} still open.`);
    }

    const cards: SummaryCard[] = [
      {
        label: "Residents At Risk",
        value: String(highRiskResidents.length),
        detail: highRiskResidents.length > 0 ? "High + Critical cases" : "No high-risk residents",
      },
      {
        label: "Upcoming Visits",
        value: String(upcomingVisits.length),
        detail: upcomingVisits.length > 0 ? "Due in next 7 days" : "No upcoming visits scheduled",
      },
      {
        label: "At-Risk Donors",
        value: String(atRiskDonors),
        detail: `No donation in ${STALE_DONOR_DAYS}+ days`,
      },
      {
        label: "Open Action Items",
        value: String(openActionItems),
        detail: openActionItems > 0 ? "Pending follow-ups" : "No open action items",
      },
      {
        label: "New Activity (7 days)",
        value: String(residentsAddedLast7 + donationsLast7 + visitsLast7),
        detail: `${residentsAddedLast7} residents, ${donationsLast7} donations, ${visitsLast7} visits`,
      },
    ];

    return { cards, attentionResidents, insights };
  }, [residents, donations, visits]);

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell title="Overview" description="Executive operational summary.">
        {loading ? <DashboardSkeleton /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}
        {!loading && !error ? (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {derived.cards.map((card) => (
                <article key={card.label} className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                  <p className="font-body text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">{card.label}</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-foreground">{card.value}</p>
                  <p className="mt-1 font-body text-sm text-muted-foreground">{card.detail}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">Residents Requiring Attention</h2>
                {derived.attentionResidents.length === 0 ? (
                  <p className="mt-4 font-body text-sm text-muted-foreground">No high-risk residents 🎉</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {derived.attentionResidents.map((resident) => (
                      <li
                        key={resident.key}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2"
                      >
                        <p className="font-body text-sm font-medium text-foreground">{resident.idLabel}</p>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              resident.risk === "CRITICAL"
                                ? "rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
                                : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
                            }
                          >
                            {resident.risk}
                          </span>
                          <span className="font-body text-xs text-muted-foreground">{resident.daysSinceUpdate}d since update</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">Operational Insights</h2>
                <ul className="mt-4 space-y-2">
                  {derived.insights.map((line) => (
                    <li key={line} className="rounded-lg border border-border/60 bg-background px-3 py-2 font-body text-sm text-foreground">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        ) : null}
      </StaffPageShell>
    </AdminLayout>
  );
};

export default DashboardPage;
