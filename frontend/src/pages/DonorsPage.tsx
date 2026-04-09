import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { AdminLayout } from "@/components/AdminLayout";
import { DASHBOARD_CONTENT_MAX_WIDTH } from "@/components/dashboard-shell";
import { StaffPageShell } from "@/components/staff/StaffPageShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KpiStatCard } from "@/components/KpiStatCard";
import {
  AddContributionDialog,
  EditSupporterModal,
  FilterBar,
  ImpactOverview,
  SlideOverPanel,
  SupporterCard,
  SupporterProfileSheet,
  SupporterRow,
} from "@/components/donors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { API_PREFIX } from "@/lib/apiBase";
import type {
  ApiSupporterRow,
  ContributionBreakdown,
  DonorsDashboardResponse,
  FeedEntry,
  Supporter,
  SupporterKind,
  SupporterStatus,
  TimelineEntry,
} from "@/lib/donorsTypes";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Gift, HeartHandshake, Plus, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const DIRECTORY_PAGE_SIZES = [10, 25, 50] as const;

function visiblePageNumbers(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(totalPages);
  for (let d = -1; d <= 1; d++) {
    const p = current + d;
    if (p >= 1 && p <= totalPages) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}
import { toast } from "sonner";

const EMPTY_METRICS: DonorsDashboardResponse["metrics"] = {
  totalSupporters: 0,
  activeDonors: 0,
  monthlyContributions: 0,
  volunteerHoursLogged: 0,
  inKindValue: 0,
};

function emptyBreakdown(): ContributionBreakdown {
  return { monetary: 0, timeHours: 0, skillsSessions: 0, inKindValue: 0, socialActions: 0 };
}

/** Backend may emit camelCase or PascalCase; partial payloads must not break React state. */
function normalizeDonorsPayload(raw: unknown): DonorsDashboardResponse {
  const r = raw as Record<string, unknown>;
  const supporters = (r.supporters ?? r.Supporters) as DonorsDashboardResponse["supporters"] | undefined;
  const feed = (r.feed ?? r.Feed) as FeedEntry[] | undefined;
  const metrics = (r.metrics ?? r.Metrics) as DonorsDashboardResponse["metrics"] | undefined;
  const allocationByDestination = (r.allocationByDestination ?? r.AllocationByDestination) as
    | DonorsDashboardResponse["allocationByDestination"]
    | undefined;
  return {
    supporters: Array.isArray(supporters) ? supporters : [],
    feed: Array.isArray(feed) ? feed : [],
    metrics: metrics ?? EMPTY_METRICS,
    allocationByDestination: Array.isArray(allocationByDestination) ? allocationByDestination : [],
  };
}

function mapSupporterRow(s: ApiSupporterRow): Supporter {
  const br = s.breakdown ?? emptyBreakdown();
  const breakdown: ContributionBreakdown = {
    monetary: Number(br.monetary) || 0,
    timeHours: Number(br.timeHours) || 0,
    skillsSessions: Number(br.skillsSessions) || 0,
    inKindValue: Number(br.inKindValue) || 0,
    socialActions: Number(br.socialActions) || 0,
  };
  return {
    id: String(s.id ?? ""),
    name: s.name ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    kind: (s.kind as SupporterKind) ?? "Monetary",
    status: (s.status as SupporterStatus) ?? "Inactive",
    totalContributionsValue: Number(s.totalContributionsValue) || 0,
    lastActivity: s.lastActivity ?? "",
    notes: s.notes ?? "",
    breakdown,
  };
}

function donorInitials(name: string | undefined) {
  const n = (name ?? "").trim();
  if (!n) return "••";
  return n
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const CONTRIBUTION_TIMELINE_MAX = 10;

function feedEntryTimestampMs(entry: FeedEntry): number {
  const raw = entry.createdAt ?? entry.at;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

const DonorsPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [donorMetrics, setDonorMetrics] = useState<DonorsDashboardResponse["metrics"]>(EMPTY_METRICS);
  const [allocationByDestination, setAllocationByDestination] = useState<DonorsDashboardResponse["allocationByDestination"]>(
    []
  );
  const [safehouseNames, setSafehouseNames] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [dashRaw, housesRaw] = await Promise.all([
        apiFetchJson<unknown>(`${API_PREFIX}/donors`),
        apiFetchJson<unknown>(`${API_PREFIX}/safehouses`),
      ]);
      const dash = normalizeDonorsPayload(dashRaw);
      const mapped: Supporter[] = dash.supporters.map(mapSupporterRow);
      setSupporters(mapped);
      setNotesById(Object.fromEntries(mapped.map((x) => [x.id, x.notes])));
      setFeed(dash.feed);
      setDonorMetrics({
        ...EMPTY_METRICS,
        ...dash.metrics,
        totalSupporters: Number(dash.metrics.totalSupporters) || 0,
        activeDonors: Number(dash.metrics.activeDonors) || 0,
        monthlyContributions: Number(dash.metrics.monthlyContributions) || 0,
        volunteerHoursLogged: Number(dash.metrics.volunteerHoursLogged) || 0,
        inKindValue: Number(dash.metrics.inKindValue) || 0,
      });
      setAllocationByDestination(dash.allocationByDestination);
      const houseList = Array.isArray(housesRaw) ? housesRaw : [];
      setSafehouseNames(
        houseList
          .map((h: Record<string, unknown>) => {
            const n = h.name ?? h.Name;
            return typeof n === "string" ? n : "";
          })
          .filter(Boolean)
      );
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : "Failed to load donors.");
      setSupporters([]);
      setFeed([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SupporterKind | "All">("All");
  const [statusFilter, setStatusFilter] = useState<SupporterStatus | "All">("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addSupporterOpen, setAddSupporterOpen] = useState(false);
  const [newSupporterName, setNewSupporterName] = useState("");
  const [newSupporterType, setNewSupporterType] = useState("MonetaryDonor");
  const [newSupporterEmail, setNewSupporterEmail] = useState("");
  const [newSupporterStatus, setNewSupporterStatus] = useState("Active");
  const [supporterSaving, setSupporterSaving] = useState(false);
  const [deleteSupporterTarget, setDeleteSupporterTarget] = useState<Supporter | null>(null);
  const [editSupporterTarget, setEditSupporterTarget] = useState<Supporter | null>(null);

  const selected = useMemo(() => supporters.find((s) => s.id === selectedId) ?? null, [supporters, selectedId]);

  /** Newest first, capped for the dashboard “Contribution timeline” only (full `feed` stays for profile activity). */
  const contributionTimelineFeed = useMemo(() => {
    return [...feed]
      .sort((a, b) => {
        const db = feedEntryTimestampMs(b);
        const da = feedEntryTimestampMs(a);
        if (db !== da) return db - da;
        return String(b.id).localeCompare(String(a.id));
      })
      .slice(0, CONTRIBUTION_TIMELINE_MAX);
  }, [feed]);

  const timelineForSelected = useMemo((): TimelineEntry[] => {
    if (!selected) return [];
    return feed
      .filter((f) => f.supporterName === selected.name)
      .map((f, i) => ({
        id: `${f.id}-${i}`,
        supporterId: selected.id,
        at: f.at,
        kind: f.kind,
        title: f.kind,
        detail: f.description,
      }));
  }, [feed, selected]);

  const topDonors = useMemo(() => {
    return [...supporters].sort((a, b) => b.totalContributionsValue - a.totalContributionsValue).slice(0, 3);
  }, [supporters]);

  const filtered = useMemo(() => {
    return supporters.filter((s) => {
      const q = search.toLowerCase().trim();
      const digitQuery = search.replace(/\D/g, "");
      const phoneMatch =
        digitQuery.length > 0 && (s.phone ?? "").replace(/\D/g, "").includes(digitQuery);
      const matchSearch =
        !q ||
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        phoneMatch;
      const matchType = typeFilter === "All" || s.kind === typeFilter;
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [supporters, search, typeFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const paginatedFiltered = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, pageSize]);

  const pageItems = useMemo(() => visiblePageNumbers(safePage, pageCount), [safePage, pageCount]);

  const openProfile = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  const updateSupporter = useCallback(async (supporterId: string, patch: Record<string, unknown>) => {
    const id = Number(supporterId);
    if (!Number.isFinite(id)) throw new Error("Invalid supporter ID.");
    const existing = await apiFetchJson<Record<string, unknown>>(`${API_PREFIX}/supporters/${id}`);
    const body = { ...existing, ...patch, supporterId: id };
    const res = await apiFetch(`${API_PREFIX}/supporters/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
  }, []);

  const handleSaveSupporterDisplayName = useCallback(
    async (displayName: string) => {
      if (!editSupporterTarget) return;
      const id = editSupporterTarget.id;
      const previousName = editSupporterTarget.name;
      setSupporters((prev) => prev.map((s) => (s.id === id ? { ...s, name: displayName } : s)));
      try {
        await updateSupporter(id, { displayName });
        toast.success("Display name updated");
        void load();
      } catch (e) {
        console.error(e);
        setSupporters((prev) => prev.map((s) => (s.id === id ? { ...s, name: previousName } : s)));
        throw e instanceof Error ? e : new Error("Failed to update supporter.");
      }
    },
    [editSupporterTarget, load, updateSupporter],
  );

  const supporterDeleteDetailLines = useMemo(() => {
    if (!deleteSupporterTarget) return undefined;
    return [
      { label: "Supporter", value: deleteSupporterTarget.name },
      { label: "ID", value: deleteSupporterTarget.id },
    ];
  }, [deleteSupporterTarget]);

  const confirmDeleteSupporter = async (): Promise<boolean> => {
    if (!deleteSupporterTarget) return false;
    const supporter = deleteSupporterTarget;
    try {
      const res = await apiFetch(`${API_PREFIX}/supporters/${supporter.id}?confirm=true`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setSheetOpen(false);
      toast.success("Supporter deleted.");
      await load();
      return true;
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete supporter.");
      return false;
    }
  };

  const handleMarkInactive = async () => {
    if (!selected) return;
    try {
      await updateSupporter(selected.id, { status: "Inactive" });
      toast.success("Supporter marked inactive.");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update supporter status.");
    }
  };

  const handleAddSupporter = () => {
    setNewSupporterName("");
    setNewSupporterType("MonetaryDonor");
    setNewSupporterEmail("");
    setNewSupporterStatus("Active");
    setAddSupporterOpen(true);
  };

  const handleSaveSupporter = async () => {
    if (!newSupporterName.trim()) {
      toast.error("Display name is required.");
      return;
    }
    setSupporterSaving(true);
    try {
      const body = {
        displayName: newSupporterName.trim(),
        supporterType: newSupporterType,
        email: newSupporterEmail.trim() || null,
        status: newSupporterStatus,
        relationshipType: "Local",
      };
      const res = await apiFetch(`${API_PREFIX}/supporters`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Supporter added.");
      setAddSupporterOpen(false);
      void load();
    } catch (e) {
      toast.error("Failed to add supporter: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setSupporterSaving(false);
    }
  };

  return (
    <AdminLayout contentClassName={DASHBOARD_CONTENT_MAX_WIDTH}>
      <StaffPageShell
        title="Donors & Contributions"
        description="Manage supporters and track impact across programs."
        actions={
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
            <Button
              type="button"
              onClick={handleAddSupporter}
              className="relative h-12 overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-r from-[hsl(340_44%_68%)] via-[hsl(350_42%_72%)] to-[hsl(10_46%_58%)] px-6 font-body font-semibold text-white shadow-[0_8px_32px_rgba(190,100,130,0.35)] transition-shadow duration-300 hover:shadow-[0_14px_44px_rgba(190,100,130,0.45)]"
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent opacity-90" />
              <span className="relative z-[1] flex items-center">
                <Plus className="mr-2 h-4 w-4" strokeWidth={2.25} />
                Add supporter
              </span>
            </Button>
          </motion.div>
        }
      >
        {loadError ? (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

          {/* Metrics */}
          {loading ? (
            <div className="mb-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className={cn("h-[132px] rounded-[1.15rem] bg-white/50", i === 2 && "xl:col-span-2")} />
              ))}
            </div>
          ) : (
            <section className="mb-12 xl:mb-16">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
                <KpiStatCard
                  variant="glass"
                  tone="rose"
                  motionDelay={0}
                  label="Total supporters"
                  value={donorMetrics.totalSupporters}
                  animateTo={donorMetrics.totalSupporters}
                  formatAnimated={(n) => Math.round(n).toLocaleString()}
                  icon={Users}
                  className="xl:col-span-1"
                />
                <KpiStatCard
                  variant="glass"
                  tone="blush"
                  motionDelay={0.06}
                  label="Active donors"
                  value={donorMetrics.activeDonors}
                  animateTo={donorMetrics.activeDonors}
                  formatAnimated={(n) => Math.round(n).toLocaleString()}
                  icon={HeartHandshake}
                  className="xl:col-span-1"
                />
                <KpiStatCard
                  variant="glass"
                  tone="featured"
                  featured
                  motionDelay={0.11}
                  label="Monthly contributions"
                  value={`$${donorMetrics.monthlyContributions.toLocaleString()}`}
                  animateTo={donorMetrics.monthlyContributions}
                  formatAnimated={(n) => `$${Math.round(n).toLocaleString()}`}
                  icon={TrendingUp}
                  className="sm:col-span-2 xl:col-span-2"
                />
                <KpiStatCard
                  variant="glass"
                  tone="sage"
                  motionDelay={0.16}
                  label="Volunteer hours logged"
                  value={donorMetrics.volunteerHoursLogged}
                  animateTo={donorMetrics.volunteerHoursLogged}
                  formatAnimated={(n) => `${Math.round(n).toLocaleString()} hrs`}
                  icon={Clock}
                  className="xl:col-span-1"
                />
                <KpiStatCard
                  variant="glass"
                  tone="gold"
                  motionDelay={0.21}
                  label="In-kind value"
                  value={`$${donorMetrics.inKindValue.toLocaleString()}`}
                  animateTo={donorMetrics.inKindValue}
                  formatAnimated={(n) => `$${Math.round(n).toLocaleString()}`}
                  icon={Gift}
                  className="xl:col-span-1"
                />
              </div>
            </section>
          )}

          {!loading && (
            <section className="mb-12 mt-2">
              <div className="mb-8">
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Highlights
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                  Top donors
                </h2>
                <p className="mt-2 font-body text-sm text-muted-foreground">By lifetime contribution value</p>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {topDonors.map((s, i) => (
                  <motion.button
                    key={s.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ y: -3 }}
                    onClick={() => openProfile(s.id)}
                    className="rounded-[1.15rem] border border-white/50 bg-white/55 p-6 text-left shadow-[0_6px_32px_rgba(45,35,48,0.06)] backdrop-blur-md transition-shadow hover:shadow-[0_14px_44px_rgba(45,35,48,0.1)] dark:border-white/10 dark:bg-white/[0.07]"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border border-white/70 shadow-sm dark:border-white/15">
                        <AvatarFallback className="bg-gradient-to-br from-[hsl(340_45%_88%)] to-[hsl(36_35%_90%)] font-display text-sm font-semibold text-foreground/85">
                          {donorInitials(s.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-semibold text-foreground">{s.name}</p>
                        <span className="mt-1 inline-flex rounded-full border border-[hsl(340_30%_88%)]/90 bg-white/50 px-2 py-0.5 font-body text-[10px] font-semibold text-[hsl(340_32%_32%)] dark:border-white/12 dark:bg-white/10 dark:text-[hsl(340_35%_88%)]">
                          {s.kind}
                        </span>
                        <p className="mt-3 font-display text-xl font-bold tabular-nums text-foreground">
                          ${s.totalContributionsValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* Impact overview — timeline + allocation */}
          {!loading && <ImpactOverview feed={contributionTimelineFeed} allocation={allocationByDestination} />}

          {/* Directory */}
          <section className="mb-8 mt-6">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Community
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                  Supporter directory
                </h2>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "person" : "people"} match your filters
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setAddOpen(true)}
                variant="ghost"
                className="h-12 self-start rounded-2xl border border-white/50 bg-white/50 px-5 font-body font-medium text-foreground/85 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.07]"
              >
                <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
                Log contribution
              </Button>
            </div>

            {!loading && (
              <div className="mb-8">
                <FilterBar
                  search={search}
                  onSearchChange={setSearch}
                  typeFilter={typeFilter}
                  onTypeChange={setTypeFilter}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </div>
            )}

            <div className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[84px] rounded-[1.15rem] bg-white/40" />
                  ))}
                </div>
              ) : viewMode === "table" ? (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {paginatedFiltered.map((s, i) => (
                      <SupporterRow
                        key={s.id}
                        index={i}
                        supporter={s}
                        onOpen={() => openProfile(s.id)}
                        onEdit={() => setEditSupporterTarget(s)}
                        onDelete={() => setDeleteSupporterTarget(s)}
                      />
                    ))}
                  </AnimatePresence>
                  {filtered.length === 0 && (
                    <p className="py-24 text-center font-body text-sm text-muted-foreground">No supporters match these filters.</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedFiltered.map((s) => (
                    <SupporterCard
                      key={s.id}
                      supporter={s}
                      onOpen={() => openProfile(s.id)}
                      onEdit={() => setEditSupporterTarget(s)}
                      onDelete={() => setDeleteSupporterTarget(s)}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <p className="col-span-full py-24 text-center font-body text-sm text-muted-foreground">
                      No supporters match these filters.
                    </p>
                  )}
                </div>
              )}
              {!loading && filtered.length > 0 ? (
                <div className="mt-8 flex w-full flex-col gap-4 border-t border-white/35 pt-6 dark:border-white/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 font-body text-xs text-muted-foreground">
                    <span className="shrink-0 font-medium">Rows per page</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="h-9 rounded-xl border border-border/60 bg-white/70 px-3 py-1.5 font-body text-sm text-foreground shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] focus:outline-none focus:ring-2 focus:ring-[hsl(340_40%_60%)]/30 dark:border-white/12 dark:bg-white/[0.08]"
                    >
                      {DIRECTORY_PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-white/50 bg-white/50 px-3 font-body dark:border-white/10 dark:bg-white/[0.07]"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex flex-wrap items-center gap-1">
                      {pageItems.map((item, idx) =>
                        item === "ellipsis" ? (
                          <span
                            key={`e-${idx}`}
                            className="flex h-9 min-w-[2.25rem] items-center justify-center font-body text-sm text-muted-foreground"
                            aria-hidden
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={item}
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-9 min-w-[2.25rem] rounded-xl border font-body text-sm tabular-nums",
                              item === safePage
                                ? "border-[hsl(340_35%_75%)]/50 bg-white text-foreground shadow-[0_4px_16px_rgba(200,130,150,0.12)] dark:border-white/20 dark:bg-white/15"
                                : "border-white/50 bg-white/50 dark:border-white/10 dark:bg-white/[0.07]",
                            )}
                            onClick={() => setPage(item)}
                          >
                            {item}
                          </Button>
                        ),
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-white/50 bg-white/50 px-3 font-body dark:border-white/10 dark:bg-white/[0.07]"
                      disabled={safePage >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <p className="font-body text-xs text-muted-foreground sm:text-right">
                    Page {safePage} of {pageCount}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
      </StaffPageShell>

        <motion.button
          type="button"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.55 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setAddOpen(true)}
          className="fixed bottom-8 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(340_42%_68%)] to-[hsl(10_46%_56%)] text-white shadow-[0_14px_44px_rgba(190,100,130,0.4)] lg:hidden"
          aria-label="Log contribution"
        >
          <Plus className="h-6 w-6" strokeWidth={2} />
        </motion.button>

      <SlideOverPanel open={sheetOpen} onOpenChange={setSheetOpen}>
        {selected && (
          <SupporterProfileSheet
            supporter={selected}
            timeline={timelineForSelected}
            notes={notesById[selected.id] ?? ""}
            onNotesChange={(v) => setNotesById((prev) => ({ ...prev, [selected.id]: v }))}
            onMarkInactive={handleMarkInactive}
            onEdit={() => setEditSupporterTarget(selected)}
            onDelete={() => selected && setDeleteSupporterTarget(selected)}
          />
        )}
      </SlideOverPanel>

      <AddContributionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        supporterOptions={supporters.map((s) => ({ id: s.id, name: s.name }))}
        safehouses={safehouseNames.length ? safehouseNames : ["—"]}
        onSubmit={async ({ supporterId, kind, amount, hours, description }) => {
          const kindMap: Record<string, string> = {
            monetary: "Monetary",
            volunteer: "Time",
            skills: "Skills",
            "in-kind": "InKind",
            social: "SocialMedia",
          };
          const body: Record<string, unknown> = {
            supporterId: parseInt(supporterId, 10),
            donationType: kindMap[kind] ?? "Monetary",
            donationDate: new Date().toISOString().slice(0, 10),
            channelSource: "Direct",
            notes: description.trim() || null,
          };
          if (kind === "monetary") {
            body.amount = parseFloat(amount) || 0;
            body.currencyCode = "USD";
          } else if (kind === "volunteer") {
            body.estimatedValue = parseFloat(hours) || null;
            body.impactUnit = "hours";
          } else if (amount) {
            body.estimatedValue = parseFloat(amount) || null;
          }
          try {
            const res = await apiFetch(`${API_PREFIX}/donations`, {
              method: "POST",
              body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Contribution recorded.");
            void load();
          } catch (e) {
            toast.error("Failed to log contribution: " + (e instanceof Error ? e.message : "Unknown error"));
            throw e;
          }
        }}
      />
      {/* Add Supporter Dialog */}
      {addSupporterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setAddSupporterOpen(false)}>
          <div className="w-full max-w-sm rounded-[1.35rem] border-0 bg-[hsl(36_33%_98%)] p-0 shadow-[0_24px_80px_rgba(45,35,48,0.18)] dark:bg-[hsl(213_45%_10%)]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-black/5 px-6 pb-4 pt-6 dark:border-white/5">
              <p className="font-display text-xl font-semibold tracking-tight text-foreground">Add supporter</p>
              <p className="mt-1 font-body text-sm text-muted-foreground">Create a new supporter record.</p>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <label className="font-body text-xs font-medium text-muted-foreground">Display name *</label>
                <input
                  value={newSupporterName}
                  onChange={(e) => setNewSupporterName(e.target.value)}
                  placeholder="Full name or organization"
                  className="w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[hsl(340_40%_60%)]/30 dark:bg-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-body text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    value={newSupporterType}
                    onChange={(e) => setNewSupporterType(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(340_40%_60%)]/30 dark:bg-white/10"
                  >
                    <option value="MonetaryDonor">Monetary Donor</option>
                    <option value="InKindDonor">In-Kind Donor</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="SkillsContributor">Skills Contributor</option>
                    <option value="SocialMediaAdvocate">Social Media Advocate</option>
                    <option value="PartnerOrganization">Partner Organization</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-body text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={newSupporterStatus}
                    onChange={(e) => setNewSupporterStatus(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(340_40%_60%)]/30 dark:bg-white/10"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-body text-xs font-medium text-muted-foreground">Email (optional)</label>
                <input
                  type="email"
                  value={newSupporterEmail}
                  onChange={(e) => setNewSupporterEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[hsl(340_40%_60%)]/30 dark:bg-white/10"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-black/5 px-6 py-4 dark:border-white/5">
              <button
                type="button"
                onClick={() => setAddSupporterOpen(false)}
                className="rounded-xl px-4 py-2 font-body text-sm text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={supporterSaving}
                onClick={() => void handleSaveSupporter()}
                className="rounded-xl bg-gradient-to-r from-[hsl(340_42%_68%)] to-[hsl(10_46%_56%)] px-5 py-2 font-body text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {supporterSaving ? "Saving…" : "Add supporter"}
              </button>
            </div>
          </div>
        </div>
      )}

      <EditSupporterModal
        open={editSupporterTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditSupporterTarget(null);
        }}
        supporter={editSupporterTarget}
        onSave={handleSaveSupporterDisplayName}
      />

      <ConfirmDeleteModal
        open={deleteSupporterTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSupporterTarget(null);
        }}
        title="Delete supporter?"
        detailLines={supporterDeleteDetailLines}
        onConfirm={confirmDeleteSupporter}
      />
    </AdminLayout>
  );
};

export default DonorsPage;
