import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type Variant = "neutral" | "critical";

type CaseloadMetricCardProps = {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: LucideIcon;
  motionDelay?: number;
  variant?: Variant;
};

export function CaseloadMetricCard({
  label,
  value,
  format = (n) => Math.round(n).toLocaleString(),
  icon: Icon,
  motionDelay = 0,
  variant = "neutral",
}: CaseloadMetricCardProps) {
  const count = useCountUp(value, 1100, 0);
  const display = format(count);

  const isCritical = variant === "critical";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: motionDelay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-[1.1rem] p-5 sm:p-6",
        "backdrop-blur-xl",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_4px_24px_rgba(45,35,48,0.05)]",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_28px_rgba(0,0,0,0.25)]",
        isCritical
          ? cn(
              "bg-gradient-to-br from-[hsl(0_28%_97%)] via-[hsl(36_28%_97%)] to-[hsl(340_22%_97%)]",
              "ring-1 ring-[hsl(0_35%_88%)]/80 dark:from-[hsl(0_20%_12%)] dark:via-[hsl(213_30%_11%)] dark:to-[hsl(340_18%_11%)] dark:ring-[hsl(0_25%_22%)]"
            )
          : cn(
              "bg-gradient-to-br from-[hsl(210_18%_97%)] via-[hsl(36_22%_98%)] to-[hsl(340_18%_97%)]",
              "dark:from-[hsl(213_28%_11%)] dark:via-[hsl(213_25%_10%)] dark:to-[hsl(340_15%_10%)]"
            )
      )}
    >
      {isCritical && (
        <div
          className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle_at_center,hsl(0_40%_75%)/0.2_0%,transparent_70%)] blur-2xl"
          aria-hidden
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-body font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            {label}
          </p>
          <p
            className={cn(
              "mt-2.5 font-display tabular-nums tracking-[-0.03em] text-foreground",
              isCritical ? "text-[1.85rem] font-bold sm:text-[2rem]" : "text-[1.6rem] font-semibold sm:text-[1.75rem]"
            )}
          >
            {display}
          </p>
        </div>
        <div className="relative shrink-0">
          <div
            className={cn(
              "absolute inset-0 scale-150 rounded-2xl opacity-25 blur-lg",
              isCritical ? "bg-[hsl(0_35%_55%)]" : "bg-[hsl(213_25%_55%)]"
            )}
            aria-hidden
          />
          <div
            className={cn(
              "relative rounded-xl p-2.5 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-105",
              isCritical
                ? "bg-white/75 text-[hsl(0_30%_38%)] dark:bg-white/10 dark:text-[hsl(0_25%_78%)]"
                : "bg-white/70 text-foreground/50 dark:bg-white/10 dark:text-white/65"
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.35} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
