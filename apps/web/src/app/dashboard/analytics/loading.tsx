export default function AnalyticsLoading() {
  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto animate-pulse">
      {/* Header + range controls */}
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

      {/* Stats strip — 4 cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-9 w-16 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* 3-col: overall sentiment + top love + top fix */}
      <div className="grid gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-24 w-full rounded bg-muted" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center justify-between gap-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Review volume chart card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-44 rounded bg-muted" />
            <div className="h-3 w-56 rounded bg-muted" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-5 w-36 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
        </div>
        <div className="h-56 w-full rounded bg-muted" />
      </div>

      {/* Operational zones card */}
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div className="h-4 w-36 rounded bg-muted" />
        <div className="h-3 w-64 rounded bg-muted" />
        <div className="h-48 w-full rounded bg-muted mt-2" />
      </div>

      {/* Unmapped insights card */}
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div className="h-4 w-36 rounded bg-muted" />
        <div className="h-3 w-64 rounded bg-muted" />
        <div className="flex flex-wrap gap-2 mt-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-7 rounded-full bg-muted"
              style={{ width: `${60 + (i * 19) % 58}px` }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
