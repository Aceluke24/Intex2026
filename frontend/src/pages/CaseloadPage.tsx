import { AdminLayout } from "@/components/AdminLayout";
import {
  AddEditCaseDialog,
  CaseDetailSheet,
  CaseRow,
  CaseloadFilterBar,
  type CaseloadFilters,
  CaseloadMetricCard,
} from "@/components/caseload";
import { SlideOverPanel } from "@/components/donors/SlideOverPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  computeCaseloadMetrics,
  initialCases,
  type ResidentCase,
} from "@/lib/caseloadMockData";
import { usePageHeader } from "@/contexts/AdminChromeContext";
import { delay } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FolderOpen,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import watermarkSrc from "@/img/NorthStarLogo.png";

const defaultFilters: CaseloadFilters = {
  search: "",
  status: "All",
  safehouse: "All",
  category: "All",
  worker: "All",
  dateRange: undefined,
};

function matchesFilters(c: ResidentCase, f: CaseloadFilters): boolean {
  const q = f.search.toLowerCase().trim();
  if (q) {
    const blob = [c.displayName, c.id, c.category, c.subcategory, c.keywords.join(" "), c.caseNotes]
      .join(" ")
      .toLowerCase();
    if (!blob.includes(q)) return false;
  }
  if (f.status !== "All" && c.status !== f.status) return false;
  if (f.safehouse !== "All" && c.safehouse !== f.safehouse) return false;
  if (f.category !== "All" && c.category !== f.category) return false;
  if (f.worker !== "All" && c.assignedWorker !== f.worker) return false;
  if (f.dateRange?.from) {
    const fromStr = format(f.dateRange.from, "yyyy-MM-dd");
    const toStr = f.dateRange.to ? format(f.dateRange.to, "yyyy-MM-dd") : fromStr;
    if (c.admissionDate < fromStr || c.admissionDate > toStr) return false;
  }
  return true;
}

type SortKey = "admission" | "name" | "updated";

const PAGE_SIZE = 6;

