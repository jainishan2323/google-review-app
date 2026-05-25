export default function AnalyticsLoading() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded bg-muted" />
          <div className="h-4 w-44 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 rounded bg-muted" />
          <div className="h-9 w-28 rounded bg-muted" />
        </div>
      </div>

      <div className="h-px bg-muted" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-9 w-16 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-48 w-full rounded bg-muted" />
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
            <div className="h-4 w-28 rounded bg-muted" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex justify-between items-center">
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-5 w-10 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
