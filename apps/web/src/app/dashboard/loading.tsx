export default function DashboardLoading() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      {/* CTA placeholder */}
      <div className="h-16 rounded-lg bg-muted" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="h-6 w-14 rounded-full bg-muted" />
      </div>

      <div className="h-px bg-muted" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-4 rounded bg-muted" />
            </div>
            <div className="h-9 w-16 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="h-4 w-28 rounded bg-muted" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-4 rounded bg-muted" />
              <div className="h-2 flex-1 rounded-full bg-muted" />
              <div className="h-3 w-4 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 rounded-lg border bg-card p-6 space-y-4">
          <div className="h-4 w-28 rounded bg-muted" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-px bg-muted mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
