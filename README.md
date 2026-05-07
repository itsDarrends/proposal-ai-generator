# ProposalAI

An AI-powered proposal generation platform. Describe your project in plain text and Gemini writes a full, professional proposal — complete with digital signature, Stripe payment, and PDF download.

## Features

- **AI generation** — Gemini writes a structured 9-section proposal from a short description
- **Public proposal URL** — shareable link with no login required for the client
- **Canvas signature** — client signs directly in the browser
- **Stripe Checkout** — one-time payment collected immediately after signing
- **PDF download** — signed proposal rendered to PDF via `@react-pdf/renderer`
- **Status tracking** — `draft → sent → viewed → signed → paid` pipeline on the dashboard
- **Email notifications** — creator notified on view, sign, and payment via Resend
- **Proposal expiry** — configurable expiry date per proposal

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Auth + DB | Supabase (Auth + Postgres + RLS) |
| AI | Google Gemini via `@google/generative-ai` |
| Payments | Stripe Checkout |
| Email | Resend |
| PDF | `@react-pdf/renderer` |
| Signature | `react-signature-canvas` |
| Animations | Framer Motion + `canvas-confetti` |
| Styling | Tailwind CSS + shadcn/ui |
| Hosting | Netlify (`@netlify/plugin-nextjs`) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)
- A [Stripe](https://dashboard.stripe.com) account
- A [Resend](https://resend.com) account

### Installation

```bash
git clone https://github.com/itsDarrends/project-proposal-ai.git
cd project-proposal-ai
npm install
```

### Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_AI_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run the migration in your Supabase SQL editor:

```bash
# Copy and run the contents of:
supabase/migrations/001_initial.sql
```

This creates the `profiles` and `proposals` tables, RLS policies, and an auto-create profile trigger on signup.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local Development (Mock Modes)

To develop without spending API credits, add these to `.env.local`:

```env
MOCK_AI=true        # Returns a pre-written proposal instead of calling Gemini
MOCK_PAYMENT=true   # Simulates Stripe payment without the CLI or real card
MOCK_EMAIL=true     # Logs emails to console instead of sending via Resend
```

All three can be used independently or together.

## Stripe Webhook (Production)

1. In Stripe Dashboard, create a webhook pointing to `https://yourdomain.com/api/stripe/webhook`
2. Select the `checkout.session.completed` event
3. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

For local testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Deployment (Netlify)

The project includes a `netlify.toml` configured for `@netlify/plugin-nextjs`.

1. Push to GitHub
2. Connect the repo in Netlify
3. Set all environment variables under **Site Settings → Environment Variables**
4. Set `NEXT_PUBLIC_APP_URL` to your production Netlify URL
5. Deploy

## Project Structure

```
app/
├── (auth)/login/           # Email + password sign-in / sign-up
├── (dashboard)/            # Auth-guarded creator area
│   ├── dashboard/          # Proposal list + stats
│   └── proposals/new/      # AI generation form
├── proposal/[id]/          # Public client-facing proposal page
└── api/
    ├── proposals/generate/ # POST: call Gemini, save to DB
    ├── proposals/[id]/sign # POST: save canvas signature
    ├── proposals/[id]/view # POST: mark as viewed
    ├── proposals/[id]/pdf  # GET: stream PDF download
    └── stripe/
        ├── checkout/       # POST: create Stripe session
        └── webhook/        # POST: handle payment confirmation
```

## Scripts

```bash
node scripts/seed-proposal.mjs   # Create a demo proposal in the DB
node scripts/set-password.mjs    # Set password for an existing Supabase user
```

## License

MIT
