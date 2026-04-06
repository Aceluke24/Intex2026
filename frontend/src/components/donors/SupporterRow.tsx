import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Supporter } from "@/lib/donorsContributionsMockData";
import { format } from "date-fns";
import { Eye, Pencil } from "lucide-react";
import { motion } from "framer-motion";

type SupporterRowProps = {
  supporter: Supporter;
  onOpen: () => void;
  onEdit?: () => void;
  style?: React.CSSProperties;
  index?: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const kindPill: Record<string, string> = {
  Monetary:
    "border border-[hsl(340_35%_88%)]/80 bg-gradient-to-br from-[hsl(340_42%_97%)] to-white/60 text-[hsl(340_38%_30%)] backdrop-blur-sm dark:border-white/10 dark:from-[hsl(340_25%_18%)] dark:to-transparent dark:text-[hsl(340_45%_88%)]",
  Volunteer:
    "border border-[hsl(150_25%_85%)]/90 bg-gradient-to-br from-[hsl(150_28%_96%)] to-white/50 text-[hsl(150_30%_26%)] backdrop-blur-sm dark:border-white/10 dark:from-[hsl(150_22%_16%)] dark:to-transparent dark:text-[hsl(150_30%_85%)]",
  Skills:
    "border border-[hsl(43_35%_85%)]/90 bg-gradient-to-br from-[hsl(43_40%_96%)] to-white/50 text-[hsl(43_42%_26%)] backdrop-blur-sm dark:border-white/10 dark:from-[hsl(43_28%_14%)] dark:to-transparent dark:text-[hsl(43_40%_85%)]",
  Social:
    "border border-[hsl(280_30%_90%)]/90 bg-gradient-to-br from-[hsl(280_35%_97%)] to-white/50 text-[hsl(280_32%_30%)] backdrop-blur-sm dark:border-white/10 dark:from-[hsl(280_22%_16%)] dark:to-transparent dark:text-[hsl(280_35%_88%)]",
};

export function SupporterRow({ supporter, onOpen, onEdit, style, index = 0 }: SupporterRowProps) {
  const last = format(new Date(supporter.lastActivity), "MMM d, yyyy");
  const isActive = supporter.status === "Active";

  return (
    <motion.div
      role="button"
      tabIndex={0}
      layout
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.4 }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative flex w-full cursor-pointer items-center gap-0 overflow-hidden rounded-[1.15rem] pl-1 pr-4 py-3.5 text-left outline-none",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_16px_rgba(45,35,48,0.04)]",
        "bg-gradient-to-r from-white/70 via-[hsl(36_35%_99%)]/90 to-white/55 backdrop-blur-md",
        "transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(45,35,48,0.08)]",
        "dark:from-white/[0.06] dark:via-white/[0.04] dark:to-white/[0.05] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        "focus-visible:ring-2 focus-visible:ring-[hsl(340_35%_70%)]/35"
      )}
    >
      {/* Hover sweep */}
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100 dark:via-white/[0.04]"
        aria-hidden
      />

      {/* Left accent */}
      <div
        className="relative mr-3 w-1 shrink-0 self-stretch rounded-full bg-gradient-to-b from-[hsl(340_48%_78%)] via-[hsl(350_42%_82%)] to-[hsl(25_45%_80%)] opacity-80 shadow-[0_0_12px_rgba(200,130,150,0.35)]"
        aria-hidden
      />

      <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-4">
        <div className="relative shrink-0">
          {isActive && (
            <motion.span
              className="absolute inset-[-4px] rounded-full bg-[hsl(150_40%_45%)]/25"
              animate={{ opacity: [0.45, 0.85, 0.45], scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <Avatar
            className={cn(
              "relative h-12 w-12 border-2 shadow-sm",
              isActive ? "border-white ring-2 ring-[hsl(150_35%_55%)]/40" : "border-white/70 dark:border-white/15"
            )}
          >
            <AvatarFallback
              className={cn(
                "font-display text-sm font-semibold text-foreground/85",
                "bg-gradient-to-br from-[hsl(340_48%_88%)] via-[hsl(350_35%_90%)] to-[hsl(25_42%_88%)]"
              )}
            >
              {initials(supporter.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-base font-semibold tracking-[-0.02em] text-foreground">{supporter.name}</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold tracking-wide",
                kindPill[supporter.kind] ?? kindPill.Monetary
              )}
            >
              {supporter.kind}
            </span>
          </div>
          <p className="mt-1 truncate font-body text-xs text-muted-foreground/90">{supporter.email}</p>
        </div>

        <div className="hidden w-[5.5rem] shrink-0 sm:block">
          <span className="flex items-center gap-2 font-body text-xs font-medium">
            {isActive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-sage opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sage shadow-[0_0_10px_hsl(var(--sage))]" />
                </span>
                <span className="text-[hsl(150_28%_32%)] dark:text-[hsl(150_25%_72%)]">Active</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-muted-foreground/35" />
                <span className="text-muted-foreground">Inactive</span>
              </>
            )}
          </span>
        </div>

        <div className="hidden w-[5.5rem] shrink-0 text-right font-body text-sm tabular-nums font-semibold text-foreground/95 md:block">
          ${supporter.totalContributionsValue.toLocaleString()}
        </div>

        <div className="hidden w-[6.5rem] shrink-0 text-right font-body text-xs text-muted-foreground lg:block">
          {last}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-all duration-300 group-hover:opacity-100 sm:opacity-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-white/80 hover:text-foreground dark:hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            <Eye className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-white/80 hover:text-foreground dark:hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
