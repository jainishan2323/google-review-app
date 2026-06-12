# Symmetric share CTAs on both rating paths

The form's review-ready screen offers two share actions — **Copy & Post to Google** (public) and **Send privately to the manager** — and which one is the filled primary button depends on the star rating (Google primary at ≥4★, private primary at <4★). We render both actions from a **single button definition each**, flipping only their **order** and the primary/secondary variant by rating, so the two rating paths are structurally identical: same labels, same weights, same affordances. The public path is **never** a faint text link or otherwise de-emphasised on the low-rating screen.

## Why

Google's 2026 prohibited-content policy bans **review gating** — selectively steering customers toward the public review path based on predicted sentiment. Our position (see `docs/compliance/tasks.md`): *branching what you ask is fine; branching, pressuring, or de-emphasising what reaches Google is not.* The line is **access**, not **ordering**. Both options remain equal-weight buttons reachable from both screens; only their order reflects context (an unhappy customer is offered the private channel first). Making the public CTA smaller/fainter on low ratings — which maximises Google conversions — is exactly the gating pattern, so we don't.

## Considered options

- **Keep the conversion-optimised faint link** (low-rating Google option as `text-muted-foreground`, no border). Rejected: this is sentiment-based de-emphasis of the public path = gating.
- **Remove the rating-based funnel entirely** (one identical screen for all ratings). Rejected as heavier than needed: ordering by context is defensible as long as access is symmetric, and offering an unhappy customer the private channel first is a genuine UX good, not a steer.
- **Symmetric equal-weight buttons, order flips by rating** (chosen).

## Consequences

The two CTAs are factored as shared helpers (`postToGoogleButton`/`sendPrivatelyButton` in `ReviewForm.tsx`) precisely so the symmetry can't silently drift — the previous asymmetry crept in because the paths were two hand-written blocks. A future change that re-introduces a weight/label difference between the paths should be treated as a compliance regression, not a styling tweak.
