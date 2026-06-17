# Counter-card QR codes are token-based and decoupled from the business

**Status:** proposed — supersedes [ADR-0001](0001-card-urls-use-scansrc-not-per-card-codes.md) (which left `QrCode` dormant and chose `?src` over per-card codes). The dormant `QrCode` model is reshaped in place (no rows exist to migrate).

## Context

Every business needs printed counter cards carrying a QR code that opens its
per-business feedback form (`feedback.jugnoo.olbaid.de/<businessId>`). Today the QR
encodes the business's form URL directly, which marries each card to a business **at
print time**. That has three costs:

- **Manual per-business production.** Each card's QR is pasted into an Illustrator file
  and printed per business — slow, and it blocks any "pull a card off a stack and use it
  now" workflow.
- **No pre-printing.** Cards cannot be produced in bulk ahead of knowing who they're for.
- **Waste and rigidity.** A damaged card, a churned business, or a misprint is dead ink;
  a change to the form URL or routing would invalidate every card already in the wild.

We also have no per-card analytics: we cannot tell whether the counter card, a table
tent, or a window sticker actually drives scans — which is the single most important
unknown about whether the funnel works at all.

This ADR records the decision to **encode an opaque token in the QR instead of the
business**, and to resolve token → business → form via a server **redirect** we control.
We deliberately start with a redirect (not server-side internal rendering) because it is
simpler and has fewer moving parts; the render/no-hop alternative is recorded below as a
secondary option to revisit. We also keep the **existing direct-URL QR** (the QR-download
feature that links straight to a business form) — the token system runs *alongside* it,
not as a replacement (see "Two coexisting QR modes").

## Decision

### The QR encodes a token, never a business

Each card's QR points at a short URL: `feedback.jugnoo.olbaid.de/q/{token}`, where
`{token}` is a short, random, human-readable, non-sequential code (e.g. `K7M2P`). The
server looks the token up, finds the assigned business, and resolves to that business's
form. The QR is a pointer to a mapping we own, not a baked-in destination.

Everything we want falls out of this one indirection: bulk pre-printing, assign-later,
reassignment, recovery from damage/churn, URL/routing changes that don't kill printed
cards, and per-card scan analytics.

**A token is a mapping, not a physical card.** We model the token→business mapping; there
is **no per-physical-card entity**. The *same* token may be printed onto any number of
physical cards, and they all resolve identically — so "multiple cards sharing one scan
code" is supported for free. Consequences: (a) a `placement` label lives on the *token*,
so per-placement distinction is **opt-in by minting separate tokens** for the same
business, not a property of an individual card; (b) **retire/reassign acts on the code**,
killing every physical card that carries it — a card you want to retire independently must
have its own token. Generic stock where each card is independently retirable ⇒ unique
token per card; a co-branded set treated as one unit ⇒ one shared token. This is a
printing/minting choice, not a schema choice.

### Resolution strategy: redirect first (chosen), internal render as secondary

**Chosen — HTTP redirect.** `/q/{token}` resolves the token to a `businessId` and
`302`-redirects to the existing business form URL, carrying tracking params:
`/{businessId}?src=qr&token={token}`. The `token` param rides the URL purely for
**client-side / GA analytics** and is **not persisted server-side** — exactly like the
existing `?src` channel param ([src] in CONTEXT.md, ADR 0001). This makes scan→arrival
per-card trackable in GA without DB surface; scan→*completion* server attribution would
require persisting the token (deferred, reverses the `?src` "don't persist" stance). The
form route is otherwise unchanged. We choose redirect first because it has the fewest
moving parts and the lowest
chance of subtle failure — the form keeps working exactly as it does today; the token
route only adds a lookup + redirect in front of it. The cost is one extra hop (a brief
flicker) and a public resolver endpoint in the hot path.

- `businessId` is the redirect target. **Requirement:** `businessId` must be
  non-sequential / non-enumerable (CUID/UUID, not an incrementing integer), since it
  becomes visible in the final public URL. If IDs are sequential, introduce a random
  public identifier before relying on this.

