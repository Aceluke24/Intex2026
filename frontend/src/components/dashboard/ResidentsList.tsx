import type { ResidentRow, ResidentStatus } from "@/lib/dashboardMockData";
import { cn } from "@/lib/utils";

const statusStyles: Record<ResidentStatus, string> = {
  Stable: "bg-[hsl(145,22%,93%)]/95 text-[hsl(150,18%,34%)]",
  "At Risk": "bg-[hsl(35,24%,93%)]/95 text-[hsl(28,22%,38%)]",
  Progressing: "bg-[hsl(350,22%,94%)]/95 text-[hsl(340,18%,40%)]",
};

type ResidentsListProps = {
  rows: ResidentRow[];
};

/** Rounded list — ID, status, last update; optional safehouse as quiet context */
export function ResidentsList({ rows }: ResidentsListProps) {
  return (
    <div className="space-y-2">
      <div className="mb-4 hidden gap-4 px-4 font-body text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)]">
        <span>Resident</span>
        <span className="text-center">Status</span>
        <span className="text-right">Last update</span>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className={cn(
              "grid grid-cols-1 gap-3 rounded-2xl px-4 py-5 sm:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4",
              "bg-[hsl(36,28%,99%)]/90 shadow-[0_1px_3px_rgba(45,35,48,0.035)]",
              "transition-all duration-200 ease-out hover:bg-[hsl(350,26%,99%)] hover:shadow-[0_6px_28px_rgba(45,35,48,0.06)]"
            )}
          >
            <div>
              <span className="font-mono text-[13px] font-semibold text-foreground">{r.id}</span>
              {r.safehouse && (
                <p className="mt-0.5 font-body text-xs text-muted-foreground/85">{r.safehouse}</p>
              )}
            </div>
            <div className="flex sm:justify-center">
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 font-body text-xs font-medium",
                  statusStyles[r.status]
                )}
              >
                {r.status}
              </span>
            </div>
            <span className="font-body text-sm tabular-nums text-muted-foreground sm:text-right">{r.lastSession}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
