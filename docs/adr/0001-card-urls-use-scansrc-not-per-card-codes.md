# Cards encode the raw business form URL with a `?src` channel param, not per-card tracking codes

**Context.** Physical review cards (QR + optional NFC) need a target URL. The schema already has a `QrCode` model with a unique `code` and `isActive`, which would support per-card redirect URLs (`/c/{code}`) and per-card scan analytics.

**Decision.** For the pilot, every card encodes the raw business form URL `…/{businessId}?src=qr|nfc`. We do **not** mint per-card codes; the `QrCode` model is left dormant. The `?src` param rides on the URL to enable future channel attribution via client-side analytics (e.g. Google Analytics); the app does **not** persist or read it server-side (see [src] in CONTEXT.md).

**Why.** Per-card codes buy per-placement analytics but cost a redirect route, a scan-logging step, and — critically — they bake a unique URL into each physical card, so changing the scheme later means re-issuing printed/NFC cards. The pilot only needs to answer "is the QR/NFC feature being used, and via which channel?", which the `?src` param answers via GA with zero schema surface. (An earlier iteration persisted this to an `AnonymousFeedback.scansrc` column; that was removed to avoid polluting the data model with an unused dimension — GA owns channel attribution.)

**Consequences.** All cards for a business are interchangeable (no way to tell two table-tents apart, no per-card deactivation). Graduating to per-card codes later is a breaking change for already-distributed cards — acceptable given the pilot's small, hand-managed footprint.
