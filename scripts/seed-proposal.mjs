/**
 * Creates a dummy proposal in the DB using the service role key.
 * Run: node scripts/seed-proposal.mjs
 *
 * Prints the public proposal URL when done.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = join(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((p) => p.trim()))
    .filter(([k, v]) => k && v)
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const dummyContent = {
  executiveSummary:
    "We are thrilled to present this proposal to Acme Corp for a complete digital transformation of their customer-facing web platform. Over the past decade, Acme has built an exceptional product — but the digital experience hasn't kept pace with the brand's ambitions.\n\nThis engagement will deliver a fast, modern, beautifully designed web experience that converts visitors into customers and delights existing ones. Our team has executed similar transformations for companies at Acme's stage, and we know exactly where the leverage is.",

  problemStatement:
    "Acme's current website was built in 2018 and shows its age. Page load times average 6.2 seconds on mobile, the checkout flow has a 71% abandonment rate, and the design language doesn't reflect the premium positioning Acme has earned in the market.\n\nEvery month the current experience stays live, Acme is leaving measurable revenue on the table. The opportunity cost of inaction is not abstract — it compounds.",

  proposedSolution:
    "We will redesign and rebuild the Acme customer platform from the ground up using Next.js 14 and a modern component system. The result will be a sub-2-second load time on mobile, an intuitive checkout flow with 40%+ fewer steps, and a visual identity that commands the premium price point Acme deserves.\n\nOur approach is discovery-first: two weeks of user research and competitive analysis before a single pixel is designed. We build on what the data tells us, not assumptions.",

  scopeOfWork:
    "- Full UX audit and competitive analysis report\n- User research: 8 qualitative interviews + analytics review\n- Information architecture and site map\n- High-fidelity designs for all core pages (desktop + mobile)\n- Design system and component library\n- Development in Next.js 14 with TypeScript\n- Stripe checkout integration with optimized flow\n- CMS integration (Contentful) for marketing pages\n- Performance optimization (Lighthouse score ≥ 95)\n- QA across Chrome, Safari, Firefox, iOS, Android\n- 30-day post-launch support\n\n**Not included:** Backend API development, third-party integrations beyond Stripe/Contentful, SEO copywriting.",

  timeline:
    "- **Week 1–2:** Discovery, user research, competitive audit\n- **Week 3–4:** IA, wireframes, stakeholder review\n- **Week 5–7:** High-fidelity design, design system\n- **Week 8–11:** Development — core pages and checkout\n- **Week 12:** QA, performance testing, bug fixes\n- **Week 13:** Staging review + client sign-off\n- **Week 14:** Launch\n\nTotal: 14 weeks from project kick-off.",

  investment:
    "This engagement is priced as a fixed-fee project, giving you complete cost certainty. The investment covers our full team: strategy lead, UX designer, UI designer, two engineers, and a QA specialist.\n\n**Payment terms:** 40% due at project kick-off, 40% at design sign-off, 20% at launch. We accept ACH, wire, or credit card. Late payments beyond 15 days incur a 1.5% monthly fee.",

  whyUs:
    "We've executed 23 web platform rebuilds for B2B and B2C companies in the $5M–$50M ARR range. Our median client sees a 34% improvement in conversion rate within 90 days of launch.\n\nWhat sets us apart is our insistence on doing discovery right before touching Figma. Most agencies skip this and optimize the wrong things. We don't. Every design decision we make is traceable to a user insight or a business metric.\n\nWe're a small team by design — you'll work directly with the people doing the work, not account managers relaying messages.",

  termsAndConditions:
    "- **IP ownership:** Full ownership of all deliverables transfers to Acme Corp upon final payment.\n- **Revisions:** Three rounds of revisions included at each design milestone. Additional rounds billed at $180/hour.\n- **Kill fee:** If Acme cancels after discovery, a 25% kill fee applies to the remaining balance.\n- **Confidentiality:** Both parties agree to keep project details confidential for 24 months.\n- **Late payment:** Invoices unpaid after 15 days incur 1.5% monthly interest.\n- **Governing law:** This agreement is governed by the laws of Delaware.",

  nextSteps:
    "If this proposal reflects what you're looking for, the next step is simple: sign below and we'll send over the project agreement and first invoice within 24 hours. We're targeting a kick-off call the week of January 20th — our calendar is open and we'd love to hold that slot for Acme.\n\nQuestions? Reply to this email or book a 20-minute call at calendly.com/ouragency. We're excited about what we can build together.",
};

async function main() {
  console.log("Creating dummy proposal...");

  // We need a user_id. Let's create a dummy profile or find an existing one.
  // Try to find any existing user first.
  const { data: profiles } = await supabase.from("profiles").select("id, email").limit(1);

  let userId;

  if (profiles && profiles.length > 0) {
    userId = profiles[0].id;
    console.log(`Using existing user: ${profiles[0].email}`);
  } else {
    // Create a dummy user via admin API
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: "demo@example.com",
      email_confirm: true,
    });

    if (userError) {
      console.error("Failed to create user:", userError.message);
      console.log("\nNote: Run the Supabase migration first, then try again.");
      process.exit(1);
    }

    userId = newUser.user.id;
    console.log(`Created demo user: demo@example.com`);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      user_id: userId,
      title: "Website Redesign for Acme Corp",
      client_name: "Jane Smith",
      client_email: "jane@acmecorp.com",
      content: dummyContent,
      amount: 24000,
      status: "sent",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to insert proposal:", error.message);
    console.log("\nMake sure you've run the Supabase migration first.");
    process.exit(1);
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.log("\n✓ Dummy proposal created!");
  console.log(`\nProposal ID: ${proposal.id}`);
  console.log(`\nClient view URL:\n  ${appUrl}/proposal/${proposal.id}`);
  console.log(`\nDashboard URL:\n  ${appUrl}/dashboard`);
}

main().catch(console.error);
