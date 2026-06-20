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
The Jugnoo team (currently just the app's creator) who runs the internal admin app, **Lantern**. Modelled as a `User` with `role = ADMIN`. The Operator hand-onboards pilots: creates each `Business` ahead of time and records the future Owner's email on it. The Operator can also sign into the customer dashboard (`apps/web`) and **view and operate any business** there — not just ones they own (see [Cross-business access]); businesses stay single-owner, this is an admin read of all of them, not co-ownership.
_Avoid_: admin (fine as the role value, but "Operator" for the person), app owner (collides with [Owner])

**Cross-business access**:
The Operator's ability, as a `role = ADMIN` user, to select and fully operate **any** business in the customer dashboard, with the same rights as that business's [Owner]. An [Owner] sees only the businesses they own; an admin's candidate list is every business. **Google access is a separate axis**: live Reviews/Analytics and reply posting gate on a per-person `business.manage` grant (the Phase 2 "Connect Google" step) held by whoever manages that business — independent of `role`. So an admin sees everything stored in our DB (private feedback, sentiment, taxonomy, form config, orders) for every business, but live Google reviews only for the business(es) they personally hold a grant for. The two compose: an account that is **both** an [Owner]/manager and an admin gets the full switcher *and* live Google data for the business it manages. Distinct from co-ownership, which Jugnoo does **not** have — a business always has exactly one [Owner].
_Avoid_: super admin, impersonation, co-owner (there is no co-ownership)

**Active business**:
When a user has more than one business in their candidate list, the one currently selected in the dashboard — chosen via the header switcher and remembered per-device. Every dashboard page and API route scopes to it. A user with a single business always has that one active (no switcher shown). The selection is only honoured if the business is in the user's candidate list — their own businesses for an [Owner], every business for the Operator (see [Cross-business access]).
_Avoid_: current business (fine informally), selected account, default business

## Taxonomy

**Tag**:
The stable, identity-bearing unit of a business's taxonomy. Carries a permanent internal identity (never shown, never reused), a fixed [polarity], an optional [canonical key], an [authored language], and a set of per-language [labels]. Stored on `Review.tags` / `AnonymousFeedback.tags` **by identity**, never by wording.
_Avoid_: theme, chip (a chip is how a tag is *rendered*, not what it *is* — see below)

**Chip**:
A [tag] as rendered on the feedback form — its resolved [label] drawn as a tappable pill. "Chip" is the form-surface appearance; the underlying durable thing is the [tag].
_Avoid_: using "chip" for the stored or identity concept

**Custom chip**:
A [tag] an owner adds to **their own** business's form (`source = custom`), as opposed to one seeded from the [Taxonomy Template]. Has no [canonical key] (it isn't part of the shared, benchmarkable base). Adding one never changes the template or any other business.
_Avoid_: own tag, manual chip

**Deactivate vs. permanent delete**:
Two ways a [chip] leaves the form. **Deactivate** flips its `active` flag off — hidden from the form, but the [tag] and its [labels] stay, so historical feedback keeps resolving. **Permanent delete** removes the [tag] row entirely and is allowed **only** for a chip both younger than a week and never referenced by any feedback — so it can never orphan history.
_Avoid_: delete (ambiguous — say which), archive, remove (ambiguous)

**Label**:
The per-language display string for a [tag] or [category] — the only part a human ever sees, freely editable. A tag has one label per supported language.
_Avoid_: name, text, wording (when referring to the editable display string)

**Polarity**:
`positive` or `negative`, **fixed** per [tag] — a tag never flips. Drives which chips show at which rating and how `negativeTags` is derived on submission.
_Avoid_: sentiment (that's the analyzer's per-review judgement), sign

**Category** (zone):
A grouping of [tags] shown on the form and fed to the analyzer (e.g. Kitchen / Front of House / Atmosphere). Modeled symmetrically to a tag: also carries per-language [labels] and an optional [canonical key].
_Avoid_: section, group, tab

**Canonical key**:
An optional shared key inherited from a [category] template, letting the same operational concept ("long wait") be compared across businesses later. Custom or promoted tags have none. Carried now, not yet surfaced.
_Avoid_: slug, code, benchmark key

**Authored language**:
The language the owner originally typed a [tag] in — the last-resort anchor in the label fallback chain (active language → business default → authored language → any available label).
_Avoid_: original language, source language

**Base language**:
A business's primary language (its `defaultLanguage`) — shown as "BASE" in settings. Always enabled, cannot be turned off, and is the language the form renders in and the analyzer maps against. Other [supported languages] are optional add-ons whose blank [labels] auto-fill from the base. Distinct from [authored language], which is per-tag.
_Avoid_: primary language, master language, locale

