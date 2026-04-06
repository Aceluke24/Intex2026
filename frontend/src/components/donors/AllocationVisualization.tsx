import type { AllocationSlice } from "@/lib/donorsContributionsMockData";
import { motion } from "framer-motion";
import { useMemo } from "react";

type AllocationVisualizationProps = {
  data: AllocationSlice[];
};

function BarRow({
  row,
  i,
}: {
  row: AllocationSlice & { pct: number };
  i: number;
}) {
  const gradEnd = row.fill.replace(/^hsl\(/, "hsla(").replace(/\)$/, ", 0.72)");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 * i, duration: 0.4 }}
    >
      <div className="mb-1.5 flex justify-between gap-2 font-body text-xs">
        <span className="truncate font-medium text-foreground/90">{row.label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {row.pct}% · ${(row.value / 1000).toFixed(0)}k
        </span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full bg-[hsl(30_15%_92%)]/90 shadow-[inset_0_2px_4px_rgba(45,35,48,0.06)] dark:bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full shadow-[0_1px_0_rgba(255,255,255,0.4)_inset]"
          style={{
            background: `linear-gradient(90deg, ${row.fill}, ${gradEnd})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${row.pct}%` }}
          transition={{ delay: 0.08 * i + 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}

/** Grouped safehouses vs programs — horizontal gradient bars */
export function AllocationVisualization({ data }: AllocationVisualizationProps) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => b.value - a.value)
        .map((d) => ({
          ...d,
          pct: total ? Math.round((d.value / total) * 1000) / 10 : 0,
        })),
    [data, total]
  );

  const safehouses = chartData.filter((d) => d.category === "safehouse");
  const programs = chartData.filter((d) => d.category === "program");

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-white/75 via-[hsl(350_25%_98%)]/90 to-[hsl(36_30%_97%)]/80 p-7 shadow-[0_8px_48px_rgba(45,35,48,0.06)] backdrop-blur-md dark:from-white/[0.07] dark:via-transparent dark:to-transparent">
      <div className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-[hsl(340_45%_85%)]/25 blur-3xl dark:bg-[hsl(340_30%_40%)]/15" />

      <div className="relative mb-8">
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">Allocation</p>
        <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-foreground">Where support flows</h3>
        <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-muted-foreground">
          Safehouses and programs — year-to-date distribution (mock).
        </p>
      </div>

      <div className="relative space-y-8">
        <div>
          <p className="mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(340_35%_42%)]">
            Safehouses
          </p>
          <div className="space-y-5">
            {safehouses.map((row, i) => (
              <BarRow key={row.id} row={row} i={i} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(25_40%_38%)]">
            Programs
          </p>
          <div className="space-y-5">
            {programs.map((row, i) => (
              <BarRow key={row.id} row={row} i={i + safehouses.length} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-10 rounded-2xl bg-white/55 px-4 py-3.5 font-body text-xs text-muted-foreground shadow-inner backdrop-blur-sm dark:bg-white/[0.05]">
        <span className="font-semibold text-foreground/85">Total allocated</span>
        <span className="ml-2 tabular-nums font-medium">${total.toLocaleString()}</span>
        <span className="mx-2 text-muted-foreground/40">·</span>
        <span>{chartData.length} destinations</span>
      </div>
    </div>
  );
}