**Secondary option to consider later — standalone token route with internal render.**
Instead of redirecting, `/q/{token}` could resolve server-side and **render the form
directly** (no second URL, no hop), by sharing the form's data-loader between the token
route and the business-form route. Pros: no flicker, cleaner URL, and it naturally routes
*every* scan (including self-serve cards) through one tracked path. Cons: more coupling
and more places to get wrong — which is why we are not starting here. Revisit if the
redirect hop proves to hurt UX or if we want universal tracking through a single route.

**No caching for now.** The token→businessId lookup is a single indexed DB query
(milliseconds) and is fine un-cached at pilot scale. Caching the mapping is a deferred
`pre-public` performance task (same bucket as the form-config caching already deferred in
CLAUDE.md). When added, it must **invalidate on reassignment/retire** so a remapped token
never serves a stale business. Skipping caching now also removes the stale-data risk
entirely.

### Card lifecycle

1. **Generate** — mint a batch of N tokens; each gets a row
   (`token`, `status: "unassigned"`, `businessId: null`, `batchLabel`, `createdAt`).
   Render the N QR codes onto cards and print. Cards carry no business identity yet.
2. **Stock** — printed generic cards sit in inventory until assigned.
3. **Assign** — link one or more cards to a business; row flips to
   `status: "assigned"`, `businessId` set, `placement` label optional, `assignedAt`.
   The QR now resolves.
4. **Live** — customer scans → server resolves token → redirects to the business form.
5. **Retire / reassign** — damaged or churned cards are remapped or set
   `status: "retired"`. No card is wasted.

### Token design

- Short (≈5 chars), from an unambiguous alphabet (no `0/O`, `1/l/I`) so it is reliably
  typed and read.
- Random, **not sequential** — sequential tokens would let anyone enumerate other
  businesses' cards by incrementing the code.
- **Printed in human-readable form under the QR**, for two reasons: it is the input for
  typed assignment (below), and it is a fallback if the QR is scratched or a customer
  prefers to type the URL.

### Assignment workflow + management home (admin / Lantern)

**Management home.** Token QR generation and management live in **Lantern**: mint a batch
of N tokens, **download each token's QR as an SVG** (edited + printed manually for now;
batch-sheet UI is Phase 2), link tokens to a business, and retire/unassign/reassign. (Per-card scan analytics is deferred — see analytics section.)
The owner self-serve direct-URL download stays in the `web` dashboard. The public resolver
stays in `form`. The `QrCode`/token model is shared via `@repo/db`.

**Concrete Lantern UI (first cut).** One nav item → **`/dashboard/qr-codes`**, server
component + `force-dynamic`, matching the existing Print Orders / Businesses pages
(Tailwind cards/tables, server actions via `<form action={…}>`). Layout:

- **Mint** control — quantity + `batchLabel` → mints N `unassigned` tokens (retry-on-
  collision).
- **Assign cards** form (the mobile Stage-1 flow) — pick business → paste/type 1–N codes →
  assign all in one action.
- **Tokens table** — columns: code, status, business, batch, assignedAt, actions. Filter
  by **status** and **business** (the business filter *is* the "which tokens does business
  X have" view — no separate page). Per-row actions: **Download SVG** (this token's QR,
  filename = code) plus inline toggles implementing the **full state machine**: Assign
  (unassigned→assigned), Unassign (assigned→unassigned, back to stock), Reassign directly
  (assigned→assigned, change business, no unassign step), Retire (any→retired), Restore
  (retired→unassigned). The Operator edits/prints the downloaded SVG manually; the batch
  sheet UI is Phase 2.

Assignment happens on-site. Shipped in two stages, same data model:

- **Stage 1 — typed-token assignment (ship first).** In Lantern on mobile: pick the
  business → type the 1–3 codes printed on the cards being placed → assign. Minimum
  viable, unblocks the workflow immediately.
