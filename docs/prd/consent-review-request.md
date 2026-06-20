# PRD — Consent-Based Review Request (Email)

**Status:** draft / parked — continue later
**Owner:** —
**Context docs:** ties to compliance-tasks, the German consent/UWG discussion, Resend/react-email decision.

---

## 1. Problem / why

Competitors (Birdeye, NiceJob) center on a "upload customer list → blast review
requests → track opens/clicks/conversion" engine. That model is **largely illegal in
Germany** (UWG §7 + GDPR: review-request email needs prior explicit, purpose-specific
consent; uploaded lists almost never have it) and the tracking adds heavy processing
obligations.

We want the *value* of that feature (more reviews via follow-up requests) built the only
way that's legal in our market: **consent-native, thin-processor, low-tracking.**

## 2. Segmentation — who this is for

- **Restaurants → NOT this feature.** Our QR-at-the-table funnel already captures the
  review at the moment, anonymously. They have no contact list and don't need one.
  Collecting contact for a completed, anonymous feedback = no purpose = GDPR violation.
  Leave restaurants on the anonymous QR model.
- **Appointment-based businesses (dentists, doctors, plumbers, salons) → YES.** They
  already hold customer contact data, collected in a real existing relationship, via
  their own intake/booking forms. They are the target for this feature.

## 3. Roles (GDPR)

- **Business = controller.** They own the relationship, collected the contact, hold the
  consent, and **attest** consent before any send.
- **Jugnoo = thin processor.** We send on their behalf; we minimize what we store; we do
  not hold their list as our asset; we require attestation.
- **DPA (Art. 28) between Jugnoo and each business is mandatory** for this feature.
  (Healthcare businesses expect this and have a higher bar — see §7.)

## 4. The consent model (the core)

Two independent signals establish consent:

1. **Business attestation** — when a contact is added, the business confirms the person
   consented (to a specific purpose). We **record the attestation** (who added, when).
2. **Double opt-in** — our own independent proof the address is real and wanted.

### Most effective consent capture (lowest flag)

- Business adds **one explicit opt-in line to their existing intake/booking form**:
  "☐ I'd like to receive a follow-up email about my experience, including the option to
  leave a review." (Controller collects, at a natural moment, specific purpose, real
  relationship.)
- §7 Abs. 3 UWG "existing customer" exception may *also* apply for these businesses, but
  is narrow/contested for review requests and SMS-excluded — treat as a lawyer-confirmed
  fallback the business may invoke, NOT our primary basis.

### Double opt-in flow (our proof layer)

1. Business adds a contact (claims consent) → status `pending`.
2. Our tool sends **one confirmation email**: "Confirm you'd like review-request emails
   from [Business]" + Confirm button. Nothing else sent yet.
3. Click Confirm → status `confirmed` → only now on the active list (record timestamp).
4. No click → stays `pending` → never emailed again.

- The Confirm click is logged proof an actual person at that address opted in —
  independent of the business's attestation.
- **Bypass note:** double opt-in is not strictly legally mandatory if the signed/checkbox
  consent is valid and provably stored, but it is our safety net. If bypassed, all proof
  burden falls on the business's consent record. Default = keep double opt-in; only skip
  with a real reason + lawyer sign-off.

## 5. Sending + tracking

- **Send via Resend; templates via react-email** (already our stack; confirm Resend EU
  residency / DPA for GDPR posture, else swap sender — react-email is sender-agnostic).
- **Thin processor:** process transiently, minimize retention of contact data.
- **No behavioral tracking (open/click) for v1** — it's the biggest processing burden for
  the smallest value. Track only operational status: `pending` / `confirmed` /
  `sent` / `bounced` / `unsubscribed`.
- **One-click unsubscribe in every email** (UWG requirement).

## 6. Request lifecycle / status dashboard (for the business)

Per contact: `pending` → `confirmed` → `requested` → (`reviewed` if detectable) /
`unsubscribed` / `bounced`. Show the business who was asked, who confirmed, who's pending.
Built on consented data only. (Behavioral open/click tracking deferred — see §5.)

## 7. Healthcare-specific rules (dentists/doctors)

- They handle **special-category health data** — higher consent + DPA bar.
- **Email content must be strictly non-clinical/neutral** — "how was your visit/
  experience", never "how was your [procedure]". Enforce via the dentist/doctor business-
  category config (neutral taxonomy already specced).

## 8. Google-policy guardrails (carry over)

- Request must go to **every consented customer** the same way — no sentiment-gating the
  ask. Neutral wording, no "leave us 5 stars".
- **No incentives** attached to reviewing (also weakens consent validity).
- Pace sends — avoid velocity spikes / same-IP clustering patterns.

## 9. Out of scope (v1)

- Restaurants / anonymous-funnel businesses.
- Owner bulk **list upload** (highest-risk; only ever with owner attestation + DPA +
  proof-of-consent; defer hard).
- Open/click behavioral tracking.
- SMS / WhatsApp (no §7(3) cover, heavier consent + storage; later premium, owner-number-
  only).
- Diner-side notifications on the anonymous funnel.

## 10. Open questions

- Where/how the business records each consent + how we link attestation to a contact for
  proof.
- Do we store a reference to the signed/checkbox consent (scan/record) or rely on business
  to hold it?
- Resend EU residency confirmed? If not, which EU-capable sender.
- How is "reviewed" status detected without behavioral tracking (may need the GBP API /
  manual mark)?
- Retention policy for consented contacts + consent records.

## 11. Hard dependency

**German lawyer review required before launch** — consent wording (form checkbox +
double-opt-in copy), the DPA template, and reliance on §7(3). I can draft the structure
and copy; binding sign-off is professional. An invalid consent form gives false
compliance, which is worse than none.