import { AdminLayout } from "@/components/AdminLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { StatCard } from "@/components/StatCard";
import {
  AddContributionDialog,
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
import { Clock, Download, Gift, HeartHandshake, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import watermarkSrc from "@/img/NorthStarLogo.png";

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

const DonorsPage = () => {
  usePageHeader("Donors & Contributions", "Supporter relationship management");

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

  const selected = useMemo(() => supporters.find((s) => s.id === selectedId) ?? null, [supporters, selectedId]);

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

  const handleEditSupporter = useCallback(async (supporter: Supporter) => {
    const displayName = window.prompt("Supporter display name", supporter.name)?.trim();
    if (!displayName) return;
    const email = window.prompt("Supporter email", supporter.email)?.trim() ?? supporter.email;
    try {
      await updateSupporter(supporter.id, { displayName, email: email || null });
      toast.success("Supporter updated.");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update supporter.");
    }
  }, [load, updateSupporter]);

  const handleDeleteSupporter = useCallback(async (supporter: Supporter) => {
    if (!window.confirm(`Delete ${supporter.name}? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`${API_PREFIX}/supporters/${supporter.id}?confirm=true`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setSheetOpen(false);
      toast.success("Supporter deleted.");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete supporter.");
    }
  }, [load]);

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

  const handleExport = () => {
    toast.success("Export queued", { description: "You will receive a CSV link when the export service is enabled." });
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
    <AdminLayout contentClassName="max-w-[min(100%,90rem)]">
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-16",
          "bg-gradient-to-b from-[hsl(36_36%_96%)] via-[hsl(350_32%_96%)] to-[hsl(340_28%_95%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
          "dark:from-[hsl(213_40%_9%)] dark:via-[hsl(213_35%_10%)] dark:to-[hsl(340_25%_9%)]"
        )}
      >
        {/* Radial hero glow */}
        <div
          className="pointer-events-none absolute -left-20 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,hsl(340_42%_88%)/0.45_0%,transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,hsl(340_35%_35%)/0.25_0%,transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,hsl(25_40%_88%)/0.35_0%,transparent_65%)] blur-3xl dark:opacity-40"
          aria-hidden
        />

        {/* Film grain */}
        <div className="donors-page-grain pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.4]" aria-hidden />

        {/* Logo watermark */}
        <img
          src={watermarkSrc}
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-0 top-8 h-56 w-auto max-w-[min(40%,320px)] opacity-[0.06] select-none sm:h-72 lg:right-6 lg:top-12"
        />

        <div className="relative z-[1]">
          {loadError && (
            <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
              {loadError}
            </p>
          )}
          {/* Hero */}
          <header className="relative mb-20 lg:mb-28">
            <div className="pointer-events-none absolute -left-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[hsl(340_45%_88%)]/20 blur-3xl dark:bg-[hsl(340_30%_40%)]/15" />

            <div className="relative flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
              <div className="max-w-2xl">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="mb-4 inline-flex items-center gap-2 font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/75"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(340_42%_58%)]" strokeWidth={1.5} />
                  Operations
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.04 }}
                  className="font-display text-[2.35rem] font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[2.85rem] lg:text-[3.15rem]"
                >
                  Donors & Contributions
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mt-6 max-w-lg font-body text-[1.05rem] font-normal leading-[1.65] text-muted-foreground/95 sm:text-lg"
                >
                  Manage supporters and track impact across programs.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.14 }}
                className="flex flex-wrap items-center gap-3"
              >
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                  <Button
                    type="button"
                    onClick={handleAddSupporter}
                    className="relative h-12 overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-r from-[hsl(340_44%_68%)] via-[hsl(350_42%_72%)] to-[hsl(10_46%_58%)] px-6 font-body font-semibold text-white shadow-[0_8px_32px_rgba(190,100,130,0.35)] transition-shadow duration-300 hover:shadow-[0_14px_44px_rgba(190,100,130,0.45)]"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent opacity-90" />
                    <span className="relative z-[1] flex items-center">
                      <Plus className="mr-2 h-4 w-4" strokeWidth={2.25} />
                      Add Supporter
                    </span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleExport}
                    className="h-12 rounded-2xl border border-white/50 bg-white/55 px-6 font-body font-medium text-foreground/80 shadow-[0_4px_24px_rgba(45,35,48,0.06)] backdrop-blur-md transition-all hover:border-white/80 hover:bg-white/85 hover:text-foreground dark:border-white/10 dark:bg-white/[0.07] dark:hover:bg-white/12"
                  >
                    <Download className="mr-2 h-4 w-4 opacity-70" strokeWidth={1.5} />
                    Export Data
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </header>

          {/* Metrics */}
          {loading ? (
            <div className="mb-24 grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className={cn("h-[132px] rounded-[1.15rem] bg-white/50", i === 2 && "xl:col-span-2")} />
              ))}
            </div>
          ) : (
            <section className="mb-24 xl:mb-32">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard
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
                <StatCard
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
                <StatCard
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
                <StatCard
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
                <StatCard
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
            <section className="mb-14 mt-4">
              <div className="mb-8">
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Highlights
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
                  Top Donors
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
          {!loading && <ImpactOverview feed={feed} allocation={allocationByDestination} />}

          {/* Directory */}
          <section className="mb-8 mt-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Community
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-[2.1rem]">
                  Supporter Directory
                </h2>
                <p className="mt-3 font-body text-base text-muted-foreground/95">
                  {filtered.length} {filtered.length === 1 ? "person" : "people"} match your filters
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setAddOpen(true)}
                variant="ghost"
                className="self-start rounded-2xl border border-transparent bg-white/40 px-4 py-2 font-body font-medium text-[hsl(340_38%_38%)] shadow-sm backdrop-blur-sm transition-all hover:border-[hsl(340_35%_85%)] hover:bg-white/70 hover:text-[hsl(340_35%_28%)] dark:bg-white/5 dark:hover:bg-white/10"
              >
                <Plus className="mr-1.5 h-4 w-4" strokeWidth={2} />
                Log contribution
              </Button>
            </div>

            {!loading && (
              <div className="mb-10">
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
                    {filtered.map((s, i) => (
                      <SupporterRow
                        key={s.id}
                        index={i}
                        supporter={s}
                        onOpen={() => openProfile(s.id)}
                        onEdit={() => void handleEditSupporter(s)}
                        onDelete={() => void handleDeleteSupporter(s)}
                      />
                    ))}
                  </AnimatePresence>
                  {filtered.length === 0 && (
                    <p className="py-24 text-center font-body text-sm text-muted-foreground">No supporters match these filters.</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((s) => (
                    <SupporterCard
                      key={s.id}
                      supporter={s}
                      onOpen={() => openProfile(s.id)}
                      onEdit={() => void handleEditSupporter(s)}
                      onDelete={() => void handleDeleteSupporter(s)}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <p className="col-span-full py-24 text-center font-body text-sm text-muted-foreground">
                      No supporters match these filters.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

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
      </div>

      <SlideOverPanel open={sheetOpen} onOpenChange={setSheetOpen}>
        {selected && (
          <SupporterProfileSheet
            supporter={selected}
            timeline={timelineForSelected}
            notes={notesById[selected.id] ?? ""}
            onNotesChange={(v) => setNotesById((prev) => ({ ...prev, [selected.id]: v }))}
            onMarkInactive={handleMarkInactive}
            onEdit={() => void handleEditSupporter(selected)}
            onDelete={() => void handleDeleteSupporter(selected)}
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
            body.currencyCode = "PHP";
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
    </AdminLayout>
  );
};

export default DonorsPage;
