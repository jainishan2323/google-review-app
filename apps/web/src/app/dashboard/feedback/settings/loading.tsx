export default function FeedbackSettingsLoading() {
  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2 animate-pulse">
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>

      <div className="h-px bg-muted" />

      {/* 2-col layout matching FormConfigEditor */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,360px)] gap-10">
        {/* Left: form sections skeleton */}
        <div className="space-y-6 animate-pulse">
          {/* Brand + logo + language card */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
            <div className="h-10 rounded bg-muted" />
          </div>
          {/* Welcome message card */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
          {/* Categories */}
          <div className="space-y-3">
            <div className="h-6 w-28 rounded bg-muted" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-7 w-20 rounded-full bg-muted" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: phone frame — chrome is live, interior shows skeleton */}
        <div className="hidden lg:flex flex-col items-center gap-3">
          <p className="self-start text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Live preview
          </p>
          {/* Phone chrome — matches FormPreview exactly */}
          <div className="w-72 rounded-[2.5rem] bg-zinc-900 p-2.5 shadow-2xl ring-1 ring-white/10">
            <div className="relative flex h-6 items-center justify-center rounded-t-[1.6rem] bg-white">
              <div className="absolute left-1/2 top-0 h-4 w-14 -translate-x-1/2 rounded-b-xl bg-zinc-900" />
            </div>
            <div className="h-[min(560px,calc(100dvh-12rem))] overflow-hidden rounded-b-[1.6rem] bg-white p-5 flex flex-col items-center justify-center gap-4 animate-pulse">
              {/* Logo placeholder */}
              <div className="h-8 w-24 rounded bg-gray-200" />
              {/* Welcome text */}
              <div className="space-y-1.5 w-full max-w-[160px]">
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-3/4 mx-auto rounded bg-gray-200" />
              </div>
              {/* Star row */}
              <div className="flex gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-8 rounded bg-gray-200" />
                ))}
              </div>
              {/* "Tap a star" hint */}
              <div className="h-3 w-20 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
