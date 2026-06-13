# Cards feature (pilot spec)

Lets a business personalise a review card, self-print it, or order physical cards
(paper or NFC) that Jugnoo fulfils manually. Grilled & agreed 2026-06-09.

See [CONTEXT.md](../CONTEXT.md) for canonical terms (Card Template, hasNfc, Print Order, scansrc)
and [ADR 0001](./adr/0001-card-urls-use-scansrc-not-per-card-codes.md) for the URL scheme.

> **Updated 2026-06-13 — moving to slotted SVG templates (ADR 0011).** The card is now
> print-ready **SVG artwork** with two injectable slots, not a React component. Theme is
> dropped; **language** (`en`/`de`) is the new second dimension. See ADR 0011 for the phased plan.

## Model

- **Four Card Templates** — print-ready SVG files, one per (`hasNfc` × `language`) combo,
  chosen by a hardcoded filename map (`template_qr_only_en.svg`, …). Fixed copy + 3-step funnel
  + locked `#jugnoo-logo` are **baked into the artwork**. The only injectable inputs are the
  generated QR (slot `#qr-code`, square) and the business **logo** (slot `#brand-logo`, right;
  defaults to `FormConfig.logoUrl`, contained-and-centered, empty if none).
- **Card language** — `en` / `de`, defaults to `FormConfig.defaultLanguage`, studio-toggleable;
  selects which of the 4 SVGs is used. Persisted on the `PrintOrder`.
- **Card theme** — **removed.** SVGs are single-treatment; `PrintOrder.theme` is retired
  (kept only for old rows).
- **Print size:** 9 × 9 cm, square.
- **`hasNfc` toggle:**
  - **on** → uses the `_qr_nfc_` artwork; card is **order-only**.
  - **off** → uses the `_qr_only_` artwork; QR-only.
- **Card URL** (QR and NFC both): `{FORM_BASE_URL}/{businessId}?src=qr` / `?src=nfc`.
  No per-card codes (ADR 0001).

## Feature flag (pilot)

The full card studio (template, theme switch, NFC, quantity, "send to print") is
gated behind **`NEXT_PUBLIC_CARDS_STUDIO`** (default off). When off, the Cards page
shows only the simple branded **QR-code download** (`QrCodeCard`) — the always-on
baseline. Print/compositing is deferred; orders are fulfilled manually in Illustrator.
See [ADR 0002](./adr/0002-card-print-deferred-behind-flag.md).

## Self-print

- **Phase 2 (not yet built).** Self-serve **PDF** download of the composited card for QR-only
  cards (adds a renderer dep — see ADR 0011). NFC cards cannot be self-printed (the tag must be
  physically encoded) → order only.
- **Phase 1 ships preview only:** the studio renders the real injected SVG so the business sees
  exactly what they'll get; the order button stays record-only.

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
- Editable card text — out of scope; all copy is baked into the SVG artwork.
- Self-serve PDF (Phase 2) + operator-side composited file in Lantern (Phase 3) — ADR 0011.
- The other 3 SVG templates (`_qr_only_de`, `_qr_nfc_en`, `_qr_nfc_de`) — only `_qr_only_en`
  exists today; code guards for missing files until they land.
- Shipping address + automated fulfilment — deferred (manual during pilot).
