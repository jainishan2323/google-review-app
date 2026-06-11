# PRD — Multilingual Tag (Taxonomy) Management

**Status:** Draft · **Owner:** Product · **Date:** 2026-06-10
**Related:** [docs/ARCHITECTURE.md](../ARCHITECTURE.md) · ADR to follow (tag identity vs. display)

---

## 1. Summary

Tags are the chips a customer taps on the feedback form — positive ones at high ratings,
negative ones at low. They are the single most cross-cutting concept in Jugnoo: they drive the
form, feed the AI review generator, define the taxonomy the analyzer maps reviews against, and
power dashboard analytics.

This PRD introduces a **stable tag identity** separate from its **display label**, and makes the
display label **per-language**. The result: owners can author, rename, and translate chips in any
language without ever disturbing historical feedback or fracturing analytics, and we can add new
languages and business categories later as additive changes rather than rebuilds.

## 2. Problem & Why Now

**Today a tag's identity *is* its display string.** In the current data model, a chip is just a
string in `FeedbackCategory.positiveChips` / `negativeChips`, and that exact string is what gets
stored on every `Review` and `AnonymousFeedback` (`tags` / `negativeTags`), what the analyzer
matches against, what the review generator is handed, and what every analytics query filters on
(`tags: { has: "Great Service" }`).

Consequences of identifying a tag by its wording:

- **Renaming or translating a chip orphans history.** Change "Long Wait" → "Slow Service" and
  every past review tagged to the old wording silently falls out of analytics.
- **Analytics can't unify across languages.** A German chip and its English equivalent are two
  unrelated strings, so the same operational concept fractures into separate buckets.
- **"Any language" is impossible.** There is no place to hold more than one label per concept.

**Why now:** the app is **pre-launch** — only seed data exists, the Google Business Profile API is
unapproved, and form caching is disabled for testing. Getting the tag structure right is expensive
to undo once real, live-tagged data exists. We design it now, while we still have only restaurants
and one language, specifically so that adding more of each later is additive.

## 3. Goals & Non-Goals

### Goals
- A tag has a permanent **identity** (never shown, never reused) and a set of freely editable
  **per-language labels**.
- All storage, analytics, AI generation, and analysis operate on identity; only the form and the
  settings screen ever read a label.
- Owners author a tag in their own working language and never think about translation; the system
  auto-fills other languages, which the owner may then edit.
- Adding a new supported language later is a background fill of labels, not a migration.
- Removing a chip **deactivates** it (disappears from the form) but keeps its label resolvable so
  historical feedback still makes sense.

### Non-Goals (this release)
- **Full add / reorder / new-category editor.** v1 ships a curated, template-seeded taxonomy with
  **light edits only** (edit labels + translations, toggle active/inactive). The full lifecycle
  editor follows once we see real usage.
- **Customer-facing language switcher on the form.** v1 renders a single language — the business
  default. The multilingual data, translation, and `supportedLanguages` infra are all built and
  editable in settings, but customers do not self-select language yet.
- **Promoting analyzer "unmapped insights" into tags.** The data model reserves a `source` value
  for it; the one-tap UI is a future release.
- **Cross-business benchmarking dashboards.** We carry the `canonicalKey` now (cheap) but do not
  build comparison views yet.

## 4. Core Principle (the decision everything hangs off)

> **A tag has an IDENTITY that never changes and a DISPLAY that can change freely.**
> Identity = a stable internal key the user never sees.
> Display = a per-language label shown on the form and in settings.

Storage, analytics, AI generation, and the analyzer all operate on the identity. Only the form and
the settings screen ever touch the label. This is what makes "any language" a cosmetic layer we can
add, translate, and edit without ever disturbing historical data or fracturing analytics. The
mistake to avoid is identifying a tag by its display text — then a rename or a translation orphans
every review tagged to the old wording.

## 5. What a Tag Carries

| Attribute | Description | v1 |
|---|---|---|
| **Identity** | Permanent internal key, never reused or changed, never shown. | ✅ |
| **Polarity** | `positive` or `negative`, **fixed** per tag — a chip never flips. | ✅ |
| **Labels** | One display string per supported language, freely editable. | ✅ |
| **Order** | Display order within its category. | ✅ |
| **Active flag** | Inactive = hidden from form, still resolvable for history. | ✅ |
| **Source** | Where it came from: `template`, `custom`, or `insight` (promoted). | ✅ (`insight` reserved) |
| **Authored language** | The language the owner originally typed it in (fallback anchor). | ✅ |
| **Canonical key** | Optional shared key inherited from the category template, so the same concept ("long wait") can be compared across businesses later. Custom/promoted tags have none. | ✅ (carried, not yet surfaced) |

Tags are grouped under a **category** ("zone", e.g. Kitchen / Front of House / Atmosphere). Because
category names are shown on the form and fed to the analyzer, **categories also carry per-language
labels and an optional canonical key**, modeled symmetrically to tags.

## 6. How "Any Language" Behaves

- **Author once.** Owners write a tag in their working language and never deal with translation.
- **Auto-fill, never locked.** On save, the system fills the other supported languages' labels;
  the owner can edit any translation afterward. Manual edits always win and are never overwritten.
- **Never-blank display (fallback chain).** A chip resolves its label as:
  **active language → business default language → the language it was authored in → any available
  label.**
