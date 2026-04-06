import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export type StatCardTone = "rose" | "blush" | "featured" | "sage" | "gold";

interface StatCardProps {
  label: string;
  value: string | number;
  animateTo?: number;
  formatAnimated?: (n: number) => string;
  decimals?: number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  className?: string;
  variant?: "default" | "glass";
  /** Visual personality — gradient wash + icon blob color */
  tone?: StatCardTone;
  /** Emphasize one metric (larger type, wider column) */
  featured?: boolean;
  /** Stagger with siblings (seconds) */
  motionDelay?: number;
}

const toneSurfaces: Record<StatCardTone, string> = {
  rose: "bg-gradient-to-br from-[hsl(340_42%_97%)] via-white/50 to-[hsl(36_35%_98%)] dark:from-[hsl(340_25%_14%)] dark:via-white/[0.04] dark:to-[hsl(213_40%_10%)]",
  blush: "bg-gradient-to-br from-[hsl(350_38%_97%)] via-[hsl(36_40%_98%)] to-white/40 dark:from-[hsl(350_22%_14%)] dark:via-white/[0.03] dark:to-transparent",
  featured:
    "bg-gradient-to-br from-[hsl(340_45%_96%)] via-[hsl(25_35%_97%)] to-[hsl(43_40%_96%)] shadow-[0_8px_40px_rgba(200,120,140,0.12)] dark:from-[hsl(340_30%_12%)] dark:via-[hsl(25_25%_11%)] dark:to-[hsl(213_35%_9%)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.35)]",
  sage: "bg-gradient-to-br from-[hsl(150_22%_96%)] via-white/45 to-[hsl(36_35%_98%)] dark:from-[hsl(150_20%_12%)] dark:via-white/[0.03] dark:to-transparent",
  gold: "bg-gradient-to-br from-[hsl(43_45%_96%)] via-[hsl(36_38%_98%)] to-white/40 dark:from-[hsl(43_28%_12%)] dark:via-white/[0.03] dark:to-transparent",
};

const blobColors: Record<StatCardTone, string> = {
  rose: "bg-[hsl(340_50%_75%)]",
  blush: "bg-[hsl(350_45%_80%)]",
  featured: "bg-[hsl(340_45%_68%)]",
  sage: "bg-[hsl(150_30%_58%)]",
  gold: "bg-[hsl(43_55%_62%)]",
};

export const StatCard = ({
  label,
  value,
  animateTo,
  formatAnimated = (n) => n.toLocaleString(),
  decimals = 0,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
  variant = "default",
  tone = "rose",
  featured = false,
  motionDelay = 0,
}: StatCardProps) => {
  const count = useCountUp(animateTo ?? 0, 1200, decimals);
  const display =
    animateTo !== undefined
      ? formatAnimated(count)
      : typeof value === "number"
        ? value.toLocaleString()
        : value;

  const surface =
    variant === "glass"
      ? cn(
          "backdrop-blur-xl",
          toneSurfaces[tone],
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_28px_rgba(45,35,48,0.06)]",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_32px_rgba(0,0,0,0.28)]"
        )
      : cn("border border-border/30 bg-card shadow-sm", toneSurfaces[tone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: motionDelay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -2,
        scale: featured ? 1.015 : 1.02,
        transition: { duration: 0.22 },
      }}
      className={cn(
        "group relative overflow-hidden rounded-[1.15rem] p-5 sm:p-6",
        surface,
        featured && "ring-1 ring-white/60 dark:ring-white/10",
        className
      )}
    >
      {/* Soft shine for featured */}
      {featured && (
        <div
          className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-white/50 to-transparent opacity-80 blur-2xl dark:from-white/10"
          aria-hidden
        />
      )}

      {/* Icon color blob */}
      {Icon && (
        <div
          className={cn(
            "pointer-events-none absolute -right-4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full opacity-35 blur-2xl transition-all duration-500 group-hover:opacity-50 group-hover:blur-3xl",
            blobColors[tone]
          )}
          aria-hidden
        />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-body font-medium uppercase tracking-[0.16em] text-muted-foreground/75">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 font-display tabular-nums tracking-[-0.03em] text-foreground",
              featured ? "text-3xl font-bold sm:text-[2.1rem]" : "text-[1.65rem] font-semibold sm:text-[1.85rem]"
            )}
          >
            {display}
          </p>
          {change && (
            <p
              className={cn("mt-1.5 text-xs font-body font-medium", {
                "text-sage": changeType === "positive",
                "text-terracotta": changeType === "negative",
                "text-muted-foreground": changeType === "neutral",
              })}
            >
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="relative">
            <div
              className={cn(
                "absolute inset-0 scale-150 rounded-2xl opacity-30 blur-md",
                blobColors[tone]
              )}
              aria-hidden
            />
            <div
              className={cn(
                "relative rounded-xl bg-white/70 p-2.5 text-foreground/55 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 dark:bg-white/10 dark:text-white/70"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.35} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
