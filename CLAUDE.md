# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # dev server at localhost:3000
npm run build       # production build (type-checks + lint)
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # vitest (tests/)
npm run types:gen   # regenerate DB types from the live Supabase project (needs `npx supabase login` + `npx supabase link`)
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and build on every push and PR.

## Required Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values before running:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_AI_API_KEY            # Gemini (free tier at aistudio.google.com)
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL          # no trailing slash; used for every link in emails and Stripe redirects
```

Optional: `EMAIL_FROM` (sender; default only delivers to your own Resend address), and the dev mocks
`MOCK_AI`, `MOCK_EMAIL`, `MOCK_PAYMENT`. `MOCK_PAYMENT` is ignored when `NODE_ENV=production`.

`NEXT_PUBLIC_*` values are baked in at build time, so changing one on Netlify needs a redeploy.

## Architecture

**Next.js 14 App Router** with Supabase Auth + Postgres, Google Gemini generation, Stripe Checkout,
Resend emails, and `@react-pdf/renderer`.

### Route Groups
- `app/(auth)/` — unauthenticated pages (login)
- `app/(dashboard)/` — authenticated creator area (middleware + server layout guard)
- `app/(admin)/` — admin area (role checked against `profiles.role` via the service client)
- `app/proposal/[id]/` — **public** client-facing pages, no auth, served via the service client
- `app/api/` — all API routes use `export const dynamic = "force-dynamic"`

### Supabase Clients (`lib/supabase/server.ts`)
- `createServerClient()` — anon key + the user's cookie session. Subject to RLS. Use for anything
  acting *as the logged-in user*. Its return type is re-asserted to `SupabaseClient<Database>`
  because `@supabase/ssr` 0.5.x is typed against an older supabase-js signature.
- `createServiceClient()` — service-role key, **no session**, bypasses RLS. Use for public pages and
  routes that write on behalf of unauthenticated visitors. It must never read cookies: supabase-js
  sends the signed-in user's token when a session exists, which would silently turn this into a
  user-scoped client.
- `lib/supabase/client.ts` — browser client (Client Components).

### External Client Initialization
Stripe, Gemini and Resend clients are created **lazily inside functions**, not at module level, so the
build succeeds without env vars:
```typescript
function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!, ...) }
```

### Data Types
`lib/supabase/types.ts` is hand-maintained to match `supabase/migrations`. Tables need a
`Relationships` entry and the `Database` must be a `type` alias for supabase-js inference to work, so
writes are fully typed: **do not add `as any` casts**. After a schema change, update this file (or run
`npm run types:gen` and diff).

### Proposal Status Flow
`draft → sent → viewed → signed → paid`. The rules live in `lib/proposal-rules.ts` and are enforced
both in the API and, as a backstop, by the `guard_proposal_update` trigger (migration 004).

- `draft`: just created
- `sent`: the creator copied the link, or emailed it with "Send to client" (`POST /api/proposals/[id]/send`)
- `viewed`: a real client opened the link. Recorded by `<ViewTracker/>` from the browser, once per
  tab session; bots, link-preview unfurlers and the creator's own previews are ignored. A first view
  also promotes a `draft` to `viewed`.
- `signed`: client drew a signature (PNG, stored as base64 in `signature_data`). Allowed only from
  `sent`/`viewed`, via an UPDATE guarded by status so it is atomic.
- `paid`: Stripe `checkout.session.completed`, only when `payment_status` is `paid`, the amount
  matches, and the proposal is still `signed` (the update is conditional, so retries are harmless).

`signed` and `paid` proposals are read-only. The creator may only move `draft ⇄ sent`.

### AI Generation
`lib/gemini.ts` — `runGemini()` tries the models in `GEMINI_MODELS` with a shared 8.5s budget (Netlify
kills functions at ~10s, so only the fast "lite" models fit). Proposal JSON is validated with the zod
schema in `lib/schemas.ts`. Both proposal generation and the follow-up email use `runGemini()`.
Old model names (`gemini-2.0-flash`, `gemini-1.5-*`) are retired and 404, so prefer `-latest` aliases.
`MOCK_AI=true` skips the API. Generation is rate-limited per user (`lib/rate-limit.ts`, counted from
the `proposals` table).

### PDF Generation
`lib/pdf.tsx` — React tree rendered with `@react-pdf/renderer`. It's `.tsx` because it contains JSX,
and is listed in `next.config.mjs` as `serverComponentsExternalPackages`.

### Client email validation and sending
`lib/email-validation.ts` `checkClientEmail()` runs when a proposal is created and again before every send:
format (zod), a short throwaway-domain list, typo detection against popular providers (edit distance 1,
with `KNOWN_REAL_DOMAINS` exempt: `mail.com` is one letter off `gmail.com`), and a DNS check that the domain
has MX (or A) records. A DNS *failure* (timeout, SERVFAIL) never blocks; only a definite "no such domain"
or null MX does. `EMAIL_DNS_CHECK=off` skips DNS.

`POST /api/proposals/[id]/send` always sends to the address saved on the proposal (never one from the
request), refuses signed/paid/expired proposals, enforces `lib/send-limits.ts` (60s cooldown, 5 per
proposal) by *claiming* the send in the DB before emailing, and rolls the claim back if delivery fails.
Reply-To is the creator. `lib/email.ts` `deliver()` throws on Resend errors (Resend returns `{ error }`
instead of throwing). Do not export constants from route files; Next rejects it.

### Email (Resend)
`lib/email.ts`: viewed, signed, payment received (to the creator) and confirmation with PDF link (to the
client). All user-supplied text is HTML-escaped. Set `EMAIL_FROM` to a verified-domain sender. In
request handlers, send emails through `settleWithin()` (`lib/async.ts`), which waits at most a few
seconds and never throws, because floating promises can be killed on serverless.

## Database

Run the migrations in `supabase/migrations/` in order in the Supabase SQL editor.
**Run `004_security_hardening.sql` only after deploying the matching app code, and `005_email_send_tracking.sql` before deploying the Send button.**

- `profiles` is auto-created from `auth.users` by a trigger. Signed-in users can only edit their name
  and branding; `role` is writable only by the service role.
- `proposals.content` is `JSONB` (the `ProposalContent` object); `signature_data` is a base64 PNG.
- RLS: owners can read their own proposals; admins can *read* all; everything else goes through the
  service role.

## Stripe Setup

1. Create a webhook in the Stripe Dashboard pointing to `https://<your-site>/api/stripe/webhook`
2. Listen for `checkout.session.completed`
3. Put the signing secret in `STRIPE_WEBHOOK_SECRET`
4. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Netlify Deployment

Deployed with `@netlify/plugin-nextjs` (`netlify.toml`) from the `master` branch. Set every env var under
Site configuration → Environment variables, set `NEXT_PUBLIC_APP_URL` to the production URL, and trigger a
redeploy after changing any `NEXT_PUBLIC_*` value.
