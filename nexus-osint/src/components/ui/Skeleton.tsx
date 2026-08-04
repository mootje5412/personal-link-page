import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-white/5 animate-pulse", className)} />
  );
}

export function ResultSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl col-span-2" />
      </div>
      <Skeleton className="h-48 w-full rounded-3xl" />
      <Skeleton className="h-36 w-full rounded-3xl" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
