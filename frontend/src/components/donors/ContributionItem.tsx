import type { FeedEntry } from "@/lib/donorsTypes";
import { cn } from "@/lib/utils";
import { formatDateSafe } from "@/lib/formatDate";
import { Clock, DollarSign, Gift, HeartHandshake, Share2, Wrench } from "lucide-react";
import { motion } from "framer-motion";

const kindConfig: Record<
  FeedEntry["kind"],
  { icon: typeof DollarSign; label: string; accent: string; dot: string }
> = {
  monetary: {
    icon: DollarSign,
    label: "Monetary",
    accent: "text-[hsl(340_40%_42%)]",
    dot: "bg-[hsl(340_45%_72%)] shadow-[0_0_12px_hsl(340_50%_70%)]",
  },
  volunteer: {
    icon: HeartHandshake,
    label: "Volunteer",
    accent: "text-[hsl(150_28%_38%)]",
    dot: "bg-[hsl(150_35%_48%)] shadow-[0_0_12px_hsl(150_40%_45%)]",
  },
  skills: {
    icon: Wrench,
    label: "Skills",
    accent: "text-[hsl(43_40%_38%)]",
    dot: "bg-[hsl(43_50%_55%)] shadow-[0_0_12px_hsl(43_55%_50%)]",
  },
  "in-kind": {
    icon: Gift,
    label: "In-kind",
    accent: "text-[hsl(25_45%_42%)]",
    dot: "bg-[hsl(25_45%_58%)] shadow-[0_0_12px_hsl(25_50%_55%)]",
  },
  social: {
    icon: Share2,
    label: "Social",
    accent: "text-[hsl(280_35%_45%)]",
    dot: "bg-[hsl(280_40%_65%)] shadow-[0_0_12px_hsl(280_45%_60%)]",
  },
};

type ContributionItemProps = {
  entry: FeedEntry;
  index?: number;
  /** Vertical timeline with spine + nodes */
  variant?: "default" | "timeline";
  isLast?: boolean;
};

export function ContributionItem({ entry, index = 0, variant = "default", isLast = false }: ContributionItemProps) {
  const cfg = kindConfig[entry.kind] ?? kindConfig.monetary;
  const Icon = cfg.icon;
  const time = formatDateSafe(entry.at, "MMM d · h:mm a");

  const desc = entry.description ?? "";
  const amountNum = entry.amount != null && !Number.isNaN(Number(entry.amount)) ? Number(entry.amount) : undefined;
  const hoursNum = entry.hours != null && !Number.isNaN(Number(entry.hours)) ? Number(entry.hours) : undefined;

  const detail =
    amountNum !== undefined
      ? `$${amountNum.toLocaleString()} · ${desc}`
      : hoursNum !== undefined
        ? `${hoursNum} hrs · ${desc}`
        : desc;

  if (variant === "timeline") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 * index, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="group relative flex gap-0"
      >
        <div className="flex w-10 shrink-0 flex-col items-center pt-1">
          <div className={cn("z-[1] h-3 w-3 rounded-full ring-4 ring-white/90 dark:ring-[hsl(36_25%_12%)]", cfg.dot)} />
          {!isLast && (
            <div className="mt-1 w-px flex-1 min-h-[2.5rem] bg-gradient-to-b from-[hsl(340_30%_88%)] via-[hsl(340_20%_92%)] to-transparent dark:from-white/15 dark:via-white/8" />
          )}
        </div>
        <div
          className={cn(
            "min-w-0 flex-1 rounded-2xl px-4 py-3.5",
            "bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm",
            "transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-[0_12px_40px_rgba(45,35,48,0.06)]",
            "dark:bg-white/[0.04] dark:shadow-none dark:hover:bg-white/[0.07]"
          )}
        >
          <div className="flex gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white to-[hsl(350_30%_98%)] shadow-sm dark:from-white/10 dark:to-white/5",
                cfg.accent
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.4} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-display text-sm font-semibold tracking-tight text-foreground">{entry.supporterName}</span>
                <span className={cn("font-body text-[10px] font-semibold uppercase tracking-[0.12em]", cfg.accent)}>
                  {cfg.label}
                </span>
              </div>
              <p className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">{detail}</p>
              <p className="mt-2 flex items-center gap-1.5 font-body text-[11px] text-muted-foreground/75">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                {time}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="group relative flex gap-4 overflow-hidden rounded-2xl px-3 py-3.5"
    >
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-full group-hover:opacity-100 dark:via-white/[0.06]"
        aria-hidden
      />
      <div
        className={cn(
          "relative z-[1] mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white to-[hsl(350_25%_97%)] shadow-sm dark:from-white/10 dark:to-white/5",
          cfg.accent
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.4} />
      </div>
      <div className="relative z-[1] min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-display text-sm font-semibold text-foreground">{entry.supporterName}</span>
          <span className={cn("font-body text-[11px] font-medium uppercase tracking-wide", cfg.accent)}>{cfg.label}</span>
        </div>
        <p className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">{detail}</p>
        <p className="mt-2 flex items-center gap-1.5 font-body text-[11px] text-muted-foreground/80">
          <Clock className="h-3 w-3" strokeWidth={1.5} />
          {time}
        </p>
      </div>
    </motion.div>
  );
}
