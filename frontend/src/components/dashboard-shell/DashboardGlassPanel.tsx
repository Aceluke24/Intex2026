import { cn } from "@/lib/utils";
import { dashboardGlassPanelClass } from "@/components/dashboard-shell/styles";
import type { HTMLAttributes } from "react";

type DashboardGlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "sm" | "md";
};

/** Section card — same glass treatment as Reports chart panels. */
export function DashboardGlassPanel({
  className,
  padding = "md",
  ...props
}: DashboardGlassPanelProps) {
  return (
    <div
      className={cn(
        dashboardGlassPanelClass,
        padding === "sm" ? "p-5" : "p-6",
        className
      )}
      {...props}
    />
  );
}
