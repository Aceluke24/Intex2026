import { cn } from "@/lib/utils";
import type { EmotionalTag, ProcessSessionEntry } from "@/lib/processRecordingTypes";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Pencil, Trash2, User } from "lucide-react";
import { useState } from "react";

const emotionalStyles: Record<EmotionalTag, string> = {
  Stable: "bg-[hsl(150_22%_92%)] text-[hsl(150_28%_28%)] dark:bg-[hsl(150_18%_16%)] dark:text-[hsl(150_30%_78%)]",
  Anxious: "bg-[hsl(43_40%_92%)] text-[hsl(43_35%_28%)] dark:bg-[hsl(43_24%_14%)] dark:text-[hsl(43_40%_82%)]",
  Hopeful:
    "bg-[hsl(340_32%_94%)] text-[hsl(340_32%_30%)] dark:bg-[hsl(340_22%_16%)] dark:text-[hsl(340_35%_88%)]",
  Distressed: "bg-[hsl(0_28%_94%)] text-[hsl(0_30%_34%)] dark:bg-[hsl(0_22%_16%)] dark:text-[hsl(0_28%_78%)]",
  Resilient: "bg-[hsl(150_25%_93%)] text-[hsl(160_22%_28%)] dark:bg-[hsl(150_18%_15%)] dark:text-[hsl(150_28%_80%)]",
  Withdrawn: "bg-[hsl(210_18%_93%)] text-[hsl(210_22%_32%)] dark:bg-[hsl(210_20%_14%)] dark:text-[hsl(210_20%_78%)]",
};

type SessionTimelineProps = {
  entries: ProcessSessionEntry[];
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function SessionTimeline({ entries, onSelect, onEdit, onDelete }: SessionTimelineProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border/60 bg-white/35 px-8 py-16 text-center dark:bg-white/[0.04]">
        <p className="font-body text-sm font-medium text-foreground">No session entries yet</p>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Add a new entry or choose another resident to see the timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-2 sm:pl-4">
      <div
        className="absolute left-[11px] top-3 bottom-3 w-px sm:left-[19px]"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, hsl(340 42% 82% / 0.9) 0%, hsl(210 25% 85% / 0.5) 50%, hsl(36 35% 88% / 0.35) 100%)",
        }}
      />

      <ul className="space-y-6">
        {entries.map((entry, index) => (
          <li key={entry.id} className="relative flex gap-4 sm:gap-6">
            <div className="relative z-[1] flex w-6 shrink-0 flex-col items-center sm:w-10">
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 * index, duration: 0.35 }}
                className="mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-gradient-to-br from-[hsl(340_45%_78%)] to-[hsl(210_30%_82%)] shadow-[0_0_0_4px_rgba(255,255,255,0.65)] dark:border-[hsl(213_35%_14%)] dark:shadow-[0_0_0_4px_rgba(0,0,0,0.2)]"
              />
            </div>

            <motion.div
              role="button"
              tabIndex={0}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index, duration: 0.4 }}
              whileHover={{ y: -3, transition: { duration: 0.22 } }}
              onClick={() => onSelect(entry.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(entry.id);
                }
              }}
              className={cn(
                "group min-w-0 flex-1 cursor-pointer rounded-[1.1rem] border border-white/50 bg-white/55 p-4 text-left shadow-[0_4px_28px_rgba(45,35,48,0.05)] backdrop-blur-md",
                "transition-shadow duration-300 hover:border-white/80 hover:shadow-[0_14px_48px_rgba(45,35,48,0.1)]",
                "dark:border-white/10 dark:bg-white/[0.07] dark:hover:shadow-[0_14px_48px_rgba(0,0,0,0.35)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(340_32%_65%)]/35"
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)",
                }}
              />

              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                    {format(new Date(entry.date), "MMMM d, yyyy")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 font-body text-[11px] font-medium text-foreground/85 shadow-sm dark:bg-white/10">
                      <User className="h-3 w-3 opacity-60" strokeWidth={1.5} />
                      {entry.worker}
                    </span>
                    <span className="rounded-full border border-white/60 bg-[hsl(210_20%_96%)] px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-white/10 dark:bg-white/[0.08]">
                      {entry.sessionType}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-body text-[10px] font-semibold tracking-wide",
                        emotionalStyles[entry.emotionalState]
                      )}
                    >
                      {entry.emotionalState}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      type="button"
                      aria-label="Edit entry"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(entry.id);
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground dark:hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      aria-label="Delete entry"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(entry.id);
                      }}
                      className="rounded-lg p-1.5 text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground/90">{entry.id}</span>
                  <button
                    type="button"
                    aria-expanded={!!expanded[entry.id]}
                    aria-label={expanded[entry.id] ? "Collapse preview" : "Expand preview"}
                    onClick={(e) => toggle(entry.id, e)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground dark:hover:bg-white/10"
                  >
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform duration-200", expanded[entry.id] && "rotate-180")}
                    />
                  </button>
                </div>
              </div>

              <p className="relative mt-3 font-body text-sm leading-relaxed text-foreground/90 line-clamp-3">
                {entry.narrativePreview}
              </p>

              <AnimatePresence initial={false}>
                {expanded[entry.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-t border-white/45 pt-4 dark:border-white/10">
                      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
                        Emotional observation
                      </p>
                      <p className="mt-2 font-body text-sm leading-relaxed text-foreground/88">{entry.emotionalObserved}</p>
                      <p className="mt-3 font-body text-[11px] text-muted-foreground">
                        Click the card for the full session record.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </li>
        ))}
      </ul>
    </div>
  );
}
