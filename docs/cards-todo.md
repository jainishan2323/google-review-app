# Cards feature — TODO

Tracking work to fully enable the SVG-template review cards (ADR 0011). Phase 1
(injected SVG preview + record-only order) is built; the rest is below.

## Artwork (designer)
- [ ] Deliver `template_qr_only_de.svg` with all three slots (`#qr-code`, `#brand-logo`, `#jugnoo-logo`).
- [ ] Deliver `template_qr_and_nfc_de.svg` with all three slots.
- [ ] Fix the typo'd root id `qr-adn-nfc-curved` in the NFC template (cosmetic — code ignores it).
- [x] Add `#brand-logo` + `#jugnoo-logo` slots to `template_qr_and_nfc_en.svg`. *(done — re-exported)*

## Phase 1 — launch readiness
- [ ] Run `prisma migrate deploy` on the production DB (web + lantern projects).
- [ ] Verify QR/logo placement visually in the browser for all 4 variants.
- [ ] Confirm a logo with an odd aspect ratio fits cleanly (contain + center).
- [ ] Test the record-only order end-to-end (web order → Lantern row shows language).
- [ ] Decide when to flip `NEXT_PUBLIC_CARDS_STUDIO=true` in production.
- [ ] (Optional) Add `apps/web/src/assets/README.md` listing required slot ids.

## Phase 2 — self-serve PDF
- [ ] Pick a renderer (resvg / puppeteer / svg-to-pdfkit) and add the dep.
- [ ] Move `injectCard` + templates into a shared package (server-capable, no DOMParser).
- [ ] Add a route/action that composites the SVG and returns a print-ready PDF at 9×9 cm.
- [ ] Embed/handle the baked fonts (Inter 28pt, Century Gothic) in the PDF.
- [ ] Fetch + inline the business logo server-side for the PDF.
- [ ] Add "Print it yourself" download button (QR-only) to the studio.

## Phase 3 — operator-side composited file (Lantern)
- [ ] Add "Download print file" to each Lantern print-order (composites on demand).
- [ ] Reuse the snapshotted `logoUrl` + `language` so output is reproducible.

## Cleanup / later
- [ ] Drop the retired `PrintOrder.theme` column once old rows are migrated.
- [ ] Capture shipping address + automate fulfilment (currently manual).
