# Customer-facing form language switcher is client-resolved

## Status

accepted

## Context

The feedback form was always authored in multiple languages — tags, categories,
and the welcome message carry per-language [labels], `FormConfig.supportedLanguages`
already exists, the dashboard settings editor already auto-translates labels into an
enabled language, and `generateReviewText` already accepts a `language`. The one
missing piece was customer choice: the form resolved everything server-side to the
business [base language] and shipped **pre-resolved strings**, with no switcher.

This decision is about adding a customer-facing language switcher (en/de for now)
without sacrificing the form's QR-scan hot-path caching.

## Decision

The active **form language** is **client state**, resolved on the client — the
server keeps rendering the base language.

- `getFormData` ships a **per-supported-language pre-resolved bundle**
  (`Record<lang, ResolvedFormConfig>`), not raw label maps and not a single resolved
  set. `resolveLabel`'s fallback chain stays server-only (single source of truth);
  the client just picks `bundle[active]`.
- The opening language comes from the [language cue] (`?language=`), read **client-side**
  via `useSearchParams`, honoured only if it's in `supportedLanguages`, else the base
  language. **No browser-locale sniffing** — the printed card is the signal.
  - **Cache key:** because the route never reads `searchParams` on the server, it stays
    statically rendered and its Full Route Cache / ISR entry is keyed by **pathname only** —
    the query string is not part of the key and is invisible to the server render. So
    `?language=de`, `?language=en`, and a bare URL all serve the **same** cached HTML
    (one entry, no fragmentation); the cue is applied purely in the browser. This single
    entry is a *direct consequence* of the client-only read and **inverts the moment any
    server code touches `searchParams`** (Option B), which both forces dynamic rendering
    *and* would split the cache per query — one more reason B is strictly worse.
- The switcher sits top-right on every screen (step 1 onward). Switching is pure state:
  it re-resolves chips + welcome, swaps the [chrome] dictionary, and **never clobbers or
  auto-regenerates** an existing (possibly edited) AI draft — the new language takes
  effect on the next generate. The free-text note is never translated.
- Static UI [chrome] is a **lightweight typed dictionary** (`satisfies Record<Locale, Messages>`
  so a missing translation fails `type-check` — our only working gate), **not** an i18n
  library. next-intl/i18next are built around locale **routing** + server resolution,
  which is exactly the dynamic-render model we reject below.
- The AI drafts the review in the **active** form language (client passes it to
  `/api/generate`), not a fixed language.
- The **welcome message** uses a dedicated chain — authored-in-active-language →
  **localized code-default** (from the chrome dict) → (never the other language's
  welcome). Right-language-generic beats wrong-language-custom; it deliberately does
  **not** route through `resolveLabel`, which can't see the code-default and would fall
  through to the base-language welcome.
- Each submission records its `AnonymousFeedback.language` for adoption analytics.

## Considered options

- **A — client-resolved (chosen).** Preserves the Full Route Cache; the switcher is a
  state flip with no round-trip. Cost: the step-1 welcome line can briefly **flash**
  from base → cued language on hydration, only for scans whose card language ≠ base.
- **B — server reads `searchParams`.** Zero flash, but reading `searchParams` makes the
  route **dynamic for every scan**, destroying the Full Route Cache (the DB cache via
  `unstable_cache` survives). Rejected: B is a *superset* of A's work — the switcher
  still needs client-side maps to flip without a navigation, so B pays A's cost **plus**
  the dynamic-render cost, buying only the elimination of a one-line flash.
- **C — language as a cached route segment** (`/[lang]/[businessId]`). Gets both zero
  flash and full caching, but changes the agreed `?language=` cue contract and adds
  per-language `generateStaticParams` plumbing. **Deferred** as the scale-up path.

## Consequences

- The form route stays statically cached (ADR-0016 intact); the only regression is the
  bounded step-1 welcome flash on minority/cued-language scans.
- The client payload carries every supported language's resolved config (a few KB) —
  trivial for two languages, worth re-checking if many languages land per business.
- Language identity stays **base ISO 639-1 codes** (`en`, `de`, later `hi`) everywhere,
  matching existing label-map keys and DB columns. Region-qualified locales (`en-GB`,
  `de-DE`) are **deferred** — no integration consumes region yet, and adopting them now
  would mean migrating every tag's label JSON.
- Server-rendered strings outside the client component (the "form no longer active"
  fallback, `FormSkeleton`, `<html lang>`) remain base-language for now — acceptable, as
  they're transient/edge.
- Provisioning a business for German is **not** part of this work: an operator toggles it
  on in existing settings (labels auto-translate) and types the German welcome. Only the
  pilot business needs that done.
