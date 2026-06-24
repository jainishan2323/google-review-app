import { Card } from "@/components/ui/card";

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

// Stat-card placeholders matching ReviewStatsCards' grid (3-up, centered content).
export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl mx-auto w-full">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="items-center gap-3 px-5 py-4">
          <Bar className="h-4 w-24" />
          <Bar className="h-9 w-20" />
          <Bar className="h-4 w-32" />
        </Card>
      ))}
    </div>
  );
}

// A single review row placeholder (grey card, matching ReviewCard).
function ReviewRowSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Bar className="h-4 w-32" />
          <Bar className="h-3 w-24" />
        </div>
        <Bar className="h-5 w-24 rounded-4xl" />
      </div>
      <Bar className="h-4 w-full" />
      <Bar className="h-4 w-3/4" />
      <Bar className="h-8 w-40 rounded-md" />
    </div>
  );
}

// The list region only — used as the Suspense fallback on filter changes.
export function ReviewListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div>
      <Bar className="h-4 w-64 mb-4 mx-auto" />
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <ReviewRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Full-page skeleton — the route-level loading.tsx fallback on first load.
export function ReviewsPageSkeleton() {
  return (
    <main className="p-8 space-y-6 max-w-6xl mx-auto">
      <Bar className="h-8 w-48" />
      <StatsCardsSkeleton />
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto w-full">
        <Bar className="h-9 w-80 rounded-lg" />
        <Bar className="h-9 w-48 rounded-lg" />
      </div>
      <Bar className="h-px w-full" />
      <div className="max-w-3xl mx-auto w-full">
        <ReviewListSkeleton />
      </div>
    </main>
  );
}
