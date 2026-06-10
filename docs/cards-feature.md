# Cards feature (pilot spec)

Lets a business personalise a review card, self-print it, or order physical cards
(paper or NFC) that Jugnoo fulfils manually. Grilled & agreed 2026-06-09.

See [CONTEXT.md](../CONTEXT.md) for canonical terms (Card Template, hasNfc, Print Order, scansrc)
and [ADR 0001](./adr/0001-card-urls-use-scansrc-not-per-card-codes.md) for the URL scheme.

## Model

- **One Card Template** — fixed copy ("Loved it? Say it louder.", 3-step funnel, locked
  "Powered by Jugnoo"). The only editable input is the business **logo**
  (defaults to `FormConfig.logoUrl`, with an optional per-card override).
- **Card theme** — `green-black` (default) or `black-green`; swaps base/panel colours
  (single brand green, arrangement differs). Persisted on the `PrintOrder`.
- **Print size:** 9 × 9 cm, square.
- **`hasNfc` toggle:**
  - **on** → renders the "Tap phone — hold to the card" block; card is **order-only**.
  - **off** → QR-only; card can be **self-printed or ordered**.
- **Card URL** (QR and NFC both): `{FORM_BASE_URL}/{businessId}?src=qr` / `?src=nfc`.
  No per-card codes (ADR 0001).

## Feature flag (pilot)

The full card studio (template, theme switch, NFC, quantity, "send to print") is
gated behind **`NEXT_PUBLIC_CARDS_STUDIO`** (default off). When off, the Cards page
shows only the simple branded **QR-code download** (`QrCodeCard`) — the always-on
baseline. Print/compositing is deferred; orders are fulfilled manually in Illustrator.
See [ADR 0002](./adr/0002-card-print-deferred-behind-flag.md).

## Self-print

- Available for **QR-only** cards. Download a print-ready PDF/PNG of the card.
- NFC cards cannot be self-printed (the tag must be physically encoded) → order only.
- **Pilot status:** behind the studio flag; the always-on fallback is the simple QR download.

## Print Order

- `PrintOrder` row: `businessId`, `quantity` (1–5), `hasNfc`, `logoUrl` snapshot,
  `status` (`pending` | `fulfilled`), `createdAt`, `fulfilledAt`.
- **Max 5** physical cards per order; paper + NFC share the one pool.
- **Free during pilot.** No shipping address captured — operator contacts the business.
- Created from the web dashboard; surfaced in **Lantern** (`/dashboard/print-orders`)
  where the operator marks them fulfilled, then prints + ships by hand.

## Channel tracking (`?src`)

- Cards encode `?src=qr` (QR) / `?src=nfc` (NFC tag). The param rides on the URL so
  future client-side analytics (Google Analytics / UTM) can attribute the channel.
- **Not persisted server-side** — the app does not store or read `?src`. Avoids
  polluting the data model with an unused dimension; GA owns channel attribution.
- Distinct from the existing `source` field (routing outcome) — see CONTEXT.md.

## Open / deferred

- Per-card analytics (would activate the dormant `QrCode` model) — deferred (ADR 0001).
- Editable card text/colours — deferred; copy is fixed for now.
- Shipping address + automated fulfilment — deferred (manual during pilot).
- Brand-green hex / display font / tap icon — approximated from the mockup; refine with real assets.
