import { DashboardHeader } from "@/components/dashboard-shell";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StaffPageShellProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Staff dashboard page frame: flat header + main content. Visual chrome lives in section cards below.
 */
export function StaffPageShell({ title, description, actions, children, className }: StaffPageShellProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <DashboardHeader title={title} subtitle={description} action={actions} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
