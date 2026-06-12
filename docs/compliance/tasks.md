# Google Review Policy Compliance — Task List

Audit date: 2026-06-12 · Audited against Google's Prohibited & Restricted Content policy (early-2026 updates: on-premises pressure, staff-name solicitation, kiosks, gating, incentives, velocity/device patterns).

Rule of thumb behind every task: **branching what you ask is OK; branching, pressuring, or scripting what reaches Google is not.**

---

## P0 — Fix before any new business onboards

### 1. Remove the auto-redirect to Google ✅
- [x] Delete the "Taking you to Google in 0s…" countdown on the post-copy screen.
- [x] Going to Google happens only via a deliberate tap on "Open Google Reviews".
- **Why:** an automatic redirect is mechanized on-premises pressure — the exact pattern the 2026 update bans.
- **Done when:** no timer exists anywhere in the funnel; Google opens only on user tap.
- **Done:** timer mechanism deleted from `ReviewForm.tsx` (verified the only timer in the funnel; `PasteCoachmark` is cosmetic CSS). Also moved the `source = "google_redirect"` write off the copy step and onto the actual "Open Google Reviews" tap (`keepalive` fetch so it survives navigation), so the count now reflects real handoffs, not intent.

### 2. Ship the symmetric CTA design on the low-rating path ✅
- [x] Low-rating screen shows "Post to Google" as a real, equal-weight secondary button — never a faint text link.
- [x] Same two-button structure on both rating paths; only the order flips.
- [x] Copy is neutral and consistent — no "Still want to…?", no question mark, no confirm interstitial.
- **Why:** sentiment-based de-emphasis of the public path = review gating.
- **Done when:** side-by-side screenshots of happy/unhappy paths show identical structure and labels.
- **Done:** both CTAs factored into single `postToGoogleButton`/`sendPrivatelyButton` helpers in `ReviewForm.tsx`, rendered on both paths with only order + primary/secondary variant flipped. Labels unified: "Copy & Post to Google" / "Send privately to the manager" (identical on both paths). Rationale recorded in `docs/adr/0009-symmetric-share-ctas-on-both-rating-paths.md`. **Still needs the screenshot check** — verify happy/unhappy paths render identically on a real device.

### 3. Add chip-authoring guardrails (taxonomy = scripting vector)
- [ ] Validation on chip creation: reject person names and specific dish/menu items.
- [ ] Chips must stay at category level ("food quality", not "the lamb curry"; "friendly service", not "Maria was great").
- [ ] Onboarding/settings copy explains why (business-suggested specifics in reviews = prohibited content scripting, at scale).
- [ ] Add the rule to the tag-management spec as a hard constraint.
- **Why:** owner-authored chips flow into generated reviews — without guardrails the product becomes a content-scripting tool.
- **Done when:** creating a chip with a name or menu item is blocked with an explanatory message.

### 4. Ship the staff-name + PII rules in the generator prompt
- [ ] Customer-volunteered person names → first name only in the draft.
- [ ] Never include phone numbers, emails, or contact details, even if the customer typed them.
- [ ] Add both as harness cases (full name in free text → surname dropped; PII in free text → stripped).
- **Why:** first+last names in reviews are pattern-flagged for removal; PII in a public review is a GDPR problem too.
- **Done when:** harness passes both new cases.

---

## P1 — Fix before public launch

### 5. Add the "post later / take it with you" path
- [ ] Customer can leave with the draft (e.g. copy + open later) instead of posting at the table.
- [ ] De-emphasize immediacy in all flow copy — no "now", no "before you leave".
- **Why:** disperses review timing and IPs (anti-spike, anti-same-network clustering) and aligns with the "after the visit" compliant pattern.

### 6. Stagger rollout guidance per business
- [ ] Onboarding advice: start with a few cards/tables, ramp over weeks — not every table on day one.
- [ ] Optional later: monitor per-business review velocity in the dashboard and warn on spikes.
- **Why:** sudden volume spikes trigger automated removal regardless of review authenticity.

### 7. Reduce AI-draft sameness
- [ ] Add a variety check to the stress-test harness: same chips-only input ×5, measure structural similarity.
- [ ] Promote the "one sentence of free text" form prompt from future-lever to pre-launch.
- **Why:** template-similar reviews across one profile look machine-generated to pattern detection.

### 8. Counter-card and form copy audit
- [ ] All solicitation copy is a single neutral ask ("Share your experience") — no urgency, no rating steer, no incentive language.
- **Why:** on-premises pressure and incentive bans apply to printed material too.

---

## P2 — Process rules (write down, enforce during pilot)

### 9. No test posts to live profiles
- [ ] Written rule: end-to-end testing stops at the copy screen; nobody (you, devs, Agni staff/family) ever completes a post to the real profile.
- [ ] Applies to every pilot business, forever.
- **Why:** employee/family/contractor reviews are prohibited and actively enforced — on the *client's* profile.

### 10. Incentive warning in owner onboarding
- [ ] Explicit guidance: never attach discounts/perks/freebies to reviewing, and never offer anything to revise or remove a negative review — including signage the owner adds next to Jugnoo cards.
- **Why:** outside the product's control, but the owner's profile takes the penalty and the tool gets blamed.

### 11. Document the AI-drafting position
- [ ] Short written statement: drafts contain only customer-selected/written content (grounding contract), customer edits, customer posts voluntarily; harness = evidence.
- [ ] Watch the Maps UGC policy for language that names AI drafting directly (policy changes ship silently).
- **Why:** "influencing contents" is a gray zone for any drafting tool — hold a documented, defensible position.

---

## Already clean (no action)
- QR scanned on the customer's own phone — the explicitly allowed pattern; not a kiosk.
- No incentives anywhere in the product.
- Private feedback channel alongside (not instead of) the public path.
- AI replies are owner-approved, never auto-posted.
- Rating-dependent chips (positive vs negative) — feedback-collection branching, not access branching.

---

## Suggested order of execution
1 → 2 → 4 (small, same code area) → 3 → 9 + 10 (write-once) → 5 → 7 → 6 → 8 → 11