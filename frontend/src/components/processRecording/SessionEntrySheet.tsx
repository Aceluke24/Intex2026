import { ScrollArea } from "@/components/ui/scroll-area";
import type { EmotionalTag, ProcessSessionEntry } from "@/lib/processRecordingMockData";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { BookOpen, Heart, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ElementType } from "react";

const emotionalStyles: Record<EmotionalTag, string> = {
  Stable: "bg-[hsl(150_22%_92%)] text-[hsl(150_28%_28%)] dark:bg-[hsl(150_18%_16%)] dark:text-[hsl(150_30%_78%)]",
  Anxious: "bg-[hsl(43_40%_92%)] text-[hsl(43_35%_28%)] dark:bg-[hsl(43_24%_14%)] dark:text-[hsl(43_40%_82%)]",
  Hopeful:
    "bg-[hsl(340_32%_94%)] text-[hsl(340_32%_30%)] dark:bg-[hsl(340_22%_16%)] dark:text-[hsl(340_35%_88%)]",
  Distressed: "bg-[hsl(0_28%_94%)] text-[hsl(0_30%_34%)] dark:bg-[hsl(0_22%_16%)] dark:text-[hsl(0_28%_78%)]",
  Resilient: "bg-[hsl(150_25%_93%)] text-[hsl(160_22%_28%)] dark:bg-[hsl(150_18%_15%)] dark:text-[hsl(150_28%_80%)]",
  Withdrawn: "bg-[hsl(210_18%_93%)] text-[hsl(210_22%_32%)] dark:bg-[hsl(210_20%_14%)] dark:text-[hsl(210_20%_78%)]",
};

function JournalBlock({
  icon: Icon,
  title,
  children,
  delay,
}: {
  icon: ElementType;
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-3"
    >
      <h3 className="flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
        <Icon className="h-3.5 w-3.5 opacity-70" strokeWidth={1.5} />
        {title}
      </h3>
      <div className="rounded-[1rem] bg-white/50 px-4 py-4 font-body text-[15px] leading-[1.75] text-foreground/92 shadow-inner dark:bg-white/[0.06]">
        {children}
      </div>
    </motion.section>
  );
}

export function SessionEntrySheet({ entry }: { entry: ProcessSessionEntry }) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/45 px-6 pb-6 pt-8 dark:border-white/10">
        <p className="font-mono text-[11px] font-medium text-muted-foreground">{entry.id}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">Session record</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          {format(new Date(entry.date), "EEEE, MMMM d, yyyy")} · {entry.worker} · {entry.sessionType}
        </p>
        <div className="mt-4">
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 font-body text-[11px] font-semibold tracking-wide",
              emotionalStyles[entry.emotionalState]
            )}
          >
            Emotional tone: {entry.emotionalState}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-10 py-8 pb-24">
          <JournalBlock icon={Heart} title="Emotional state observed" delay={0.06}>
            {entry.emotionalObserved}
          </JournalBlock>
          <JournalBlock icon={BookOpen} title="Narrative summary" delay={0.1}>
            {entry.narrativeFull}
          </JournalBlock>
          <JournalBlock icon={Sparkles} title="Interventions applied" delay={0.14}>
            {entry.interventions}
          </JournalBlock>
          <JournalBlock icon={ListChecks} title="Follow-up actions" delay={0.18}>
            {entry.followUp}
          </JournalBlock>
        </div>
      </ScrollArea>
    </div>
  );
}
