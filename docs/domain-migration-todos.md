# Domain migration → jugnoo.de

Strategy: **feedback dual-serves both domains** (existing QR cards never break);
**landing/app/lantern redirect old → new**; **email stays `jugnoo@olbaid.de`**.

Target layout: `jugnoo.de` (landing) · `feedback.jugnoo.de` (form) ·
`app.jugnoo.de` (dashboard) · `lantern.jugnoo.de` (Lantern admin).

> Fill in before starting: `<OLD_DASHBOARD_DOMAIN>` and `<OLD_LANTERN_DOMAIN>` — the
> current dashboard/Lantern hostnames (not stored in the repo).

## 1. DNS — Spaceship (Advanced DNS for jugnoo.de)
- [ ] Apex `jugnoo.de` → A record, host `@`, value per Vercel apex (typ. `76.76.21.21`)
- [ ] `feedback` → CNAME → `cname.vercel-dns.com`
- [ ] `app` → CNAME → `cname.vercel-dns.com`
- [ ] `lantern` → CNAME → `cname.vercel-dns.com`
- [ ] (Old `*.jugnoo.olbaid.de` DNS stays as-is — already points to Vercel)

## 2. Vercel — domains & redirects (per project)
- [ ] landing: add `jugnoo.de`, set Primary; old `jugnoo.olbaid.de` → Redirect to primary
- [ ] form: add `feedback.jugnoo.de`, set Primary; old `feedback.jugnoo.olbaid.de` → **No Redirect** (both serve)
- [ ] web: add `app.jugnoo.de`, set Primary; `<OLD_DASHBOARD_DOMAIN>` → Redirect to primary
- [ ] lantern: add `lantern.jugnoo.de`, set Primary; `<OLD_LANTERN_DOMAIN>` → Redirect to primary
- [ ] Confirm each new domain: Valid Configuration + SSL issued

## 3. Vercel — env vars (Production scope)
- [ ] **web: `NEXTAUTH_URL=https://app.jugnoo.de`** — required; auth breaks without it.
  - `NEXT_PUBLIC_FORM_URL` — optional in web (only the Cards page reads it; code already
    falls back to `https://feedback.jugnoo.de`). Set to `https://feedback.jugnoo.de` only
    if you want it explicit.
  - `NEXT_PUBLIC_DASHBOARD_URL` — **not read by any code; skip it** (leftover placeholder).
- [ ] lantern: `NEXT_PUBLIC_FORM_URL=https://feedback.jugnoo.de` (set explicitly — this is
      where operators mint permanent physical QR cards) · `NEXTAUTH_URL=https://lantern.jugnoo.de`
- [ ] form: (no domain env needed)
- [ ] Leave `ALERT_FROM_EMAIL` unchanged

## 4. Google Cloud Console — OAuth (both clients: web + lantern)
- [ ] web client: add JS origin `https://app.jugnoo.de` + redirect URI `https://app.jugnoo.de/api/auth/callback/google`
- [ ] lantern client: add JS origin `https://lantern.jugnoo.de` + redirect URI `https://lantern.jugnoo.de/api/auth/callback/google`
- [ ] OAuth consent screen → Authorized domains → add `jugnoo.de`
- [ ] Keep old `*.jugnoo.olbaid.de` origins/URIs during transition (remove later)

## 5. Code changes (in this repo)
- [ ] Landing `SITE_URL` → `https://jugnoo.de` in `layout.tsx`, `robots.ts`, `sitemap.ts`
- [ ] Form back-links (5×) → `https://jugnoo.de` in `ReviewForm.tsx`
- [ ] `feedback.jugnoo.olbaid.de` fallback defaults → `feedback.jugnoo.de` in
      web `cards/page.tsx` + lantern `qr-codes/page.tsx`, `svg/route.ts`, `pdf/route.ts`
- [ ] Docs: `CLAUDE.md` vocabulary + `ADR-0015` example URLs
- [ ] Leave all `jugnoo@olbaid.de` mailto links unchanged
- [ ] `pnpm type-check` + `pnpm build`

## 6. Deploy & verify
- [ ] Redeploy all 4 Vercel projects
- [ ] `jugnoo.de/robots.txt` + `/sitemap.xml` → all URLs on `jugnoo.de`
- [ ] Old landing/app/lantern URLs 308-redirect to new
- [ ] `feedback.jugnoo.olbaid.de/q/{existingToken}` still resolves (dual-serve proof)
- [ ] New Lantern QR SVG/PDF encodes `https://feedback.jugnoo.de/q/{token}`
- [ ] Google sign-in works on `app.jugnoo.de` + `lantern.jugnoo.de` (no `redirect_uri_mismatch`)

## Out of scope
Email migration (contact stays `jugnoo@olbaid.de`); retiring the old domains (kept attached indefinitely).
