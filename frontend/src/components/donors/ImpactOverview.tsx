import type { AllocationSlice, FeedEntry } from "@/lib/donorsTypes";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AllocationVisualization } from "./AllocationVisualization";
import { ContributionTimeline } from "./ContributionTimeline";

type ImpactOverviewProps = {
  feed: FeedEntry[];
  allocation: AllocationSlice[];
};

export function ImpactOverview({ feed, allocation }: ImpactOverviewProps) {
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="mb-24"
    >
      <div className="mb-12 max-w-2xl">
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">Impact overview</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-[2.1rem]">
          Momentum across giving and placement
        </h2>
        <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground/95">
          Follow recent activity and how resources move through safehouses and programs — a snapshot your team can trust at a glance.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">Contribution timeline</h3>
              <p className="mt-1 font-body text-sm text-muted-foreground">Latest entries across channels</p>
            </div>
            <button
              type="button"
              onClick={() => setTimelineCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/55 bg-white/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/[0.08]"
            >
              {timelineCollapsed ? "Expand" : "Collapse"}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", timelineCollapsed ? "rotate-180" : "rotate-0")} />
            </button>
          </div>
          <div
            className="rounded-[1.5rem] border border-white/45 bg-gradient-to-b from-white/60 to-[hsl(350_28%_99%)]/40 p-5 shadow-[0_8px_48px_rgba(45,35,48,0.05)] backdrop-blur-md dark:border-white/10 dark:from-white/[0.06] dark:to-transparent"
          >
            {!timelineCollapsed && (
              <ContributionTimeline entries={feed} emptyMessage="No activity yet." />
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <AllocationVisualization data={allocation} />
        </div>
      </div>
    </motion.section>
  );
}
