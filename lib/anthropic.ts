import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProposalContent } from "@/lib/supabase/types";

function getGemini() {
  return new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
}

const SYSTEM_PROMPT = `You are an expert business proposal writer. Given a project description and client details, you will generate a professional, compelling proposal in JSON format.

Your output must be ONLY valid JSON — no markdown fences, no explanation, no other text.

The JSON must match this exact structure:
{
  "executiveSummary": "string — a compelling 2-3 paragraph overview of the engagement, the client's need, and the outcome you'll deliver",
  "problemStatement": "string — 1-2 paragraphs articulating the client's specific challenge or opportunity, showing deep understanding",
  "proposedSolution": "string — 2-3 paragraphs describing your recommended approach and methodology",
  "scopeOfWork": "string — a clear, bulleted breakdown of deliverables and what is/isn't included. Use markdown bullet points (- item)",
  "timeline": "string — a phased project timeline with milestones. Use markdown bullet points or numbered list",
  "investment": "string — a brief, confident framing of the investment (do NOT include the price — that is shown separately). Explain what they get for their investment and your payment terms",
  "whyUs": "string — 2-3 paragraphs on why you/your team are uniquely qualified for this engagement",
  "termsAndConditions": "string — clear, professional terms: IP ownership, revision rounds, kill fee, late payment policy, confidentiality",
  "nextSteps": "string — a warm, action-oriented closing paragraph with specific next steps to move forward"
}

Write in a confident, professional, yet personable tone. Mirror the client's industry language. Make the proposal feel custom-written for this specific client, not generic.`;

function buildMockContent(params: {
  title: string;
  clientName: string;
  amount: number;
  description: string;
}): ProposalContent {
  return {
    executiveSummary: `We are excited to present this proposal to ${params.clientName} for "${params.title}". This engagement represents a meaningful opportunity to create lasting impact for your business.\n\n${params.description}\n\nOur team is uniquely positioned to deliver this work on time, on budget, and to a standard that exceeds expectations.`,
    problemStatement: `${params.clientName} is at an inflection point. The challenges described in our discovery conversations are real, urgent, and — if left unaddressed — will compound over time.\n\nThe good news: these are well-understood problems with proven solutions. We've navigated this territory before and know exactly where the leverage is.`,
    proposedSolution: `Our proposed approach is straightforward and low-risk. We begin with a focused discovery phase to validate assumptions, then move into execution with weekly check-ins and clear milestones at every stage.\n\nWe don't believe in big-bang deliveries. You'll see progress weekly, have input throughout, and never be surprised by what lands in your inbox.`,
    scopeOfWork: `- Discovery and requirements gathering\n- Solution design and architecture\n- Core implementation and development\n- Quality assurance and testing\n- Delivery, handover, and documentation\n- 30-day post-launch support\n\n**Not included:** Out-of-scope change requests, third-party licensing fees, ongoing maintenance beyond the support window.`,
    timeline: `- **Week 1–2:** Discovery and scoping\n- **Week 3–4:** Design and planning\n- **Week 5–8:** Core delivery\n- **Week 9:** QA and revisions\n- **Week 10:** Launch and handover\n\nTotal: 10 weeks from signed agreement to delivery.`,
    investment: `This engagement is structured as a fixed-fee project — no surprises, no scope creep billing. The investment covers our full team's time from kick-off through the 30-day support window.\n\n**Payment terms:** 50% due at project kick-off, 50% upon delivery. We accept bank transfer, ACH, or credit card.`,
    whyUs: `We've done this work many times for companies at similar stages. Our track record speaks for itself: projects delivered on time, clients who come back, and results that are measurable.\n\nWhat makes us different is our commitment to clarity. You'll always know what's happening, what's next, and why. We treat your budget like our own.`,
    termsAndConditions: `- **IP ownership:** All deliverables transfer to ${params.clientName} upon final payment.\n- **Revisions:** Two rounds of revisions included per milestone. Additional rounds at $150/hour.\n- **Kill fee:** 25% of remaining balance if project is cancelled after kick-off.\n- **Confidentiality:** Both parties agree to keep project details confidential for 24 months.\n- **Late payment:** Invoices unpaid after 14 days accrue 1.5% monthly interest.\n- **Governing law:** Disputes governed by applicable local law.`,
    nextSteps: `If this proposal reflects what you're looking for, the next step is to sign below. We'll follow up within 24 hours with the project agreement and kick-off call scheduling. We're excited to get started and look forward to building something great together.`,
  };
}

export async function generateProposalContent(params: {
  description: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  title: string;
}): Promise<ProposalContent> {
  if (process.env.MOCK_AI === "true") {
    await new Promise((r) => setTimeout(r, 1500));
    return buildMockContent(params);
  }

  const userMessage = `Generate a proposal for the following engagement:

Client Name: ${params.clientName}
Client Email: ${params.clientEmail}
Project Title: ${params.title}
Investment Amount: $${params.amount.toLocaleString()}

Project Description:
${params.description}`;

  // Netlify kills functions after ~10s, so only fast non-"thinking" lite models fit (~6s).
  // "-latest" alias tracks Google's current model, so retirements don't break generation.
  const MODELS = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite"];
  const deadline = Date.now() + 8500;

  let text: string = "";
  let quotaHit = false;
  let timedOut = false;

  for (const modelName of MODELS) {
    const remaining = deadline - Date.now();
    if (remaining < 3000) break;
    try {
      const model = getGemini().getGenerativeModel(
        {
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: { responseMimeType: "application/json" },
        },
        { timeout: remaining }
      );
      const result = await model.generateContent(userMessage);
      text = result.response.text();
      break;
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      console.error(`[Gemini ${modelName}] error:`, err instanceof Error ? err.message : err);

      if (msg.includes("api_key") || msg.includes("api key") || msg.includes("403") || msg.includes("permission_denied")) {
        throw new Error("Invalid Google AI API key. Check GOOGLE_AI_API_KEY in your environment variables.");
      }

      if (msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("429") || msg.includes("rate limit") || msg.includes("too many")) {
        quotaHit = true;
      }

      if (msg.includes("abort") || msg.includes("timeout") || msg.includes("timed out")) {
        timedOut = true;
      }

      // 404 = model not available for this key — skip silently
      // All other errors — try next model
    }
  }

  if (!text?.trim()) {
    throw new Error(
      quotaHit
        ? "Your Google AI free-tier quota is exhausted for today. It resets at midnight Pacific time. Check your usage at aistudio.google.com."
        : timedOut
        ? "The AI took too long to respond. Please try again — shorter descriptions generate faster."
        : "AI generation failed. Please try again in a moment."
    );
  }

  if (!text?.trim()) {
    throw new Error("AI returned an empty response. Please try again.");
  }

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned) as ProposalContent;
  } catch {
    throw new Error("AI returned an unexpected format. Please try again.");
  }
}
