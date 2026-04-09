import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type OutreachStatTrend = {
  label: string;
  direction: "up" | "down" | "flat";
};

export type OutreachStatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  loading?: boolean;
  trend?: OutreachStatTrend | null;
  className?: string;
};

/**
 * Compact metric tile for dashboard outreach KPIs (theme-safe icons, loading skeleton).
 */
export function OutreachStatCard({
  label,
  value,
  icon: Icon,
  loading = false,
  trend = null,
  className,
}: OutreachStatCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-[5.5rem] items-center gap-4 rounded-2xl bg-card/90 px-5 py-4",
        "shadow-sm ring-1 ring-border/25 dark:bg-card dark:ring-border/35",
        className
      )}
    >
      <div
        className="flex shrink-0 rounded-xl bg-muted/40 p-2.5 dark:bg-muted/20"
        aria-hidden
      >
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 flex min-h-[2rem] items-center sm:min-h-[2.25rem]">
          {loading ? (
            <Skeleton className="h-8 w-[6.5rem] max-w-[85%]" />
          ) : (
            <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
              {value}
            </p>
          )}
        </div>
        {!loading && trend ? (
          <p
            className={cn(
              "mt-1 text-xs font-medium tabular-nums",
              trend.direction === "up" && "text-emerald-600 dark:text-emerald-400",
              trend.direction === "down" && "text-rose-600 dark:text-rose-400",
              trend.direction === "flat" && "text-muted-foreground"
            )}
          >
            {trend.label}
          </p>
        ) : null}
      </div>
    </div>
  );
}
