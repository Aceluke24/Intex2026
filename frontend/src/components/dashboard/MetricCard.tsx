import { cn } from "@/lib/utils";
import type { DashboardMetric } from "@/lib/dashboardTypes";
import { Users, Home, Heart, Percent, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const icons: Record<DashboardMetric["icon"], LucideIcon> = {
  users: Users,
  home: Home,
  heart: Heart,
  percent: Percent,
  calendar: Calendar,
};

function MiniSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return (
    <div className="flex h-14 items-end gap-1" aria-hidden>
      {values.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-[hsl(340,38%,72%)]/50 transition-all duration-200"
          style={{ height: `${40 + ((v - min) / range) * 55}%` }}
        />
      ))}
    </div>
  );
}

type MetricCardProps = {
  metric: DashboardMetric;
  className?: string;
  /** Default = compact supporting card */
  variant?: "default" | "hero" | "supporting";
  /** Hero only: sparkline values */
  sparkline?: number[];
};

export function MetricCard({ metric, className, variant = "default", sparkline }: MetricCardProps) {
  const Icon = icons[metric.icon];
  const TrendIcon =
    metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;

  const isHero = variant === "hero";
  const isSupporting = variant === "supporting";

  return (
    <div
      className={cn(
        "group relative rounded-2xl transition-all duration-200 ease-out",
        "shadow-[0_2px_8px_rgba(45,35,48,0.04),0_12px_40px_rgba(45,35,48,0.06)]",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(45,35,48,0.09)]",
        isHero &&
          "bg-gradient-to-br from-[hsl(36,42%,97%)] via-card to-[hsl(350,38%,98%)] p-6 sm:p-8 lg:p-10",
        isSupporting && "bg-[hsl(36,35%,97%)]/90 p-5 backdrop-blur-sm",
        variant === "default" && !isHero && !isSupporting && "bg-[hsl(36,35%,97%)]/90 p-5 backdrop-blur-sm",
        className
      )}
    >
      {isHero ? (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[hsl(340,28%,46%)]">
              <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
              <span className="font-body text-sm font-medium tracking-tight">{metric.label}</span>
            </div>
            <p className="mt-3 font-display text-[clamp(2.75rem,6vw,4rem)] font-semibold leading-none tracking-tight text-foreground tabular-nums">
              {metric.value}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-[13px] font-medium",
                  metric.trend === "up" && "bg-[hsl(145,32%,92%)] text-[hsl(150,22%,34%)]",
                  metric.trend === "down" && "bg-[hsl(36,38%,93%)] text-[hsl(25,32%,38%)]",
                  metric.trend === "neutral" && "bg-muted/70 text-muted-foreground"
                )}
              >
                <TrendIcon className="h-3.5 w-3.5 opacity-90" />
                {metric.trendLabel}
              </span>
            </div>
          </div>
          {sparkline && sparkline.length > 0 && (
            <div className="flex shrink-0 flex-col items-end gap-2 lg:pb-1">
              <span className="font-body text-xs text-muted-foreground">Recent weeks</span>
              <MiniSparkline values={sparkline} />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-[hsl(340,30%,44%)]",
                "bg-[hsl(350,32%,94%)]/80 transition-colors duration-200 group-hover:bg-[hsl(350,36%,91%)]"
              )}
              aria-hidden
            >
              <Icon className="h-[17px] w-[17px] stroke-[1.65]" />
            </div>
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-body text-[12px] font-medium",
                metric.trend === "up" && "bg-[hsl(145,35%,92%)] text-[hsl(150,22%,36%)]",
                metric.trend === "down" && "bg-[hsl(36,40%,93%)] text-[hsl(25,35%,40%)]",
                metric.trend === "neutral" && "bg-muted/70 text-muted-foreground"
              )}
            >
              <TrendIcon className="h-3 w-3 opacity-80" />
              <span className="tabular-nums">{metric.trendLabel}</span>
            </div>
          </div>
          <p className="mt-5 font-body text-sm font-medium leading-snug text-muted-foreground">{metric.label}</p>
          <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-[1.75rem]">
            {metric.value}
          </p>
        </>
      )}
    </div>
  );
}
