import { Star } from "lucide-react";

/**
 * Branded placeholder shown while the form's data streams in (Suspense fallback
 * and route loading.tsx). Mirrors the step-1 star screen so there's no reflow or
 * blank frame when the real form mounts — important on slow connections.
 *
 * Server component: renders to static SVG/HTML with no client JS.
 */
export function FormSkeleton() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      {/* logo placeholder — reserves the same h-14 box the real logo uses */}
      <div className="h-14 w-40 animate-pulse rounded-md bg-muted" />

      {/* welcome message placeholder — same min-h-14 slot the real welcome text
          uses, so the skeleton→form swap doesn't reflow and shift the stars */}
      <div className="flex min-h-14 w-full max-w-xs flex-col items-center justify-center gap-2">
        <div className="h-5 w-56 animate-pulse rounded bg-muted" />
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      </div>

      {/* star row — each star wrapped in the same p-1 box the real form's star
          buttons use, so the row is the exact same height and the centered
          column doesn't recenter (and shift the stars) on the skeleton→form swap */}
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="p-1">
            <Star
              className="size-14 text-muted animate-pulse"
              style={{ fill: "transparent", strokeWidth: 1.5 }}
            />
          </div>
        ))}
      </div>

      {/* h-5 matches the text-sm "Tap a star to rate" line the real form renders */}
      <div className="h-5 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}