const CaseloadPage = () => {
  usePageHeader("Caseload Inventory", "Resident cases & reintegration");

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<ResidentCase[]>(initialCases);
  const [filters, setFilters] = useState<CaseloadFilters>(defaultFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ResidentCase | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("admission");
  const [page, setPage] = useState(1);

  useEffect(() => {
    delay(720).then(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => computeCaseloadMetrics(cases), [cases]);

  const filtered = useMemo(() => cases.filter((c) => matchesFilters(c, filters)), [cases, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "name") {
      arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (sortKey === "updated") {
      arr.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
    } else {
      arr.sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime());
    }
    return arr;
  }, [filtered, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, safePage]);

  useEffect(() => {
    setPage(1);
  }, [filtered.length, sortKey]);

  const selected = useMemo(() => cases.find((c) => c.id === selectedId) ?? null, [cases, selectedId]);

  const openCase = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  const handleExport = () => {
    toast.success("Export queued", {
      description: "A secured CSV will be available when processing completes (demo).",
    });
  };

  const handleSaveCase = (c: ResidentCase) => {
    setCases((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = c;
        return next;
      }
      return [c, ...prev];
    });
    toast.success(editing ? "Case updated" : "Case created", {
      description: "Record saved locally for this session (demo).",
    });
    setEditing(null);
  };

  return (
    <AdminLayout contentClassName="max-w-[min(100%,90rem)]">
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14",
          "bg-gradient-to-b from-[hsl(36_34%_96%)] via-[hsl(210_28%_96%)] to-[hsl(340_24%_95%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
          "dark:from-[hsl(213_40%_9%)] dark:via-[hsl(213_36%_9%)] dark:to-[hsl(340_22%_9%)]"
        )}
      >
        <div
          className="pointer-events-none absolute -left-24 top-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle_at_center,hsl(340_38%_86%)/0.38_0%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,hsl(340_32%_32%)/0.2_0%,transparent_72%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,hsl(210_30%_88%)/0.28_0%,transparent_68%)] blur-3xl dark:opacity-35"
          aria-hidden
        />

        <div className="donors-page-grain pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.35]" aria-hidden />

        <img
          src={watermarkSrc}
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-0 top-6 h-52 w-auto max-w-[min(38%,300px)] opacity-[0.055] select-none sm:h-64 lg:right-8 lg:top-10"
        />

        <div className="relative z-[1]">
          <header className="relative mb-14 lg:mb-20">
            <div className="pointer-events-none absolute -left-8 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[hsl(340_40%_90%)]/14 blur-3xl dark:bg-[hsl(340_28%_38%)]/12" />

            <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
              <div className="max-w-2xl">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-3 inline-flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70"
                >
                  <ClipboardList className="h-3.5 w-3.5 text-[hsl(340_38%_52%)]" strokeWidth={1.5} />
                  Case management
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.03 }}
                  className="font-display text-[2.1rem] font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[2.55rem] lg:text-[2.85rem]"
                >
                  Caseload Inventory
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 }}
                  className="mt-5 max-w-xl font-body text-[1.02rem] font-normal leading-[1.65] text-muted-foreground/95 sm:text-[1.06rem]"
                >
                  Manage resident cases, track progress, and support reintegration.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="flex flex-wrap items-center gap-3"
              >
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                  <Button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                    className="relative h-12 overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-r from-[hsl(340_44%_66%)] via-[hsl(350_40%_70%)] to-[hsl(10_44%_56%)] px-6 font-body font-semibold text-white shadow-[0_8px_32px_rgba(190,100,130,0.32)] transition-shadow duration-300 hover:shadow-[0_14px_44px_rgba(190,100,130,0.42)]"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/22 to-transparent opacity-90" />
                    <span className="relative z-[1] flex items-center">
                      <Plus className="mr-2 h-4 w-4" strokeWidth={2.25} />
                      Add Case
                    </span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleExport}
                    className="h-12 rounded-2xl border border-white/50 bg-white/50 px-6 font-body font-medium text-foreground/80 shadow-[0_4px_24px_rgba(45,35,48,0.05)] backdrop-blur-md transition-all hover:border-white/80 hover:bg-white/82 hover:text-foreground dark:border-white/10 dark:bg-white/[0.07] dark:hover:bg-white/12"
                  >
                    <Download className="mr-2 h-4 w-4 opacity-70" strokeWidth={1.5} />
                    Export Records
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </header>

          {loading ? (
            <div className="mb-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-[1.1rem] bg-white/45" />
              ))}
            </div>
          ) : (
            <section className="mb-12 xl:mb-16">
              <div className="mb-4 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground/60" strokeWidth={1.5} />
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Caseload overview
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <CaseloadMetricCard
                  label="Total active cases"
                  value={metrics.active}
                  icon={Users}
                  motionDelay={0}
                />
                <CaseloadMetricCard
                  label="New admissions (month)"
                  value={metrics.newThisMonth}
                  icon={UserCheck}
                  motionDelay={0.05}
                />
                <CaseloadMetricCard
                  label="Cases in reintegration"
                  value={metrics.reint}
                  icon={ClipboardList}
                  motionDelay={0.1}
                />
                <CaseloadMetricCard
                  label="High-risk cases"
                  value={metrics.highRisk}
                  icon={AlertTriangle}
                  motionDelay={0.14}
                  variant="critical"
                />
                <CaseloadMetricCard
                  label="Closed cases"
                  value={metrics.closed}
                  icon={Archive}
                  motionDelay={0.18}
                />
              </div>
            </section>
          )}

          {!loading && (
            <section className="mb-10">
              <CaseloadFilterBar filters={filters} onFiltersChange={setFilters} />
            </section>
          )}

          <section className="mb-6">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Records
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.85rem]">
                  Case inventory
                </h2>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? "case" : "cases"} match your criteria
                </p>
              </div>
              {!loading && filtered.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    Sort
                  </span>
                  <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <SelectTrigger className="h-10 w-[200px] rounded-xl border-white/50 bg-white/60 font-body text-xs dark:border-white/10 dark:bg-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admission">Admission date (newest)</SelectItem>
                      <SelectItem value="updated">Last update (recent)</SelectItem>
                      <SelectItem value="name">Resident name (A–Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="mt-2 space-y-3.5">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[132px] rounded-[1.15rem] bg-white/40" />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginated.map((c, i) => (
                    <CaseRow
                      key={c.id}
                      residentCase={c}
                      index={i}
                      onView={() => openCase(c.id)}
                      onEdit={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    />
                  ))}
                </AnimatePresence>
              )}
              {!loading && filtered.length > 0 && pageCount > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/35 pt-6 dark:border-white/10">
                  <p className="font-body text-xs text-muted-foreground">
                    Page {safePage} of {pageCount} · {PAGE_SIZE} per page
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-white/50 bg-white/50 dark:border-white/10"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-white/50 bg-white/50 dark:border-white/10"
                      disabled={safePage >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <p className="py-20 text-center font-body text-sm text-muted-foreground">
                  No cases match these filters. Adjust search or clear filters to see more records.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      <SlideOverPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        className="sm:max-w-[min(100%,28rem)] lg:max-w-[min(100%,36rem)]"
      >
        {selected && <CaseDetailSheet c={selected} />}
      </SlideOverPanel>

      <AddEditCaseDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSave={handleSaveCase}
      />
    </AdminLayout>
  );
};

export default CaseloadPage;