- **Stage 2 — scan-to-assign (ergonomic upgrade).** An authenticated admin scanning a
  card's QR is routed to an **assign** screen ("assign this card → pick business")
  instead of the public form. Pull cards out, scan each, tap the business. Additive on
  top of Stage 1.

Resolution behaviour by token state:
- **assigned** → redirect to the business form.
- **unassigned** → friendly "this card isn't active yet" page (NOT an error/404).
- **retired** → friendly "this card is no longer active" page.
- **admin session** → the assign screen, regardless of the above.

### Two coexisting QR modes (the token system does not replace direct-URL QRs)

There are now **two QR types serving different distribution models**. Both are kept.

1. **Direct-URL QR (existing — keep).** Encodes a business's form URL directly. Used by
   the **owner self-serve download** (in the `web` dashboard): the owner is logged in, the
   business is known, so there is nothing to assign. These cards are **co-branded with the
   owner's own logo** (we already have it). This is the feature already built.

2. **Token QR (new — this ADR).** Encodes `/q/{token}`, resolved to a business. Used for
   **pre-printed generic stock** that is assigned on-site via Lantern. At print time the
   business is unknown, so these cards are **generic / logo-less**; a logo only becomes
   possible *after* assignment, on a freshly generated co-branded card.

**Logo rule by mode:** self-serve direct-URL cards carry the business's logo (business
known at generation); token stock cards are generic until assigned (no logo can appear on
already-printed stock). Co-branded token cards are generated *after* linking, not in the
pre-printed batch.

**Optional future convergence:** the secondary "internal render" resolution option above
would let self-serve cards also route through `/q/{token}` (pre-assigned at generation),
unifying tracking across both modes. Not adopted now; noted for later.

### Generic vs co-branded token cards

Within the token mode:
- **Generic Jugnoo-branded token cards** — printed in bulk, used for instant on-site
  activation and demos. The speed tool.
- **Co-branded token cards** — generated on-demand per business via the card-template →
  print-ready-PDF pipeline (separate ADR), as the "proper" set that follows assignment.

Both resolve through `/q/{token}`, so a business can hold a mix.

### Per-card scan analytics (free with tokens) — DEFERRED, not in first cut

**Not built in the first cut.** The first implementation ships token resolution +
assignment only; no scan logging, no counter, no `ScanEvent` model. Because every card
already carries a unique token, analytics can be added later as a pure addition (an event
table keyed by token) without reshaping the `QrCode` model or reprinting cards. Note the
**funnel gap**: the chosen redirect drops the token at `/{businessId}`, so a future
*scan→completion* funnel (not just a scan counter) additionally requires carrying the
token through the redirect and persisting it on the submission — which reverses the
`?src` "don't persist attribution" stance (ADR 0001 / [src] in CONTEXT.md). That trade is
deferred with the rest of analytics.

When built (deferred): because every card has a unique token, each scan is logged against it
(`token`, `timestamp`, optional coarse signal). With a `placement` label set at
assignment ("counter", "table-3", "till", "window"), we can compare which placements
drive scans, and measure the scan → completion funnel per card. This answers the
"does anyone actually scan?" question and is a primary reason to prefer tokens over
direct-encoded QRs.

### Scope of the first cut (decided in grilling)

**In:**
1. Reshape the dormant `QrCode` model in place — `token` (5-char, ambiguity-free
   `K7M2P`-style, stored uppercase, case-insensitive lookup, `@unique`, minted with
   retry-on-collision), `status String @default("unassigned")` (`unassigned` | `assigned`
   | `retired`, house-style documented string, not a Prisma enum), nullable `businessId`,
   `placement String?`, `batchLabel String?`, `assignedAt DateTime?`. Then `db:generate`.
2. Public `/q/{token}` resolver in `form`: `302` to `/{businessId}` when assigned; neutral
   pages for unassigned/retired/unknown (unknown == unassigned, non-probeable).
