import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

interface Params {
  params: Promise<{ id: string }>;
}

function getGemini() {
  return new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: raw } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const proposal = raw as Proposal | null;
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const proposalUrl = `${appUrl}/proposal/${id}`;

  const prompt = `Write a short, warm, non-pushy follow-up email from a freelancer/agency to a client who has viewed but not yet signed a proposal.

Proposal title: "${proposal.title}"
Client name: ${proposal.client_name}
Investment amount: $${Number(proposal.amount).toLocaleString()}
Days since viewed: ${proposal.viewed_at ? Math.floor((Date.now() - new Date(proposal.viewed_at).getTime()) / 86400000) : 1}

Write ONLY the email body (no subject line, no "Dear X" header — start from the first sentence).
Keep it under 100 words. Mention the proposal title naturally. End with a soft call to action.
Do not use generic phrases like "I hope this email finds you well."
Sound human, specific, and confident — not desperate.`;

  try {
    const model = getGemini().getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const emailBody = result.response.text().trim();

    return NextResponse.json({
      subject: `Following up — ${proposal.title}`,
      body: emailBody,
      proposalUrl,
      clientEmail: proposal.client_email,
      clientName: proposal.client_name,
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate follow-up" }, { status: 500 });
  }
}
