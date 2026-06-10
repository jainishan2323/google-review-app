import { ComingSoon } from "@/components/ComingSoon";

// Phase 2 surface — review analytics (sentiment, operational zones, unmapped
// insights) builds on connected Google reviews + an analysed taxonomy. Kept in
// the nav as "coming soon" until the Google connection ships.
// See docs/adr/0003-google-signin-split-identity-then-authorization.md
export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Analytics"
      description="Sentiment trends, operational zones, and the themes hiding in your reviews — all coming once your Google Business Profile is connected."
    />
  );
}
