// SEED-IMPORT (temporary scaffolding — remove when live Google data lands; see ADR-0020)
//
// Honest disclosure for the stopgap where we import a pilot's OWN Google reviews
// (scraped via Apify) so the Analytics dashboard has data before the Business
// Profile API is approved. This reconciles ADR-0003's principle ("don't show an
// owner fabricated reviews"): these are the owner's real reviews, shown WITH a
// banner that names them as imported and steers toward connecting Google.
//
// Gated by one server-side global flag (`SHOW_SAMPLE_DATA`) — Google approval is
// project-wide, so all pilots flip from sample to live together. Cutover order:
// purge seeded rows FIRST (purge-seed-reviews.ts), THEN flip the flag off.
import { Info } from "lucide-react";

export function SampleDataBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="text-sm text-foreground">
        Showing imported sample reviews — connect your Google Business Profile to bring in your own.
      </p>
    </div>
  );
}
