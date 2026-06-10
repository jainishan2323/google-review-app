# CLAUDE.md

Jugnoo — a Google review management platform for local businesses (collect customer feedback, route happy customers to Google, AI-draft replies, analyze sentiment). A pnpm + Turborepo monorepo of four Next.js 16 apps and four shared packages.

> Architecture, request flows, and where features live → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). This file is the operational briefing only.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5.7 (strict) · Tailwind v4 · Prisma 5 + PostgreSQL · NextAuth v4 (Google) · OpenAI · Zod v4. **Package manager: pnpm 9.15** (workspaces). Build orchestration: Turborepo.

## Commands

Run from the repo root unless noted.

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Dev (all apps) | `pnpm dev` — frees ports 3000–3003, then `turbo run dev` |
| Dev (one app) | `pnpm --filter @repo/web dev` (or `@repo/form`, `@repo/landing`, `@repo/lantern`) |
| Build | `pnpm build` |
| Type-check | `pnpm type-check` (per app: `pnpm --filter @repo/web type-check`) |
| DB client/codegen | `pnpm db:generate` |
| DB push schema | `pnpm db:push` |
| DB migrate | `pnpm db:migrate` |
| DB seed | `pnpm --filter @repo/db db:seed` (runs `prisma/seed.ts` via tsx) |
| Prisma Studio | `pnpm db:studio` |

**App ports:** web `3000`, form `3001`, landing `3002`, lantern `3003`.

**Non-obvious:**
- App `build` scripts run `prisma generate` first; `type-check` and `build` depend on `^build` (upstream packages build first) — run `pnpm db:generate` after schema changes or types will be stale.
- **`pnpm lint` / `next lint` is currently broken** under Next 16 (the `lint` script is misconfigured and errors with `no such directory: .../lint`). Rely on `pnpm type-check` as the gate; don't trust a green lint.
- No test suite exists in the repo. "Verify" = `type-check` + `build` + manual run.

## Conventions

- **Workspace imports:** consume shared code via `@repo/db`, `@repo/llm`, `@repo/types`, `@repo/ui` (packages export raw `src/*.ts` — no build step to import them).
- **Prisma client:** always `import { prisma } from "@repo/db"` (a global singleton); never `new PrismaClient()`.
- **LLM access:** call helpers from `@repo/llm` (`draftReply`, `generateReviewText`, `analyzeBatch`, …) or `getLLMClient()`. **Never import `openai` (or any provider SDK) directly in feature code** — the provider is swappable via `LLM_PROVIDER`.
- **App Router:** server components by default; mark client components with `"use client"`. Mutations go through server actions (`src/actions/*`, `src/app/actions/*`) or route handlers (`src/app/api/*`).
- **API input validation:** validate request bodies with Zod and sanitize free text (see `apps/form/src/app/api/generate/route.ts` for the `sanitize` + schema pattern).
- **UI components:** there are **two** layers — shared primitives in `@repo/ui` *and* per-app shadcn-style components in each app's local `src/components/ui/*`. Most app UI uses the local copies; check the local folder first before reaching for `@repo/ui`.
- **Styling:** Tailwind v4 via `@tailwindcss/postcss`; `cn()` helper lives in each app's `src/lib/utils.ts`.

## Environment variables (names only — never commit values)

See `.env.example` for the canonical list. Used across apps (declared in `turbo.json`):

- **Database:** `DATABASE_URL`
- **LLM:** `OPENAI_API_KEY`, `LLM_PROVIDER` (default `openai`), `AI_STREAMING` (`true` to stream form generation)
- **Auth (web + lantern):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- **Admin allowlist (lantern):** `ADMIN_EMAILS` (comma-separated)
- **Email (alerts):** `RESEND_API_KEY`, `ALERT_FROM_EMAIL`
- **App URLs / dev:** `NEXT_PUBLIC_FORM_URL`, `NEXT_PUBLIC_DASHBOARD_URL`, `DEV_BUSINESS_ID`

## Gotchas / things to know

- **Caching is intentionally disabled for testing.** The form app uses `export const revalidate = 0` and has `unstable_cache` removed (`apps/form/src/app/[businessId]/page.tsx`, `apps/form/src/lib/form-data.ts`), so config/data edits show instantly. **Re-enable ISR + caching before going public** — look for `TODO(perf, pre-public)` markers.
- **Dashboard resolves the business from the signed-in owner's verified email.** `apps/web` pages call `requireCurrentBusiness()` (`apps/web/src/lib/current-business.ts`), which maps `session.user.email` → `User` → their `businesses` (renders the first; modelled as a list). Owners + businesses are pre-created by the Operator in Lantern (`/dashboard/businesses`); an unprovisioned email lands on `/no-business`. Resolution keys off email, **never** `session.userId` (the unreliable Google `sub`). See `docs/adr/0004-owner-business-linking-by-verified-email.md`. (`DEV_BUSINESS_ID` is no longer read by the dashboard.)
- **Live Google Business data is in progress on the `feat/live-google-business-data` branch**, not `main`. That branch resolves the business from the signed-in session and fetches reviews live from the Business Profile API. Note: that API is quota-gated and returns 429 until Google approves the project. Don't document/assume live data when working on `main`.
- **Email alerts are modeled but not wired.** `AlertConfig` rows + `RESEND_API_KEY`/`ALERT_FROM_EMAIL` exist, but no code actually sends mail via Resend yet.
- **Owner Google sign-in is Phase 1 (identity only).** `apps/web` requests just `openid email profile` — no `business.manage`, no offline/consent — so there's no "unverified app" warning and no Google review access yet. The Reviews + Analytics tabs are kept in the nav as "coming soon"; Overview is private-feedback-first. The heavy scope is deferred to a Phase 2 "Connect Google" step. See `docs/adr/0003-google-signin-split-identity-then-authorization.md`. API routes (incl. `/api/generate-reply`) now scope to the owner via email resolution; `/api/reviews/[reviewId]/reply` still needs the Phase 2 access token and 401s until then.
- **Deploy:** Vercel, **one project per app** (web/form/landing/lantern on their own domains/subdomains). Each project needs its own env vars set; there is no `vercel.json` or CI in the repo.

## Vocabulary

- **Jugnoo** — the product (firefly in Hindi). Marketing domain `jugnoo.olbaid.de`; form at `feedback.jugnoo.olbaid.de`.
- **Review gating funnel** — the form's core flow: rating ≥4 → AI-drafted review + redirect to Google; rating <4 → captured privately (not sent to Google).
- **Anonymous / private feedback** — customer feedback stored in `AnonymousFeedback` (not a public Google review). `source` is `private` or `google_redirect`.
- **Taxonomy / categories** — per-business `FeedbackCategory` dictionary of positive/negative chips; drives both the form and the analyzer.
- **Mapped tags vs unmapped insights** — the batch analyzer maps review text onto the taxonomy (mapped tags) and surfaces novel themes outside it (unmapped insights).
- **Lantern** — the internal admin app (`apps/lantern`).
