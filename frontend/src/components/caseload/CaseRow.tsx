import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResidentCase } from "@/lib/caseloadTypes";
import { format } from "date-fns";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type CaseRowProps = {
  residentCase: ResidentCase;
  onView: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  index?: number;
};

function initials(name: string) {
  return name
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "••";
}

export function CaseRow({ residentCase: c, onView, onEdit, onDelete, index = 0 }: CaseRowProps) {
  const [barW, setBarW] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setBarW(c.reintegrationProgress));
    return () => cancelAnimationFrame(t);
  }, [c.reintegrationProgress]);

  const admission = format(new Date(c.admissionDate), "MMM d, yyyy");
  const updated = format(new Date(c.lastUpdate), "MMM d, yyyy");
  const isActive = c.status === "Active";
  const isHigh = c.riskLevel === "High";

  const statusLabel =
    c.status === "Reintegration" ? "Reintegration" : c.status === "Closed" ? "Closed" : c.status;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.035 * index, duration: 0.42 }}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-[1.15rem] pl-1 pr-4 py-4 text-left outline-none sm:flex-row sm:items-stretch sm:gap-0 sm:py-3.5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_2px_18px_rgba(45,35,48,0.045)]",
        "bg-gradient-to-r from-white/75 via-[hsl(36_28%_99%)]/92 to-white/60 backdrop-blur-md",
        "transition-shadow duration-300 hover:shadow-[0_14px_44px_rgba(45,35,48,0.09)]",
        "dark:from-white/[0.07] dark:via-white/[0.05] dark:to-white/[0.06] dark:hover:shadow-[0_14px_44px_rgba(0,0,0,0.38)]",
        "focus-visible:ring-2 focus-visible:ring-[hsl(340_32%_65%)]/35"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100 dark:via-white/[0.035]"
        aria-hidden
      />

      <div
        className={cn(
          "relative mr-0 w-1 shrink-0 self-stretch rounded-full sm:mr-3",
          isHigh
            ? "bg-gradient-to-b from-[hsl(0_35%_72%)] via-[hsl(10_30%_75%)] to-[hsl(25_28%_78%)] opacity-90 shadow-[0_0_14px_rgba(160,90,90,0.25)]"
            : "bg-gradient-to-b from-[hsl(340_38%_78%)] via-[hsl(220_18%_82%)] to-[hsl(36_28%_84%)] opacity-75"
        )}
        aria-hidden
      />

      {/* Left */}
      <div className="relative z-[1] flex min-w-0 flex-[1.1] items-start gap-3 pl-3 sm:pl-0">
        <div className="relative shrink-0">
          {isHigh ? (
            <span
              className="absolute inset-[-3px] rounded-full bg-[hsl(0_38%_48%)]/18 blur-[1px]"
              aria-hidden
            />
          ) : (
            isActive && (
              <span
                className="absolute inset-[-3px] rounded-full bg-[hsl(150_32%_48%)]/22 blur-[1px]"
                aria-hidden
              />
            )
          )}
          <Avatar className="relative h-11 w-11 border border-white/80 shadow-sm dark:border-white/12">
            <AvatarFallback
              className={cn(
                "font-display text-xs font-semibold text-foreground/88",
                "bg-gradient-to-br from-[hsl(340_40%_90%)] via-[hsl(210_20%_92%)] to-[hsl(36_32%_91%)]"
              )}
            >
              {initials(c.displayName)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[0.95rem] font-semibold tracking-[-0.02em] text-foreground sm:text-base">
              {c.displayName}
            </span>
            <span className="font-mono text-[10px] font-medium text-muted-foreground/90">{c.id}</span>
          </div>
          <span
            className={cn(
              "mt-1.5 inline-flex rounded-full border border-[hsl(340_28%_88%)]/85 bg-white/55 px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-[hsl(340_32%_32%)] backdrop-blur-sm dark:border-white/12 dark:bg-white/10 dark:text-[hsl(340_35%_88%)]"
            )}
          >
            {c.category}
          </span>
          <p className="mt-1 font-body text-[11px] text-muted-foreground/95">{c.subcategory}</p>
        </div>
      </div>

      {/* Middle */}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-center gap-1 border-t border-white/35 pt-3 pl-3 sm:border-t-0 sm:border-l sm:border-white/35 sm:pt-0 sm:pl-5 dark:border-white/10">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/65">Placement</p>
        <p className="font-body text-sm font-medium text-foreground/95">{c.safehouse}</p>
        <p className="font-body text-xs text-muted-foreground">{c.assignedWorker}</p>
        <p className="mt-1 font-body text-xs tabular-nums text-muted-foreground">
          Admitted <span className="text-foreground/85">{admission}</span>
        </p>
      </div>

      {/* Right */}
      <div className="relative z-[1] flex min-w-0 flex-[0.95] flex-col justify-center gap-2 border-t border-white/35 pt-3 pl-3 sm:border-t-0 sm:border-l sm:border-white/35 sm:pt-0 sm:pl-5 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isHigh ? (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(0_35%_50%)] opacity-45 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(0_30%_48%)] shadow-[0_0_10px_rgba(150,60,60,0.35)]" />
              </span>
            ) : isActive ? (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(150_35%_48%)] opacity-50 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(150_32%_45%)] shadow-[0_0_10px_hsl(150_40%_45%)]" />
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-muted-foreground/35" />
            )}
            <span className="font-body text-xs font-semibold text-foreground/90">{statusLabel}</span>
            {isHigh && (
              <span className="rounded-md bg-[hsl(0_28%_94%)] px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-[hsl(0_30%_38%)] dark:bg-[hsl(0_22%_18%)] dark:text-[hsl(0_25%_78%)]">
                High risk
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-white/85 hover:text-foreground dark:hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-white/85 hover:text-foreground dark:hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-body text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              Reintegration
            </span>
            <span className="font-body text-[11px] tabular-nums text-muted-foreground">{barW}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(210_18%_90%)] dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[hsl(340_38%_72%)] to-[hsl(150_28%_52%)]"
              initial={{ width: 0 }}
              animate={{ width: `${barW}%` }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
        <p className="font-body text-[10px] text-muted-foreground/90">
          Last update <span className="text-foreground/75">{updated}</span>
        </p>
      </div>
    </motion.div>
  );
}
