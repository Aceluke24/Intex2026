import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type DashboardHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * Flat page header for admin dashboard routes: title + optional primary actions on one row,
 * optional muted subtitle below.
 */
export function DashboardHeader({ title, subtitle, action, className }: DashboardHeaderProps) {
  return (
    <header className={cn("mb-6 border-b border-border/30 pb-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="min-w-0 font-display text-2xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        {action ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">{action}</div>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-2 max-w-3xl font-body text-sm leading-snug text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}
