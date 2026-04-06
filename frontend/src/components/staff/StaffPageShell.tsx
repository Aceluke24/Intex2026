import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import watermarkSrc from "@/img/NorthStarLogo.png";

const ease = [0.22, 1, 0.36, 1] as const;

type StaffPageShellProps = {
  /** Small label above title, e.g. "Case management" */
  eyebrow: string;
  eyebrowIcon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Slightly softer hero for reflective pages */
  tone?: "default" | "quiet";
  className?: string;
};

/**
 * Shared staff-portal page frame: cream→blush gradient, radial glows, grain, watermark.
 * Matches Dashboard / Donors / Caseload visual language.
 */
export function StaffPageShell({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  actions,
  children,
  tone = "default",
  className,
}: StaffPageShellProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14",
        "bg-gradient-to-b from-[hsl(36_34%_96%)] via-[hsl(350_28%_96%)] to-[hsl(340_26%_95%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
        "dark:from-[hsl(213_40%_9%)] dark:via-[hsl(213_34%_9%)] dark:to-[hsl(340_22%_9%)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -left-20 top-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,hsl(340_36%_88%)/0.42_0%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,hsl(340_30%_32%)/0.22_0%,transparent_72%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,hsl(25_32%_88%)/0.32_0%,transparent_68%)] blur-3xl dark:opacity-40"
        aria-hidden
      />

      <div className="donors-page-grain pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.34]" aria-hidden />

      <img
        src={watermarkSrc}
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-0 top-6 h-48 w-auto max-w-[min(36%,280px)] opacity-[0.052] select-none sm:h-60 lg:right-8 lg:top-10"
      />

      <div className="relative z-[1]">
        <header className="relative mb-12 lg:mb-16">
          <div className="pointer-events-none absolute -left-6 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-[hsl(340_38%_90%)]/12 blur-3xl dark:bg-[hsl(340_28%_35%)]/12" />

          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className={cn(
                  "mb-3 inline-flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.22em]",
                  tone === "quiet" ? "text-muted-foreground/65" : "text-muted-foreground/72"
                )}
              >
                {eyebrowIcon}
                {eyebrow}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.02, ease }}
                className="font-display text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[2.45rem] lg:text-[2.75rem]"
              >
                {title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06, ease }}
                className={cn(
                  "mt-4 max-w-xl font-body leading-[1.65] text-muted-foreground/95 sm:text-[1.05rem]",
                  tone === "quiet" && "text-muted-foreground/88"
                )}
              >
                {description}
              </motion.p>
            </div>
            {actions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease }}
                className="flex flex-wrap items-center gap-3"
              >
                {actions}
              </motion.div>
            )}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
