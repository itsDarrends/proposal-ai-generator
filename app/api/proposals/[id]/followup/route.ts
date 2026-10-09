import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateFollowUpEmail } from "@/lib/gemini";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const proposalUrl = `${appUrl}/proposal/${id}`;

  try {
    const body = await generateFollowUpEmail({
      title: proposal.title,
      clientName: proposal.client_name,
      amount: proposal.amount,
      daysSinceViewed: proposal.viewed_at
        ? Math.floor((Date.now() - new Date(proposal.viewed_at).getTime()) / 86400000)
        : 1,
    });

    return NextResponse.json({
      subject: `Following up — ${proposal.title}`,
      body,
      proposalUrl,
      clientEmail: proposal.client_email,
      clientName: proposal.client_name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate follow-up";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
