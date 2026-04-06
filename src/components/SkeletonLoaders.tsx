import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("rounded-2xl bg-card p-6 space-y-3", className)}>
    <Skeleton className="h-3 w-20 rounded-full" />
    <Skeleton className="h-8 w-28 rounded-full" />
    <Skeleton className="h-3 w-16 rounded-full" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-2xl bg-card overflow-hidden">
    <div className="p-5 flex gap-4">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
    <div className="divide-y divide-border/30">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-5 flex items-center gap-5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart = ({ className }: { className?: string }) => (
  <div className={cn("rounded-2xl bg-card p-8 space-y-4", className)}>
    <Skeleton className="h-4 w-32 rounded-full" />
    <Skeleton className="h-52 w-full rounded-xl" />
  </div>
);