**Supported languages**:
The set of languages a business's form is authored in (`supportedLanguages`); the [base language] plus any the owner has toggled on in settings. Toggling one on auto-fills its blank [labels] from the base; toggling one off hides it from the form but keeps its labels. Not the same as the (deferred) customer-facing language switcher — the form still renders only the [base language].
_Avoid_: locales, enabled languages (fine informally), translations

**Business Type**:
The vertical a business belongs to — `restaurant` now, `dentist` / `doctor` later. Determines which [Taxonomy Template] seeds the business's form at onboarding. Strictly distinct from [Category]: a Business Type classifies the *whole business*, a Category groups [tags] *within one business's form*.
_Avoid_: category (collides with the feedback zone), vertical, industry, segment, niche

**Taxonomy Template**:
A named, code-defined starter set of [categories] + [tags] (with per-language [labels] and [canonical keys]) for one [Business Type], seeded into a business's form **once at onboarding**. After seeding, the taxonomy is owned and edited per business — the template is not a live link. One template per Business Type.
_Avoid_: template (bare — collides with [Card Template]), category template, preset, starter pack

## Review generation

**Mood** (tone band):
The emotional tone of an AI-generated review, fixed by the customer's star rating in three bands — **1–2★** honest/disappointed, **3★** balanced/lukewarm, **4–5★** warm/positive. The [chips] and free text set *what* the review says; the mood sets *how* it says it. Surfaced to customers on the review-ready screen (the "How was this written?" explainer) so a tone they didn't expect for their rating doesn't read as a defect.
_Avoid_: sentiment (that's the analyzer's per-review judgement of a submitted review — see [Polarity]), vibe, emotion

