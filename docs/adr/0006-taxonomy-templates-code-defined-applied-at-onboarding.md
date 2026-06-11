# Taxonomy Templates are code-defined and applied once at onboarding

**Status:** accepted

A new business needs a working feedback form on day one, but the settings editor is
light-edits-only (owners can't build a taxonomy from scratch — see ADR-0005). So each
**Business Type** (`restaurant` now; `dentist` / `doctor` later) has a **Taxonomy Template**:
a code-defined config of starter categories + tags (en/de labels, canonical keys) that is
seeded into the business's form **once, at onboarding** (`applyTaxonomyTemplate`, shared by
Lantern onboarding and any future re-seed path). `Business.businessType` records which
template was used.

## Decisions

- **Templates live in code** (`packages/db/src/taxonomy-templates.ts`), not in the database
  and not Operator-editable in Lantern. With one Operator and rarely-changing verticals, the
  DB tables + admin CRUD weren't worth it; a typed config + deploy is simpler and
  version-controlled. Adding a Business Type = a key in the registry + a deploy.
- **Apply once, then detach.** The template seeds rows and is *not* a live link — editing the
  template never touches already-onboarded businesses. Each business owns its taxonomy after
  seeding and edits it in its own settings.
- **The seed keeps bespoke demo taxonomies.** `prisma/seed.ts` does not consume the template;
  its per-business taxonomies are deliberately varied demo data. The template is the
  onboarding path's source of truth, not the seed's.
- **Create-only / idempotent.** `applyTaxonomyTemplate` no-ops if the business already has a
  FormConfig, and runs inside the onboarding transaction so a failed seed never leaves a
  business without a form.

## Consequences

- The "No feedback form is configured" empty state should now only appear for businesses
  onboarded *before* this change; fixing them forward needs a one-off re-seed.
- Template edits do not propagate. Improving the restaurant starter set helps only businesses
  onboarded afterward — existing ones must be edited per business (by design).
