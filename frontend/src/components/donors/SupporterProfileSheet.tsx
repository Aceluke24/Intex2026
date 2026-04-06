import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Supporter, TimelineEntry } from "@/lib/donorsContributionsMockData";
import { format } from "date-fns";
import {
  Clock,
  DollarSign,
  Gift,
  Mail,
  Phone,
  Share2,
  Timer,
  UserMinus,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";

type SupporterProfileSheetProps = {
  supporter: Supporter;
  timeline: TimelineEntry[];
  notes: string;
  onNotesChange: (v: string) => void;
  onMarkInactive: () => void;
  onEdit: () => void;
};

const timelineIcon = (kind: TimelineEntry["kind"]) => {
  switch (kind) {
    case "monetary":
      return DollarSign;
    case "volunteer":
      return Timer;
    case "skills":
      return Wrench;
    case "in-kind":
      return Gift;
    case "social":
      return Share2;
    default:
      return Clock;
  }
};

export function SupporterProfileSheet({
  supporter,
  timeline,
  notes,
  onNotesChange,
  onMarkInactive,
  onEdit,
}: SupporterProfileSheetProps) {
  const b = supporter.breakdown;

  return (
    <div className="flex h-full flex-col">
      <div className="relative shrink-0 px-6 pb-4 pt-6">
        <div className="pointer-events-none absolute -right-16 -top-10 h-40 w-40 rounded-full bg-[hsl(340_45%_88%)]/40 blur-3xl dark:bg-[hsl(340_30%_30%)]/30" />
        <div className="relative">
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80">Supporter</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">{supporter.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="rounded-lg border-0 bg-white/80 px-2.5 py-0.5 font-body text-xs font-medium dark:bg-white/10"
            >
              {supporter.kind}
            </Badge>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 font-body text-xs font-medium",
                supporter.status === "Active"
                  ? "bg-[hsl(150_25%_92%)] text-[hsl(150_30%_28%)] dark:bg-[hsl(150_25%_16%)] dark:text-[hsl(150_25%_82%)]"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  supporter.status === "Active" ? "bg-sage" : "bg-muted-foreground/50"
                )}
              />
              {supporter.status}
            </span>
          </div>
          <div className="mt-6 space-y-2 font-body text-sm text-muted-foreground">
            <a href={`mailto:${supporter.email}`} className="flex items-center gap-2.5 transition-colors hover:text-foreground">
              <Mail className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} />
              {supporter.email}
            </a>
            <p className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} />
              {supporter.phone}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-6">
        <div className="space-y-10 pb-28 pt-2">
          <section>
            <h3 className="font-body text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">Activity</h3>
            <ul className="mt-4 space-y-0">
              {timeline.map((t, i) => {
                const Icon = timelineIcon(t.kind);
                return (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.35 }}
                    className="relative flex gap-4 pb-8 pl-1 last:pb-2"
                  >
                    <div
                      className={cn(
                        "absolute bottom-0 left-[15px] top-8 w-px bg-gradient-to-b from-[hsl(340_30%_88%)] to-transparent dark:from-white/10",
                        i === timeline.length - 1 && "hidden"
                      )}
                    />
                    <div className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm dark:bg-white/10">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="font-display text-sm font-semibold text-foreground">{t.title}</p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">{t.detail}</p>
                      <p className="mt-2 font-body text-[11px] text-muted-foreground/75">
                        {format(new Date(t.at), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </section>

          <section>
            <h3 className="font-body text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">Contribution mix</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Monetary", value: `$${b.monetary.toLocaleString()}`, sub: "lifetime" },
                { label: "Time", value: `${b.timeHours} hrs`, sub: "logged" },
                { label: "Skills", value: `${b.skillsSessions}`, sub: "sessions" },
                { label: "In-kind", value: `$${b.inKindValue.toLocaleString()}`, sub: "est. value" },
                { label: "Social", value: `${b.socialActions}`, sub: "actions" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl bg-white/55 px-3 py-3 shadow-[0_2px_12px_rgba(45,35,48,0.04)] dark:bg-white/[0.05]"
                >
                  <p className="font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">{row.label}</p>
                  <p className="mt-1 font-display text-lg font-semibold tabular-nums text-foreground">{row.value}</p>
                  <p className="font-body text-[11px] text-muted-foreground">{row.sub}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-body text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Private notes for your team…"
              className="mt-3 min-h-[100px] resize-none rounded-2xl border-0 bg-white/70 font-body shadow-inner dark:bg-white/5"
            />
          </section>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-white/50 bg-[hsl(36_33%_98%)]/90 px-6 py-4 backdrop-blur-md dark:border-white/5 dark:bg-[hsl(213_45%_8%)]/92">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 rounded-xl font-body text-muted-foreground hover:text-foreground sm:flex-none"
            onClick={onMarkInactive}
          >
            <UserMinus className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
            Mark inactive
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            className="flex-1 rounded-xl bg-gradient-to-r from-[hsl(340_42%_72%)] to-[hsl(10_48%_62%)] font-body font-medium text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] sm:flex-none sm:px-6"
          >
            Edit profile
          </Button>
        </div>
      </div>
    </div>
  );
}
