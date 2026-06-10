# Physical card print is deferred behind a feature flag; pilot orders fulfilled manually

**Context.** We built a card studio (one Card Template, theme switch, NFC toggle, quantity, "send to print"). Two problems surfaced before launch: (1) the HTML→browser print output looks poor, and (2) the intended fix — pre-made Illustrator template PDFs — cannot be purely static, because each card needs a **per-business QR code** (`…/{businessId}?src=qr`) and optionally a per-business logo. A static PDF can be a beautiful background but not the final artifact.

**Options considered.**
- **A — Manual:** the app records the order; the operator hand-places the QR + logo onto the Illustrator template per order and prints. Zero code; serves only the order path; no self-serve printing.
- **B — Composite:** the app stamps the QR (and logo) onto template PDFs at fixed coordinates with `pdf-lib` + a server-side QR generator. Serves self-print and orders; pixel-perfect; ~small dependency footprint and fixed-coordinate templates.

**Decision.** For the pilot, take **Option A (manual fulfilment)** and put the entire card studio **behind a feature flag** (`NEXT_PUBLIC_CARDS_STUDIO`, default off). When off, the Cards page falls back to the pre-existing simple branded **QR-code download** (`QrCodeCard`), which remains the always-on baseline. Option B (programmatic compositing) is the intended future path once the feature graduates.

**Why.** Pilot volume is tiny and hand-managed; manual Illustrator fulfilment is cheaper than building a compositing pipeline now, and gating avoids shipping the poor print output. The flag lets us iterate on the studio without exposing it.

**Consequences.** No self-serve printing of the rich card during pilot (only the simple QR download). Every order is hand-work until Option B is built. The `theme`/`hasNfc`/`quantity` data is still captured on `PrintOrder` so manual fulfilment knows what to produce. Graduating to Option B means designing templates with reserved QR/logo boxes and flipping the flag.