- **New language = background fill.** Enabling a brand-new language later fills new labels for
  existing tags. Nothing existing moves, because identities are stable and labels are additive.

## 7. Management Lifecycle

| Capability | v1 | Notes |
|---|---|---|
| **Seed from a category template** (restaurant now; dentist/doctor later) supplying starter tags with canonical keys + base labels. | ✅ | Applied at business provisioning. |
| **Edit labels & translations** | ✅ | Per-language label fields in settings. |
| **Toggle active / inactive** (deactivate = remove from form) | ✅ | **Never hard-delete** — label stays resolvable for historical analytics. |
| **Add / reorder / new category** | ❌ (later) | Template is the starting point; full editor follows. |
| **Promote an unmapped insight to a tag** (one-tap, auto-translated) | ❌ (later) | `source = insight` reserved now. |

**Removal must deactivate, never hard-delete.** A removed chip disappears from the form, but its
identity and labels remain so historical feedback tagged to it still resolves in analytics.

## 8. Who Uses Identity vs. Label (must stay consistent)

| Consumer | Operates on | Behavior |
|---|---|---|
| **Stored tags on reviews/feedback** | **Identity** | `Review.tags` / `AnonymousFeedback.tags` hold tag identities, never display words. |
| **AI review generator** | Label + language | Receives the tag labels resolved to the customer's language plus a "write in {language}" instruction; outputs in that language. |
| **Analyzer** | Canonical key + one canonical-language label | Builds its taxonomy from keys plus one label to map against, so reviews in different languages map to the same concept; output is mapped back to identities before storage. |
| **Form** | Label (read) | Renders chips in the business default language via the fallback chain; submits identities. |
| **Settings screen** | Label (read/write) | The only place labels are edited. |

This consistency is the entire reason analytics stay unified across languages: every consumer
speaks "identity," and "label" is for human eyes only.

## 9. Form & Submission Behavior

- Form loads the active tags for the business, resolves each label to the **business default
  language**, and renders chips grouped by category.
- Rating ≥ 4 shows **positive** chips; rating < 4 shows **all** chips. (Polarity now drives this
  selection directly, rather than two separate string arrays.)
- The customer selects chips; the form submits **tag identities**.
- On submit, `negativeTags` is derived from each selected tag's **polarity** (by identity), not by
  string-matching against a negative-chip list.

## 10. Guardrails

- **Cap active chips per polarity** (~6–8) per category, so the form stays usable.
- **No two active tags share the same label** in the same language within one business.
- **Sanitize and length-limit labels** — they are user input that also reaches the LLM
  (strip markup characters, trim, hard cap ≈ 40 chars).
- **Polarity is fixed** per tag. Changing polarity means deactivating the tag and creating a new
  one, preserving the analytics integrity of historical identities.

## 11. Confirmed Decisions

1. **Editor scope → Light edits first.** Template-seeded taxonomy; owners edit labels/translations
   and toggle active. No add/reorder/new-category in v1. *Rationale:* ships faster, lower risk, and
   the save path never deletes/recreates tags — so identities (and the analytics ids that reference
   them) are always preserved.
2. **Canonical key → carry now.** Nullable, set from templates; unlocks future cross-business
   benchmarking at zero cost. Custom/promoted tags have none.
3. **Form language → business default only.** One language on the form via the fallback chain; all
   multilingual infra built and editable in settings, but no customer-facing `?lang` switcher yet.

## 12. Data Migration Posture

Pre-launch with seed data only → **clean schema change + reseed, no backfill.** The only
destructive change is dropping the old chip-string fields and introducing normalized tag/label
tables. The stored `tags` columns on `Review` / `AnonymousFeedback` keep their array shape but
change meaning from labels to identities, populated fresh by the reseed.

## 13. Risks

- **The identity-vs-label boundary is silent.** Stored `tags` change *meaning* (label → identity)
  without changing *type*, so any consumer that still treats them as display strings will silently
  render identities instead of human labels rather than failing loudly. Every reader of `tags` /
  `negativeTags` must be audited (notably the feedback inbox and tag drill-down).
- **Settings save must preserve identities.** Editing labels/active must update in place and never
  delete-and-recreate tags, or historical analytics references are orphaned — the exact failure
  this whole effort exists to prevent.
- **Translation quality / latency.** Auto-fill calls the LLM on save; labels must be sanitized and
  length-capped before the call, and a sensible fallback (source text) used if translation fails.

## 14. Success Criteria / Acceptance

- A chip's label can be renamed or translated and **all historical feedback tagged to it remains
  attributed** in analytics.
- The form renders chips in the business default language and submits identities; `negativeTags` is
  derived from polarity.
- The review generator produces output in the customer's language.
- The analyzer maps same-meaning reviews in different languages to the **same** identity.
- Deactivating a chip removes it from the form while its historical feedback still resolves to a
  readable label.
- Adding a hypothetical new supported language fills labels for existing tags without moving or
  re-tagging any existing data.

## 15. Open Questions

- Initial supported languages: confirmed `en` + `de` for the German pilot market — any others at
  launch?
- Exact active-chips-per-polarity cap (6, 7, or 8)?
- When (which release) do we surface the canonical key in a cross-business comparison view?
