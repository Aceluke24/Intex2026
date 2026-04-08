import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RecordCrudActions } from "@/components/ui/RecordCrudActions";
import { cn } from "@/lib/utils";
import type { Supporter } from "@/lib/donorsTypes";
import { formatDateSafe } from "@/lib/formatDate";
import { motion } from "framer-motion";

type SupporterCardProps = {
  supporter: Supporter;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
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

export function SupporterCard({ supporter, onOpen, onEdit, onDelete }: SupporterCardProps) {
  const last = formatDateSafe(supporter.lastActivity, "MMM d, yyyy");
  const isActive = supporter.status === "Active";

  return (
    <motion.article
      layout
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/50 p-5 outline-none",
        "bg-gradient-to-br from-white/75 via-[hsl(36_32%_99%)]/95 to-white/50 shadow-sm backdrop-blur-md",
        "transition-all duration-200 ease-out hover:scale-[1.01] hover:shadow-md",
        "dark:border-white/10 dark:from-white/[0.07] dark:via-transparent dark:to-transparent dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]",
        "focus-visible:ring-2 focus-visible:ring-[hsl(340_32%_65%)]/35"
      )}
    >
      <RecordCrudActions
        className="absolute right-3 top-3 z-10"
        onView={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <div className="flex items-start gap-3 pr-12">
        <div className="relative shrink-0">
          {isActive && (
            <span className="absolute inset-[-3px] rounded-full bg-[hsl(150_40%_45%)]/20 blur-sm" aria-hidden />
          )}
          <Avatar
            className={cn(
              "relative h-12 w-12 border-2 shadow-sm",
              isActive ? "border-white ring-2 ring-[hsl(150_35%_55%)]/35" : "border-white/70 dark:border-white/15"
            )}
          >
            <AvatarFallback
              className={cn(
                "bg-gradient-to-br from-[hsl(340_48%_88%)] via-[hsl(350_35%_90%)] to-[hsl(25_42%_88%)] font-display text-sm font-semibold text-foreground/85"
              )}
            >
              {initials(supporter.name)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">{supporter.name}</h3>
          <span
            className={cn(
              "mt-2 inline-flex rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold tracking-wide",
              kindPill[supporter.kind] ?? kindPill.Monetary
            )}
          >
            {supporter.kind}
          </span>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 font-body text-xs leading-relaxed text-muted-foreground">{supporter.email}</p>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-white/45 px-3 py-3 dark:bg-white/[0.04]">
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">Total</p>
          <p className="font-display text-lg font-bold tabular-nums tracking-tight text-foreground">
            ${supporter.totalContributionsValue.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">Last activity</p>
          <p className="font-body text-sm text-muted-foreground">{last}</p>
        </div>
      </div>
    </motion.article>
  );
}
