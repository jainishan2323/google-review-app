---
status: accepted
---

# Form uses a 30s TTL cache, not cross-deployment on-demand invalidation

The public form (`apps/form`) and the dashboard/Lantern (`apps/web`, `apps/lantern`) are
**separate Vercel deployments**, so a config edit in the dashboard cannot call
`revalidateTag`/`revalidatePath` on the form — those only work in-process. Earlier, the form
cached config for 300s with a `form-config:${businessId}` tag that **nothing reachable ever
fired**, so owner edits took up to 5 minutes to appear. The interim "fix" was to disable caching
entirely (`revalidate = 0`, `unstable_cache` removed), which made the form's LCP server-gated on a
cold lambda + live Postgres read on every QR scan (~3.9s field p75).

**Decision:** re-enable caching on the form page (`/{businessId}`) with a **30-second TTL**
(`export const revalidate = 30` + `unstable_cache(getFormData, …, { revalidate: 30 })`), and rely
on ISR stale-while-revalidate for freshness. We deliberately do **not** build the "correct" solution
(a secret-guarded `POST /api/revalidate` endpoint on the form, fired after commit from the
dashboard and Lantern with tag-based invalidation on `form:${businessId}` + `token:${token}`).

## Considered options

- **On-demand cross-deployment invalidation (rejected for now):** instant (~1s) edits *and*
  CDN-fast loads, but introduces a public endpoint + shared secret, fire-after-commit hooks in two
  separate apps, and silent-failure modes — too error-prone for a pilot. If revisited, use
  **tag-based** invalidation (`revalidateTag`), never path-based: a business's form is reachable at
  an open-ended set of URLs (`/{businessId}` plus every `/q/{token}`), which paths cannot enumerate.
- **Denormalize config into a JSON column (rejected):** the 30s cache already collapses the
  relational query to ≤once/30s per business, so the cached payload *is* the cached JSON — without
  the dual-write/drift risk. The taxonomy stays relational (ADR-0005, ADR-0006).

## Consequences

- Config edits surface within ~1–2 refreshes, bounded by the 30s TTL — acceptable for demos/pilot,
  a large improvement over the prior multi-minute lag.
- The `/q/{token}` redirect stays dynamic (`revalidate = 0`) so token reassignment/retire is always
  exact; its residual cold-lambda hop is a separate, measure-first follow-up.
- Revisit on-demand invalidation only if the TTL staleness or the redirect hop shows up in Speed
  Insights / owner feedback.
</content>
</invoke>
