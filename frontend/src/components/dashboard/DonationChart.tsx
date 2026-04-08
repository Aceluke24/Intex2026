import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DonationMonth } from "@/lib/dashboardTypes";
import { useId } from "react";

type DonationChartProps = {
  data: DonationMonth[];
  /** Short insight line above the chart title */
  insight?: string;
};

/** Single wide area — minimal grid, thin stroke, cinematic */
export function DonationChart({ data, insight }: DonationChartProps) {
  const gradId = useId().replace(/:/g, "");
  const last = data[data.length - 1];
  const prior = data[data.length - 2];
  const deltaPct =
    prior && last ? Math.round(((last.total - prior.total) / prior.total) * 1000) / 10 : 0;

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-[hsl(36,38%,99%)] to-[hsl(350,30%,99%)] px-6 py-8 shadow-[0_2px_20px_rgba(45,35,48,0.04)] sm:px-10 sm:py-10">
      {insight && (
        <p className="mb-3 max-w-3xl font-body text-sm leading-relaxed text-muted-foreground">{insight}</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">Donation trends</h3>
          <p className="mt-1 font-body text-sm text-muted-foreground">Monthly totals (from your records)</p>
        </div>
        {last && prior && (
          <p className="font-body text-sm tabular-nums text-muted-foreground">
            <span className="font-medium text-foreground/90">
              {deltaPct >= 0 ? "+" : ""}
              {deltaPct}%
            </span>
            <span> vs prior month</span>
          </p>
        )}
      </div>

      <div className="mt-10 h-[min(380px,45vh)] min-h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(340, 32%, 62%)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="hsl(340, 32%, 62%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 12" vertical={false} stroke="hsl(350,12%,94%)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(213,10%,50%)", fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(213,10%,50%)" }}
              tickFormatter={(v) => `$${v / 1000}k`}
              width={52}
            />
            <Tooltip
              cursor={{ stroke: "hsl(350,20%,92%)", strokeWidth: 1 }}
              contentStyle={{
                borderRadius: "14px",
                border: "none",
                boxShadow: "0 8px 30px rgba(45,35,48,0.1)",
                fontSize: "12px",
                fontFamily: "Inter, sans-serif",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Total"]}
            />
            <Area
              type="monotone"
              dataKey="total"
              name="total"
              stroke="hsl(340, 30%, 52%)"
              strokeWidth={1.25}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(340, 32%, 48%)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
