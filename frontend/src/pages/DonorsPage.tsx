import { AdminLayout } from "@/components/AdminLayout";
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
import { delay } from "@/lib/mockData";
import {
  allocationByDestination,
  contributionFeed as initialFeed,
  donorMetrics,
  getTimelineForSupporter,
  type FeedEntry,
  type Supporter,
  type SupporterKind,
  type SupporterStatus,
  supporters as initialSupporters,
} from "@/lib/donorsContributionsMockData";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Download, Gift, HeartHandshake, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import watermarkSrc from "@/img/NorthStarLogo.png";

const DonorsPage = () => {
  const [loading, setLoading] = useState(true);
  const [supporters, setSupporters] = useState<Supporter[]>(initialSupporters);
  const [notesById, setNotesById] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialSupporters.map((s) => [s.id, s.notes]))
  );
  const [feed, setFeed] = useState<FeedEntry[]>(initialFeed);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SupporterKind | "All">("All");
  const [statusFilter, setStatusFilter] = useState<SupporterStatus | "All">("All");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    delay(650).then(() => setLoading(false));
  }, []);

  const selected = useMemo(() => supporters.find((s) => s.id === selectedId) ?? null, [supporters, selectedId]);

  const filtered = useMemo(() => {
    return supporters.filter((s) => {
      const q = search.toLowerCase().trim();
      const digitQuery = search.replace(/\D/g, "");
      const phoneMatch = digitQuery.length > 0 && s.phone.replace(/\D/g, "").includes(digitQuery);
      const matchSearch =
        !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || phoneMatch;
      const matchType = typeFilter === "All" || s.kind === typeFilter;
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [supporters, search, typeFilter, statusFilter]);

  const openProfile = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  const handleMarkInactive = () => {
    if (!selectedId) return;
    setSupporters((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, status: "Inactive" as const } : s))
    );
    toast.success("Supporter marked inactive", { description: "You can reactivate from the directory filters." });
  };

  const handleExport = () => {
    toast.success("Export queued", { description: "You’ll receive a CSV link when the report is ready (demo)." });
  };

  const handleAddSupporter = () => {
    toast.message("Add supporter", { description: "Connects to your CRM in production — demo only." });
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
                  Supporter directory
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
                        onEdit={() =>
                          toast.message("Edit supporter", { description: "Opens full profile editor (demo)." })
                        }
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
                      onEdit={() =>
                        toast.message("Edit supporter", { description: "Opens full profile editor (demo)." })
                      }
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
            timeline={getTimelineForSupporter(selected.id)}
            notes={notesById[selected.id] ?? ""}
            onNotesChange={(v) => setNotesById((prev) => ({ ...prev, [selected.id]: v }))}
            onMarkInactive={handleMarkInactive}
            onEdit={() => toast.message("Edit profile", { description: "Demo — wire to your admin API." })}
          />
        )}
      </SlideOverPanel>

      <AddContributionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(payload) => {
          const name = supporters.find((s) => s.id === payload.supporterId)?.name ?? "Supporter";
          const newEntry: FeedEntry = {
            id: `F-${Date.now()}`,
            supporterName: name,
            kind: payload.kind,
            description: payload.description || "Contribution logged",
            at: new Date().toISOString(),
            amount: payload.amount ? Number(payload.amount) : undefined,
            hours: payload.hours ? Number(payload.hours) : undefined,
          };
          setFeed((prev) => [newEntry, ...prev]);
        }}
      />
    </AdminLayout>
  );
};

export default DonorsPage;
