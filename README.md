# ProposalAI – AI-Powered Proposal Generator

Generate professional business proposals in seconds using Google Gemini AI. Built with Next.js 14, Supabase, and Stripe for payments.

## 🎯 Features

- **AI-Generated Proposals** — Powered by Google Gemini API
- **Template System** — Pre-built proposal templates
- **Payment Integration** — Stripe checkout
- **Email Delivery** — Auto-send via Resend
- **PDF Export** — Download generated proposals
- **User Authentication** — Secure Supabase auth
- **Real-time Preview** — Edit and preview before sending

## 🛠️ Tech Stack

```
Frontend: Next.js 14 | React 18 | TypeScript
Backend: Supabase | Google Gemini API
Payments: Stripe
Email: Resend
Styling: Tailwind CSS | Shadcn/UI
Deployment: Netlify
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Google Gemini API key
- Stripe account
- Resend email account

### Local Setup

```bash
# Clone repository
git clone https://github.com/itsDarrends/proposal-ai-generator.git
cd proposal-ai-generator

# Install dependencies
npm install

# Configure environment
cat > .env.local << EOL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GOOGLE_GEMINI_API_KEY=your_gemini_key
STRIPE_PUBLIC_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
RESEND_API_KEY=your_resend_key
EOL

# Run development server
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📊 Workflow

1. **User logs in** via Supabase auth
2. **Fills proposal details** (client info, services, terms)
3. **AI generates draft** using Gemini
4. **Reviews and edits** in real-time
5. **Proceeds to payment** via Stripe
6. **Proposal sent** via Resend email
7. **PDF saved** to Supabase storage

## 💳 Payment Flow

- Stripe checkout for premium features
- Per-proposal pricing model
- Webhook handling for payment confirmation
- Invoice generation and storage

## 🔐 Security

- **Supabase Auth:** Row-level security
- **API Keys:** Stored securely in env
- **Stripe Security:** PCI-DSS compliant
- **Email Verification:** Resend auth

## 🌐 Deployment

### Netlify

```bash
# Connect repo to Netlify
# Set environment variables in Netlify dashboard
# Auto-deploy on push to main
```

## 📝 License

MIT License

## 💬 Contact

[itsdarrendsilva@gmail.com](mailto:itsdarrendsilva@gmail.com)

---

*Generate proposals, close deals faster* 📄✨