3. Lantern: mint a batch of N tokens; list/manage; **typed multi-token → one-business**
   assignment (Stage 1); retire.
4. **Per-token QR SVG download** in Lantern — each token row has a "Download SVG" action
   that exports just that token's QR as a padded standalone SVG (reuses the existing
   `buildPaddedSvg` / SVG-download in `apps/web`'s `QrCodeCard`), filename = the token code
   (`K7M2P.svg`) so the file self-identifies. **The Operator edits the SVG (adds branding,
   the visible code, layout) and prints manually for the first cut** — no N-up sheet, no
   `pdf-lib`, no cut lines. A proper batch/sheet **SVG export UI is Phase 2**, alongside
   branded/co-branded stock (separate Card Template ADR). The token code stays visible in
   the Lantern list view next to its status/batch/business.

**Deferred:** scan analytics entirely (no logging/counter/event model); **Stage 2
scan-to-assign** (admin-session assign screen); on-site create-and-assign; co-branded
token-card generation (separate card-template ADR); token→business mapping caching
(`pre-public` perf task). Assignment links to **already-onboarded businesses only**.

## Consequences

- **No card is ever stranded or wasted.** Misprints, damage, and churn are remaps, not
  reprints.
- **Printed cards survive change.** Domain, form structure, or routing changes are
  absorbed by the redirect layer; QRs already in the wild keep working.
- **A new resolver endpoint becomes load-bearing and public.** `/q/{token}` sits in front
  of every scan, so it must be fast and highly available — a slow or failing resolver
  breaks the funnel for every business at once. At pilot scale an un-cached indexed DB
  lookup is fast enough; caching the token→business mapping is a deferred `pre-public`
  perf task, and when added must invalidate on reassignment/retire.
- **Privacy/abuse surface.** Tokens are guessable only if sequential (they are not) or
  if the unassigned/retired pages leak business data (they must not — show a neutral
  page, reveal nothing about businesses). Scan logging must avoid storing personal data
  about the scanner beyond what analytics needs.
- **Extends the existing `QrCode` model.** This builds on the schema's `QrCode` entity
  (token, status, nullable business link, placement label, timestamps) rather than a new
  concept.
- **Do it before cards are in the wild.** Retrofitting tokenisation after hundreds of
  direct-encoded cards are printed and placed is painful — same "do it before data/objects
  accumulate" logic as canonical tag keys. This should land before broad card distribution.

## Open questions

- **On-site business creation.** ~~Pre-created vs create-and-assign in one flow.~~
  **Resolved (first cut):** assignment links to an **already-onboarded** business only
  (matches the hand-onboard model). Cold walk-in = onboard via the existing Lantern form
  first, then assign. Create-and-assign-in-one is a cheap later add (reuses the onboarding
  action) if cold acquisition becomes a real channel.
- **Assignment granularity.** ~~Individual vs labelled range.~~ **Resolved:** Stage 1
  assigns **multiple tokens → one business in one action** (enter/paste 1–N codes, pick
  business, assign all). Numeric ranges are rejected: tokens are random/non-sequential, so
  a range would need a separate printed serial. `batchLabel` is an ops grouping for a mint
  run, not a per-card serial.
- **Scan-log depth.** ~~Counter per token vs per-scan event rows.~~ **Resolved:** no scan
  logging in the first cut — analytics deferred entirely (see analytics section above).
- **Retired/unassigned page content.** **Resolved (structure):** three states render
  neutral, Jugnoo-branded pages that reveal nothing about any business — **unassigned**
  ("not active yet") and **retired** ("no longer active") get distinct wording, and an
  **unknown token renders the same page as unassigned** (never a distinct 404) so the
  resolver can't be probed to discover which codes exist. **The scanned token is echoed on
  the unassigned/unknown page** ("Card `K7M2P` …") — it leaks nothing (the holder already
  has the code) and stays non-probeable (a guessed token is just echoed back), while giving
  an operator the code to assign. Exact copy is owner-supplied (placeholder until provided).