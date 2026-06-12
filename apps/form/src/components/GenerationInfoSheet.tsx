"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom-sheet explainer for the review-ready screen: tells the customer why the
 * draft reads the way it does, so a star rating whose tone they didn't expect
 * (e.g. a measured 3★ review) doesn't read as a bug.
 *
 * The mood ladder MUST stay faithful to the generator's actual rating bands
 * (review-generator.ts: 1–2 / 3 / 4–5). English-only for now, matching the rest
 * of the step-3 chrome.
 */

type BandKey = "low" | "mid" | "high";

const BANDS: { key: BandKey; stars: string; mood: string; desc: string }[] = [
  { key: "low", stars: "1–2★", mood: "Honest", desc: "Names what fell short — direct, but not piling on." },
  { key: "mid", stars: "3★", mood: "Balanced", desc: "A fair mix of good and not-so-good. Lands lukewarm." },
  { key: "high", stars: "4–5★", mood: "Warm", desc: "Genuinely positive, like a happy regular." },
];

function bandFor(rating: number): BandKey {
  if (rating <= 2) return "low";
  if (rating === 3) return "mid";
  return "high";
}

export function GenerationInfoSheet({
  rating,
  brandColor,
  onClose,
}: {
  rating: number;
  brandColor: string;
  onClose: () => void;
}) {
  // Lock background scroll and close on Escape while the sheet is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const current = bandFor(rating);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="How your review was written"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
      />

      <div
        className="relative rounded-t-2xl border-t border-border p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted" aria-hidden />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground touch-manipulation"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-base font-semibold text-foreground">How your review was written</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your star rating sets the tone. The chips you tapped — and anything you typed — set what
          it talks about. AI writes the wording.
        </p>

        <ul className="mt-4 space-y-2">
          {BANDS.map((band) => {
            const active = band.key === current;
            return (
              <li
                key={band.key}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-3 py-2.5",
                  active ? "border-transparent" : "border-border"
                )}
                style={active ? { backgroundColor: `${brandColor}14` } : undefined}
              >
                <span
                  className="mt-0.5 w-12 shrink-0 text-sm font-semibold"
                  style={{ color: active ? brandColor : "var(--muted-foreground)" }}
                >
                  {band.stars}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{band.mood}</span>
                    {active && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        Your rating
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{band.desc}</span>
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs text-muted-foreground">
          It only uses what you told us — it won&apos;t invent things you didn&apos;t mention. You
          can edit the draft, or tap &ldquo;Generate another version&rdquo;.
        </p>
      </div>
    </div>
  );
}
