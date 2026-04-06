import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("rounded-xl border border-border bg-card p-5 space-y-3", className)}>
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-7 w-28" />
    <Skeleton className="h-3 w-16" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="p-4 border-b border-border flex gap-4">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-9 w-32" />
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart = ({ className }: { className?: string }) => (
  <div className={cn("rounded-xl border border-border bg-card p-6 space-y-4", className)}>
    <Skeleton className="h-5 w-40" />
    <Skeleton className="h-48 w-full rounded-lg" />
  </div>
);
