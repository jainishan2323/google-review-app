# Jugnoo

Glossary for Jugnoo — a Google review management platform for local businesses. This file defines the canonical domain language. It is a glossary only: no implementation details, no specs.

## Language

**src** (URL param):
The acquisition channel a customer arrived through, carried as a `?src=` query param on the card's form URL — `qr` (scanned a QR code) or `nfc` (tapped an NFC card). Kept on the URL for future analytics (e.g. Google Analytics) but **not** persisted server-side — the app does not store or read it.
_Avoid_: scansrc (no longer a DB field), source (means something else — see below), channel, medium

**source** (existing):
The routing *outcome* of a feedback submission — `private` (kept for the business only) or `google_redirect` (the customer was sent on to post to Google). Distinct from [src]: `source` is *where the feedback went*, `src` is *how the customer got here*.
_Avoid_: using this for acquisition channel

## Google identifiers

**Place ID** (`googlePlaceId`):
The public Google **Maps** identifier for a business (e.g. `ChIJ9fc8fxFRqEcRMwkzsTU2yRU`). Anyone can look it up without owning the listing; no authentication. Drives the form funnel's "write a review" redirect (`…/writereview?placeid=…`). Available and used in Phase 1.
_Avoid_: location id (different system — see below), maps id, gmb id

**Location ID** (`googleLocationId`):
The Google **Business Profile API** management resource name for a location the owner manages (e.g. `accounts/123/locations/456`). Only obtainable *after* the owner grants the `business.manage` scope (Phase 2 "Connect Google"); used to read reviews and post replies via the API. Not derivable from a [Place ID] — it takes an authorized API call to discover. In Phase 1 it holds a unique **placeholder** value (set by the Operator at onboarding), overwritten with the real value in Phase 2.
_Avoid_: place id (the public Maps id, not this), resource name (too generic)

## People & apps

**Owner**:
A customer of Jugnoo — the proprietor of a pilot business who signs into the customer dashboard (`apps/web`). Modelled as a `User` with `role = OWNER`, linked to one or more `Business` rows via `ownerId`. An owner is identified by their **verified Google email**; that email is the single key that ties a person to their business(es) across both phases of Google sign-in.
_Avoid_: user (too generic — an Operator is also a User), customer (use for the human/relationship, "Owner" for the modelled role), account

**Operator**:
The Jugnoo team (currently just the app's creator) who runs the internal admin app, **Lantern**. Modelled as a `User` with `role = ADMIN`. The Operator hand-onboards pilots: creates each `Business` ahead of time and records the future Owner's email on it.
_Avoid_: admin (fine as the role value, but "Operator" for the person), app owner (collides with [Owner])

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
