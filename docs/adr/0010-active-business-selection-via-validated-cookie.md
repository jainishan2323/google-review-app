# Active-business selection via a validated cookie

The dashboard lets an [Owner] who owns multiple businesses pick which one is **active**. We store that choice in a per-device cookie (`activeBusinessId`), read inside `resolveCurrentBusiness()`, which returns the cookie's business **only if the signed-in owner actually owns it** (else it falls back to the oldest). Because every dashboard page and API route already resolves through that one function, the selection threads through the whole app with no call-site changes. A header dropdown (in place of the static business badge, shown only when an owner has >1 business) sets the cookie via a server action and hard-reloads.

## Why

The data model was already one-owner-to-many-businesses and the resolver already loaded the full list — only "which one is active" was missing. The three ways to carry that:

- **Cookie (chosen).** Smallest change: one line in the resolver, zero route-shape or call-site churn. Per-device, which is fine for a pilot.
- **URL (`/dashboard/[businessId]/…`).** Rejected: this is the large refactor we wanted to avoid — every route, link, and resolver call changes shape. Reconsider only if shareable per-business URLs become a requirement.
- **DB column on `User`.** Rejected for now: auth keys off the verified email and the session has no reliable `User.id` (the Google `sub` ≠ Prisma id — see [ADR-0004](0004-owner-business-linking-by-verified-email.md)), so persisting a selection means an extra email→user lookup on every switch. Cross-device persistence isn't worth that during the pilot.

## Consequences

Security rests on **re-validating the cookie against the owner's own business list every request** — a tampered cookie is inert, it can only ever resolve to a business the owner already owns. Switching does a full reload because some dashboard data (Reviews, Analytics) is fetched client-side; a soft RSC refresh alone could leave those showing the previous business. The selection is per-device and non-persistent across browsers, which is acceptable while the only multi-business user is the Operator overseeing the pilot.
