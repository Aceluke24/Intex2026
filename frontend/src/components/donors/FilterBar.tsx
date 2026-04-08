import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LayoutGrid, Search, Table2 } from "lucide-react";
import { motion } from "framer-motion";
import type { SupporterKind, SupporterStatus } from "@/lib/donorsTypes";

type ViewMode = "table" | "card";

type FilterBarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: SupporterKind | "All";
  onTypeChange: (v: SupporterKind | "All") => void;
  statusFilter: SupporterStatus | "All";
  onStatusChange: (v: SupporterStatus | "All") => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
};

const types: (SupporterKind | "All")[] = ["All", "Monetary", "Volunteer", "Skills", "Social"];
const statuses: (SupporterStatus | "All")[] = ["All", "Active", "Inactive"];

function Pill({
  active,
  children,
  onClick,
  layoutId,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  layoutId: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative rounded-xl px-2.5 py-1.5 font-body text-xs font-medium transition-colors duration-200",
        active ? "text-foreground" : "text-muted-foreground/90 hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-xl bg-gradient-to-b from-white to-[hsl(350_30%_98%)] shadow-[0_4px_16px_rgba(200,130,150,0.15)] dark:from-white/15 dark:to-white/5 dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      <span className="relative z-[1]">{children}</span>
    </motion.button>
  );
}

/** Floating glass filter strip */
export function FilterBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  viewMode,
  onViewModeChange,
}: FilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className={cn(
        "flex flex-col gap-4 rounded-[1.35rem] p-4 lg:flex-row lg:items-center lg:justify-between",
        "border border-white/50 bg-white/45 shadow-[0_12px_48px_rgba(45,35,48,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]",
        "backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_12px_48px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/55" strokeWidth={1.5} />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search supporters…"
          className="h-11 rounded-2xl border border-white/40 bg-white/55 pl-10 font-body text-sm shadow-[inset_0_1px_2px_rgba(45,35,48,0.04)] backdrop-blur-md placeholder:text-muted-foreground/50 focus-visible:border-[hsl(340_35%_75%)]/40 focus-visible:ring-2 focus-visible:ring-[hsl(340_35%_70%)]/25 dark:border-white/10 dark:bg-white/[0.07]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/35 bg-[hsl(36_30%_98%)]/50 p-1.5 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
          <span className="px-2 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/65">
            Type
          </span>
          {types.map((t) => (
            <Pill key={t} layoutId="donor-filter-type" active={typeFilter === t} onClick={() => onTypeChange(t)}>
              {t}
            </Pill>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/35 bg-[hsl(36_30%_98%)]/50 p-1.5 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
          <span className="px-2 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/65">
            Status
          </span>
          {statuses.map((s) => (
            <Pill key={s} layoutId="donor-filter-status" active={statusFilter === s} onClick={() => onStatusChange(s)}>
              {s}
            </Pill>
          ))}
        </div>

        <div className="ml-auto flex rounded-2xl border border-white/35 bg-[hsl(36_30%_98%)]/60 p-1 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
          <motion.button
            type="button"
            aria-label="Table view"
            onClick={() => onViewModeChange("table")}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "rounded-xl p-2 transition-colors",
              viewMode === "table"
                ? "bg-white text-foreground shadow-md dark:bg-white/15"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Table2 className="h-4 w-4" strokeWidth={1.5} />
          </motion.button>
          <motion.button
            type="button"
            aria-label="Card view"
            onClick={() => onViewModeChange("card")}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "rounded-xl p-2 transition-colors",
              viewMode === "card"
                ? "bg-white text-foreground shadow-md dark:bg-white/15"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
