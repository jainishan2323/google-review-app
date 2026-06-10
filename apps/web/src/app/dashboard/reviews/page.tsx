import { ComingSoon } from "@/components/ComingSoon";

// Phase 2 surface — depends on live Google Business Profile reviews, which
// require the deferred `business.manage` connection. Kept in the nav as
// "coming soon" until then.
// See docs/adr/0003-google-signin-split-identity-then-authorization.md
export default function ReviewsPage() {
  return (
    <ComingSoon
      title="Google Reviews"
      description="Once you connect your Google Business Profile, your reviews will appear here — ready to read, reply to, and analyse. We're putting the finishing touches on it."
    />
  );
}
