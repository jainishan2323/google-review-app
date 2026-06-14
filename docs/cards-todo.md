# Cards feature — TODO

Tracking work to fully enable the SVG-template review cards (ADR 0011). Phase 1
(injected SVG preview + record-only order) is built; the rest is below.

## Artwork (designer)
- [ ] Deliver `template_qr_only_de.svg` with all three slots (`#qr-code`, `#brand-logo`, `#jugnoo-logo`).
- [ ] Deliver `template_qr_and_nfc_de.svg` with all three slots.
- [ ] Fix the typo'd root id `qr-adn-nfc-curved` in the NFC template (cosmetic — code ignores it).
- [x] Add `#brand-logo` + `#jugnoo-logo` slots to `template_qr_and_nfc_en.svg`. *(done — re-exported)*

## Phase 1 — launch readiness
- [ ] Run `prisma migrate deploy` on the production DB (web + lantern projects) — includes
      `20260614211913_add_print_order_items` (cart line items, ADR 0012).
- [ ] Test the cart flow end-to-end: add multiple variants → send to print → studio locks to
      "under processing" → Lantern shows the line items → mark fulfilled reopens ordering.
- [ ] Verify QR/logo placement visually in the browser for all 4 variants.
- [ ] Confirm a logo with an odd aspect ratio fits cleanly (contain + center).
- [ ] Test the record-only order end-to-end (web order → Lantern row shows language).
- [ ] Decide when to flip `NEXT_PUBLIC_CARDS_STUDIO=true` in production.
- [ ] (Optional) Add `apps/web/src/assets/README.md` listing required slot ids.

## Phase 2 — self-serve Print Sheet (client-side, ADR 0013)
- [ ] Add `pdf-lib` to `@repo/web` (zero-dep, isomorphic — reused by the server fallback).
- [ ] Generate the **Print Sheet** client-side: composite the QR-only card *logo-less*
      (`injectCard` with `logoUrl: null`), rasterize via the browser canvas (~300 DPI), tile
      **6-up (2×3)** on **A4** with a hairline **cut-line grid** (vector lines), and download.
- [ ] Add a "Print it yourself" button (QR-only; disabled + note for QR+NFC), always available
      regardless of the order lock, only when the variant template exists.
- [ ] Label the button so the logo-less self-print vs logo-on-ordered-cards difference is clear.
- [ ] ~~Embed baked fonts~~ — N/A: templates have no `<text>`/fonts (copy is outlined to paths).

### Deferred fallback ("Option A") — only if client-side proves insufficient
- [ ] Server route compositing with `@xmldom/xmldom` + resvg-js → pdf-lib (move `injectCard` +
      templates into a shared, DOM-agnostic package; fetch + inline the logo server-side).
- [ ] (Cheaper logo path if wanted before Option A) a same-origin `/api/logo-proxy` to keep the
      logo on the Print Sheet without canvas taint.

## Phase 3 — operator-side composited file (Lantern)
- [ ] Add "Download print file" to each Lantern print-order (composites on demand).
- [ ] Reuse the snapshotted `logoUrl` + `language` so output is reproducible.

## Cleanup / later
- [ ] Drop the retired `PrintOrder.theme` column once old rows are migrated.
- [ ] Capture shipping address + automate fulfilment (currently manual).
