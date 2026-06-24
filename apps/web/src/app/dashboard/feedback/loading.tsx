export default function FeedbackLoading() {
  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-muted" />
        <div className="h-4 w-52 rounded bg-muted" />
      </div>

      <div className="h-px bg-muted" />

      {/* Feedback cards */}
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-5 w-10 rounded-full bg-muted" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
