# Jugnoo

Glossary for Jugnoo — a Google review management platform for local businesses. This file defines the canonical domain language. It is a glossary only: no implementation details, no specs.

## Language

**src** (URL param):
The acquisition channel a customer arrived through, carried as a `?src=` query param on the card's form URL — `qr` (scanned a QR code) or `nfc` (tapped an NFC card). Kept on the URL for future analytics (e.g. Google Analytics) but **not** persisted server-side — the app does not store or read it.
_Avoid_: scansrc (no longer a DB field), source (means something else — see below), channel, medium

**source** (existing):
The routing *outcome* of a feedback submission — `private` (kept for the business only) or `google_redirect` (the customer was sent on to post to Google). Distinct from [src]: `source` is *where the feedback went*, `src` is *how the customer got here*.
_Avoid_: using this for acquisition channel

## Cards

**Card Template**:
A single predefined Jugnoo-designed card layout (fixed copy, fixed funnel steps, locked "Powered by Jugnoo" attribution) that a business personalises with its own logo. There is one template; its variants come from [hasNfc], not from separate templates.
_Avoid_: card design, design (implies user-authored layout — it isn't), poster, flyer

**hasNfc**:
A boolean on a personalised card. When on, the card renders the "Tap phone" block and is **order-only** (cannot be self-printed). When off, the card is QR-only and may be self-printed or ordered.
_Avoid_: nfc support, nfc enabled, format

**Print Order**:
A request from a business to have physical cards produced and shipped by Jugnoo. Free during the pilot. The only path to obtain an NFC card.
_Avoid_: order (too generic), print job, print request

**Card theme**:
The colour arrangement of a card — `green-black` (green background, black panel) or `black-green` (inverted). Both use the same single brand green; only which colour is the base vs the panel changes.
_Avoid_: colour scheme, variant, skin