**Draft version**:
One of up to three AI-generated drafts the customer can navigate between on the review-ready screen. Each version is independently editable and keeps its own edits; regenerating *appends* a new version rather than replacing the current one. The version on screen is the one that gets copied/submitted. Lives only in the browser session — versions are not persisted.
_Avoid_: regeneration (that's the *action* that creates a version), attempt, revision

## Cards

**Scan token**:
The short, random, ambiguity-free code (e.g. `K7M2P`) carried in a [Token card]'s QR path (`/q/{token}`) and printed in human-readable form beneath it. It is a pointer to a *mapping we own* (token → business), **not** a business baked into the card — so the same token may be printed on many physical cards, and the mapping can be assigned, reassigned, or retired without reprinting. There is **no per-physical-card entity**; the token is the unit. See [ADR-0015](docs/adr/0015-qr-code-assignment.md).
_Avoid_: code (collides with the dormant `QrCode.code`), qr code (the image, not the code), scansrc

**Token card**:
A pre-printed **generic** (logo-less, Jugnoo-branded) stock card whose QR encodes `/q/{[Scan token]}`. The business is unknown at print time and the card is **assigned on-site** in [Lantern]; a server redirect resolves the token to the assigned business's form, forwarding the token as a `?token=` URL param for **client-side/GA analytics only** (not persisted server-side, exactly like [src]). Co-branded token cards are generated *after* assignment. Contrast [Direct-URL card].
_Avoid_: generic card (informal), counter card (a placement, not the mode)

**Direct-URL card**:
The existing owner-self-serve card whose QR encodes a business's form URL **directly** (`/{businessId}`), co-branded with the owner's own logo. The business is known at generation (the owner is signed in), so there is nothing to assign. Coexists with — is not replaced by — the [Token card]. See [ADR-0001] (the `?src` channel param) and [ADR-0015].
_Avoid_: self-serve QR (overlaps [Print Sheet]), business-URL card

**Card Template**:
A predefined Jugnoo-designed card layout (fixed copy, fixed funnel steps, locked "Powered by Jugnoo" attribution) that a business personalises with its own logo. Delivered as **print-ready SVG artwork** with two named injectable slots — `#qr-code` (a square box the generated QR fills) and `#brand-logo` (the box the business logo fills). All other copy is baked into the artwork and **not editable**. There are **four** templates, one per ([hasNfc] × [Card language]) combination; the studio selects the matching file. (Earlier the layout was a React component with one template; that is superseded — see the cards ADR.)
_Avoid_: card design, design (implies user-authored layout — it isn't), poster, flyer

**Card language**:
The language an SVG [Card Template] is authored in — `en` or `de`. A *template-selection* dimension (each language is a wholly separate SVG with baked copy), **not** a runtime/i18n setting. Defaults to the business's [FormConfig].`defaultLanguage`; the studio may offer the other language as a deliberate choice (e.g. English cards for a German café's tourists). Persisted on the [Print Order].
_Avoid_: locale, i18n, translation (copy isn't translated at runtime — the whole artwork differs)

**Brand-logo slot** (`#brand-logo`):
The injectable box in a [Card Template] SVG that holds the **business's** logo, fitted contained-and-centered. Fixed on the **right**; the locked Jugnoo mark `#jugnoo-logo` sits on the **left** and is always present. The two are independent — no repositioning. When a business has **no** logo, the brand-logo slot simply renders empty (the static left-side `#jugnoo-logo` still brands the card).
_Avoid_: logo (ambiguous — say brand-logo vs jugnoo-logo)

**hasNfc**:
A boolean on a personalised card. When on, the card renders the "Tap phone" block and is **order-only** (cannot be self-printed). When off, the card is QR-only and may be self-printed or ordered.
_Avoid_: nfc support, nfc enabled, format

**Print Sheet** (self-print):
A self-serve, print-at-home **PDF** the business generates and prints themselves — a 2×3 grid of **six identical QR-only cards** on one A4 page with hairline cut lines. Generated **client-side** (no operator involvement), **QR-only** ([hasNfc] cards can't be self-printed → order only), and rendered as the **Jugnoo-mark-only card without the business logo** (the [brand-logo slot] is left empty; a business logo appears only on operator-fulfilled [Print Order]s). Distinct from a [Print Order] (operator-fulfilled physical cards) and from the bare QR PNG/SVG download (just the scan code, no card artwork).
_Avoid_: print order (that's the operator path), download (ambiguous — also the bare QR export), poster

**Token Print Sheet** (operator-side):
The [Operator]'s print-ready **PDF** for a [Token card], generated in [Lantern] from a single [Scan token]: one A4 page carrying **four counter-card design variants, all bearing that one token's QR**. **Logo-less** (generic Jugnoo-branded stock — a business logo only appears on post-assignment co-branded cards) and generatable for a token in any state. Built **fully vector, no rasterization**: the artboard SVG (copy outlined to curves) is the single source — a build script (`gen:print-template`) converts it to a vector PDF and derives the slot boxes, then pdf-lib stamps the QR into those slots — contrast the web [Print Sheet], which is client-side and **rasterized**. The current template prints **no human-readable code** (deferred — the [Scan token]'s "code printed beneath the QR" requirement still holds for [Token card]s generally). See [ADR-0017](docs/adr/0017-token-print-sheet-vector-pdf-template.md).
_Avoid_: print sheet (that's the web, rasterized, self-serve artifact), batch sheet, card sheet

**Print Order**:
A request from a business to have physical cards produced and shipped by Jugnoo. A **basket** of one or more [Print Order Item]s assembled in the studio cart and submitted together; carries one [logo] snapshot shared by all its items. Free during the pilot. The only path to obtain an NFC card. **A business may have only one *active* (unfulfilled) Print Order at a time** — while one is being processed the studio is locked and shows "under processing"; ordering reopens only when the [Operator] marks it fulfilled. There is no business-side cancel.
_Avoid_: order (too generic), print job, print request

**Print Order Item**:
One line of a [Print Order] cart: a single ([hasNfc] × [Card language]) variant plus a quantity (1–6). The studio cart lets the business add, adjust, or remove items per variant before submitting. A variant whose [Card Template] SVG doesn't exist yet cannot become an item (blocked in the studio and rejected server-side). Each variant is capped independently — the earlier shared "max 5 across the order" pool is retired.
_Avoid_: line, cart row (informal), sku

**Card theme** _(retired)_:
Was the colour arrangement of the React card — `green-black` / `black-green`. **No longer a concept:** the SVG [Card Template]s are single-treatment artwork, so theme is dropped from the studio and no longer written. The `PrintOrder.theme` column lingers only for old rows. The card's second dimension is now [Card language], not theme.

## Notifications

**Private-feedback alert**:
An email sent to the [Owner] the moment a customer leaves [private] feedback (`source = private`) — the unhappy/captured-for-you submissions that, by design, never reach Google, so the alert is the Owner's only channel to learn of them. Always goes to the Owner's verified email; not sent for `google_redirect` submissions. Currently real-time, one email per submission. **Detail-free by design**: it carries only the star rating and a dashboard link — the comment and chips are withheld so the Owner must log in to read them (the monetization hook).
_Avoid_: review alert (Google reviews are a separate, unbuilt alert), digest (the deferred batched form), notification (too generic)
