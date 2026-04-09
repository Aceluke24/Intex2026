import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type DashboardSectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  right?: ReactNode;
  className?: string;
};

/**
 * Subsection title block — matches Process Recordings “Session timeline” / Caseload “Records” headers.
 */
export function DashboardSectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  right,
  className,
}: DashboardSectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon className="h-4 w-4 text-muted-foreground/65" strokeWidth={1.5} />
          ) : null}
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            {eyebrow}
          </p>
        </div>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 font-body text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}
