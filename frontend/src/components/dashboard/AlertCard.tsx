import { cn } from "@/lib/utils";
import type { AttentionItem } from "@/lib/dashboardMockData";
import { ArrowRight, AlertCircle, Clock } from "lucide-react";

type AlertCardProps = {
  item: AttentionItem;
};

export function AlertCard({ item }: AlertCardProps) {
  const isReview = item.severity === "review";
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl pl-1 transition-all duration-200 ease-out",
        "shadow-[0_1px_4px_rgba(45,35,48,0.05)]",
        "hover:-translate-y-0.5 hover:shadow-[0_10px_32px_rgba(45,35,48,0.08)]",
        isReview ? "bg-[hsl(38,40%,98%)]" : "bg-[hsl(350,35%,99%)]"
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 rounded-l-2xl",
          isReview ? "bg-[hsl(32,45%,72%)]" : "bg-[hsl(340,38%,78%)]"
        )}
        aria-hidden
      />
      <div className="flex gap-4 p-5 pl-6">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isReview ? "bg-[hsl(38,42%,93%)] text-[hsl(28,32%,38%)]" : "bg-[hsl(350,32%,94%)] text-[hsl(330,28%,44%)]"
          )}
          aria-hidden
        >
          {isReview ? <AlertCircle className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Clock className="h-[18px] w-[18px]" strokeWidth={1.75} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-body text-[15px] font-semibold leading-snug text-foreground">{item.title}</p>
          <p className="mt-1.5 font-body text-[13px] leading-relaxed text-muted-foreground">{item.detail}</p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-[hsl(340,32%,42%)] transition-colors hover:text-foreground"
          >
            Review
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
