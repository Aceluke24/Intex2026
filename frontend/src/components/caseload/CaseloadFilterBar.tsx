import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CaseCategory, CaseStatus } from "@/lib/caseloadTypes";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarIcon, Search, SlidersHorizontal, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

export type CaseloadFilters = {
  search: string;
  status: CaseStatus | "All";
  safehouse: string | "All";
  category: CaseCategory | "All";
  worker: string | "All";
  dateRange: DateRange | undefined;
};

type CaseloadFilterBarProps = {
  filters: CaseloadFilters;
  onFiltersChange: (next: CaseloadFilters) => void;
  safehouses: string[];
  workers: string[];
  categories: string[];
};

const statuses: Array<CaseStatus | "All"> = ["All", "Active", "Pending", "Reintegration", "Closed"];

function labelForFilter(key: keyof CaseloadFilters, value: unknown, filters: CaseloadFilters): string | null {
  if (value === undefined || value === null || value === "All" || value === "") return null;
  if (key === "search") return null;
  if (key === "dateRange") {
    const dr = value as DateRange | undefined;
    if (!dr?.from) return null;
    const a = format(dr.from, "MMM d, yyyy");
    const b = dr.to ? format(dr.to, "MMM d, yyyy") : "…";
    return `Admitted ${a} – ${b}`;
  }
  if (key === "status") return `Status: ${value}`;
  if (key === "safehouse") return `Safehouse: ${value}`;
  if (key === "category") return `Category: ${value}`;
  if (key === "worker") return `Worker: ${value}`;
  return null;
}

export function CaseloadFilterBar({
  filters,
  onFiltersChange,
  safehouses,
  workers,
  categories,
}: CaseloadFilterBarProps) {
  const set = (patch: Partial<CaseloadFilters>) => onFiltersChange({ ...filters, ...patch });

  const activePills: { key: keyof CaseloadFilters; label: string }[] = [];
  (Object.keys(filters) as (keyof CaseloadFilters)[]).forEach((key) => {
    const label = labelForFilter(key, filters[key], filters);
    if (label) activePills.push({ key, label });
  });

  const clearKey = (key: keyof CaseloadFilters) => {
    if (key === "search") set({ search: "" });
    else if (key === "status") set({ status: "All" });
    else if (key === "safehouse") set({ safehouse: "All" });
    else if (key === "category") set({ category: "All" });
    else if (key === "worker") set({ worker: "All" });
    else if (key === "dateRange") set({ dateRange: undefined });
  };

  return (
    <motion.div
      layout
      className={cn(
        "rounded-[1.25rem] border border-white/60 bg-white/45 p-4 shadow-[0_8px_40px_rgba(45,35,48,0.06)] backdrop-blur-xl",
        "dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className="relative w-full min-w-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search name, case ID, or keywords…"
            className="h-11 w-full min-w-0 rounded-xl border-0 bg-white/70 pl-10 font-body text-sm shadow-inner dark:bg-white/10"
          />
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5">
          <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground/80">
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="font-body text-[10px] font-semibold uppercase tracking-[0.16em]">Filters</span>
          </div>

          <Select value={filters.status} onValueChange={(v) => set({ status: v as CaseStatus | "All" })}>
            <SelectTrigger className="h-10 w-[140px] rounded-xl border-white/50 bg-white/60 font-body text-xs dark:border-white/10 dark:bg-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s} className="font-body text-xs">
                  {s === "All" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.safehouse} onValueChange={(v) => set({ safehouse: v })}>
            <SelectTrigger className="h-10 w-[168px] rounded-xl border-white/50 bg-white/60 font-body text-xs dark:border-white/10 dark:bg-white/10">
              <SelectValue placeholder="Safehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All" className="font-body text-xs">
                All safehouses
              </SelectItem>
              {safehouses.map((sh) => (
                <SelectItem key={sh} value={sh} className="font-body text-xs">
                  {sh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.category} onValueChange={(v) => set({ category: v as CaseCategory | "All" })}>
            <SelectTrigger className="h-10 w-[168px] rounded-xl border-white/50 bg-white/60 font-body text-xs dark:border-white/10 dark:bg-white/10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All" className="font-body text-xs">
                All categories
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="font-body text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.worker} onValueChange={(v) => set({ worker: v })}>
            <SelectTrigger className="h-10 min-w-[200px] rounded-xl border-white/50 bg-white/60 font-body text-xs dark:border-white/10 dark:bg-white/10">
              <SelectValue placeholder="Social worker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All" className="font-body text-xs">
                All workers
              </SelectItem>
              {workers.map((w) => (
                <SelectItem key={w} value={w} className="font-body text-xs">
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "h-10 gap-2 rounded-xl border border-white/50 bg-white/60 px-3 font-body text-xs font-medium text-foreground/85 dark:border-white/10 dark:bg-white/10",
                  filters.dateRange?.from && "border-[hsl(340_35%_82%)] bg-[hsl(340_25%_97%)] dark:border-[hsl(340_25%_28%)] dark:bg-[hsl(340_18%_14%)]"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
                Admission range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-xl p-0" align="end">
              <Calendar
                mode="range"
                numberOfMonths={1}
                selected={filters.dateRange}
                onSelect={(range) => set({ dateRange: range })}
                initialFocus
                className="pointer-events-auto rounded-xl"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {activePills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 flex flex-wrap gap-2 border-t border-white/40 pt-4 dark:border-white/10"
          >
            {activePills.map((p) => (
              <motion.button
                layout
                key={p.key}
                type="button"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                onClick={() => clearKey(p.key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(340_30%_88%)]/90 bg-gradient-to-r from-white/90 to-[hsl(36_30%_98%)]/90 px-3 py-1 font-body text-[11px] font-medium text-foreground/90 shadow-sm backdrop-blur-sm transition-colors hover:border-[hsl(340_35%_78%)] dark:border-white/15 dark:from-white/10 dark:to-white/5"
              >
                {p.label}
                <X className="h-3 w-3 opacity-60" />
              </motion.button>
            ))}
            <button
              type="button"
              onClick={() =>
                onFiltersChange({
                  search: "",
                  status: "All",
                  safehouse: "All",
                  category: "All",
                  worker: "All",
                  dateRange: undefined,
                })
              }
              className="font-body text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
