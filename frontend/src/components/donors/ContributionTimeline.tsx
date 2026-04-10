import type { FeedEntry } from "@/lib/donorsTypes";
import { ContributionItem } from "./ContributionItem";

type ContributionTimelineProps = {
  entries: FeedEntry[];
  emptyMessage?: string;
  className?: string;
};

export function ContributionTimeline({
  entries,
  emptyMessage = "No contributions recorded yet.",
  className,
}: ContributionTimelineProps) {
  if (entries.length === 0) {
    return <p className={className ?? "py-24 text-center font-body text-sm text-muted-foreground"}>{emptyMessage}</p>;
  }

  return (
    <div className={className ?? "space-y-1"}>
      {entries.map((entry, i) => (
        <ContributionItem
          key={entry.id}
          entry={entry}
          index={i}
          variant="timeline"
          isLast={i === entries.length - 1}
        />
      ))}
    </div>
  );
}
