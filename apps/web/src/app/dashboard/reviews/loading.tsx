export default function ReviewsLoading() {
  return (
    <main className="p-8 space-y-8 max-w-5xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded bg-muted" />
          <div className="h-4 w-56 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 rounded-full bg-muted" />
          <div className="h-9 w-32 rounded bg-muted" />
          <div className="h-9 w-32 rounded bg-muted" />
        </div>
      </div>

      <div className="h-px bg-muted" />

      {/* Review cards */}
      <div className="max-w-3xl space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-full bg-muted" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-4/5 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
