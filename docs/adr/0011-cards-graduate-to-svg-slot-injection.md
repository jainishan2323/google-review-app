# Cards graduate from the React template to slotted SVG artwork, injected on demand

**Status:** accepted — supersedes [ADR 0002](./0002-card-print-deferred-behind-flag.md) (which deferred compositing and kept the React template behind a flag).

**Context.** ADR 0002 deferred programmatic compositing and rendered the card from a React component (`CardTemplate`) with a `green-black`/`black-green` theme switch, fulfilling orders by hand in Illustrator. The designer has since delivered **print-ready SVG artwork** with two named injectable slots — `#qr-code` (a square box) and `#brand-logo` (right side) — with all other copy baked in. This is exactly the "templates with reserved QR/logo boxes" graduation trigger ADR 0002 named.

**Decision.** Replace the React `CardTemplate` with the SVG artwork and inject the QR + business logo into the named slots. There are **four templates**, one per (`hasNfc` × `language`) combination, chosen by a hardcoded filename map (`template_qr_only_en.svg`, …); language defaults to `FormConfig.defaultLanguage` with a studio toggle. The **theme** dimension is dropped (single-treatment artwork). `PrintOrder` gains a **`language`** column so an order is self-describing; `theme` is retired (column kept only for old rows). Build it in **phases**:

- **Phase 1 (now):** studio *preview* renders the real injected SVG (QR via the existing `qrcode` dep; business logo contained-and-centered, empty slot if absent — the static `#jugnoo-logo` on the left always brands the card). The "Send to print" button stays **record-only**. No file generated or stored; no new deps.
- **Phase 2:** "Print it yourself" → self-serve composited **PDF** (adds a renderer dependency).
- **Phase 3:** operator-side composited file in Lantern (full composite-on-order).

**Considered options.**
- **Output format:** composited **SVG** (zero new deps, vector, drops into the operator's existing Illustrator flow) — chosen — vs SVG→PDF or SVG→PNG, both of which need a renderer/rasterizer and font-embedding work for the baked Inter/Century Gothic copy. Deferred to Phase 2+.
- **Slot addressing:** **named ids** (`#qr-code`, `#brand-logo`) carried in every template, so one code path serves all variants and coordinates live in the artwork — chosen — vs a per-file hardcoded coordinate table (4× the maintenance, brittle to redesigns, the very thing ADR 0002 feared).
- **No-logo fallback:** **leave the brand-logo slot empty** (fixed-position design: brand-logo right, jugnoo-logo left) — chosen — vs promoting `#jugnoo-logo` into the slot (rejected once positions were fixed) or injecting the business name as text (needs font embedding).

**Consequences.** The React `CardTemplate`, theme switcher, and `theme` writes go away. The 4 SVGs + an `injectCard()` helper want a shared home (e.g. a package) once Phase 2/3 make Lantern and web both consume them; Phase 1 only needs it in web. Adding a 5th language/variant is "drop in an SVG + add a map row." Per-card analytics remain dormant (ADR 0001 unchanged); `?src=qr|nfc` channel scheme unchanged.
