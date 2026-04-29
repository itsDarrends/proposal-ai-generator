# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server at localhost:3000
npm run build     # production build (type-checks + lint)
npm run lint      # ESLint
```

## Required Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values before running:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

## Architecture

**Next.js 14 App Router** with Supabase Auth + Postgres, Claude AI generation, Stripe Checkout, Resend emails, and `@react-pdf/renderer`.

### Route Groups
- `app/(auth)/` — unauthenticated pages (login, magic link)
- `app/(dashboard)/` — authenticated creator area (layout guards via middleware + server component)
- `app/proposal/[id]/` — **public** client-facing pages — no auth required, served via service role
- `app/api/` — all API routes use `export const dynamic = "force-dynamic"`

### Supabase Clients
- `lib/supabase/client.ts` — browser client (used in Client Components)
- `lib/supabase/server.ts` — two exports:
  - `createServerClient()` — uses anon key, for authenticated server routes
  - `createServiceClient()` — uses service role key, bypasses RLS (used in public proposal pages and API routes that write on behalf of unauthenticated users)

### External Client Initialization
All external clients (Stripe, Anthropic, Resend) use **lazy initialization** — they're created inside functions, not at module level. This is required for the build to succeed without env vars present. Pattern:
```typescript
function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!, ...) }
```

### Data Types
`lib/supabase/types.ts` contains hand-written DB types. Supabase's TypeScript generic inference doesn't fully work with these (`.update()` resolves to `never`). Pattern for all DB writes:
```typescript
// eslint-disable-next-line
await (supabase.from("proposals") as any).update({...}).eq("id", id);
```
Reads use `as Proposal | null` cast after the query.

### Proposal Status Flow
`draft → sent → viewed → signed → paid`
- `draft`: just created, not yet shared
- `sent`: creator has copied/shared the link  
- `viewed`: client opened the URL (tracked via fire-and-forget POST to `/api/proposals/[id]/view`)
- `signed`: client drew and submitted signature (canvas PNG stored as base64 in `signature_data`)
- `paid`: Stripe `checkout.session.completed` webhook confirmed

### AI Generation
`lib/anthropic.ts` — calls `claude-opus-4-7` with a cached system prompt. Returns a `ProposalContent` JSON object with 9 sections. Prompt caching via `anthropic.beta.promptCaching.messages.create()`. The `ProposalContent` type in `lib/supabase/types.ts` defines the required sections.

### PDF Generation
`lib/pdf.tsx` — React component tree rendered to PDF bytes using `@react-pdf/renderer`. The file is `.tsx` because it contains JSX (react-pdf's `<Document>`, `<Page>`, `<Text>`, `<View>`, `<Image>` components). Listed in `next.config.mjs` as `serverComponentsExternalPackages`.

### Email (Resend)
Update the `FROM` constant in `lib/email.ts` with your verified Resend sender domain. Four functions: viewed, signed, payment received (to creator), confirmation with PDF link (to client).

## Database

Run `supabase/migrations/001_initial.sql` in your Supabase SQL editor.

Key schema notes:
- `profiles` auto-created from `auth.users` via trigger on signup
- `proposals.content` is `JSONB` — stores the full `ProposalContent` object
- `proposals.signature_data` stores base64 PNG from the canvas
- RLS allows owners to CRUD their own proposals; public proposal pages use service role (bypasses RLS)

## Stripe Setup

1. Create a webhook in Stripe Dashboard pointing to `https://yourdomain.com/api/stripe/webhook`
2. Listen for `checkout.session.completed`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
4. Test locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Netlify Deployment

Deploy via `@netlify/plugin-nextjs` (configured in `netlify.toml`). Set all env vars in Netlify dashboard under Site Settings → Environment Variables. `NEXT_PUBLIC_APP_URL` must be your production Netlify URL.
