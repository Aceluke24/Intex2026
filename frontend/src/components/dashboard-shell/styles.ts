import { cn } from "@/lib/utils";

/** Primary glass panel — matches Reports & Analytics chart cards. */
export const dashboardGlassPanelClass =
  "rounded-[1.25rem] border border-white/50 bg-white/50 shadow-[0_8px_40px_rgba(45,35,48,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]";

/** Inline filter / toolbar strip — matches Visitations filter bar. */
export const dashboardFilterBarClass =
  "rounded-2xl border border-white/50 bg-white/35 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.06]";

/** Table outer shell — glass, theme-aware dividers. */
export const dashboardTableShellClass =
  "overflow-hidden rounded-[1.1rem] border border-white/50 bg-white/40 shadow-[0_4px_24px_rgba(45,35,48,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05]";

export const dashboardTableHeadRowClass =
  "bg-white/55 dark:bg-white/[0.06]";

export const dashboardTableHeadCellClass =
  "px-4 py-3.5 text-left font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

export const dashboardTableBodyClass = "divide-y divide-white/40 dark:divide-white/10";

export const dashboardTableRowClass =
  "transition-colors hover:bg-white/45 dark:hover:bg-white/[0.07]";

export const dashboardTableCellClass = "px-4 py-3.5 font-body text-sm text-foreground/90";

/** Chart / panel eyebrow line — matches Reports inner labels. */
export const dashboardPanelEyebrowClass =
  "font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75";

export const dashboardPanelSubtitleClass = "mt-1 font-body text-sm text-muted-foreground";

export function dashboardGlassPanelCn(className?: string): string {
  return cn(dashboardGlassPanelClass, "p-6", className);
}
