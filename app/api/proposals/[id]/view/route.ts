import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/server";
import { sendProposalViewedEmail } from "@/lib/email";
import type { Database } from "@/lib/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: rawProposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  const proposal = rawProposal as Proposal | null;

  if (!proposal || proposal.viewed_at) {
    return NextResponse.json({ ok: true });
  }

  // eslint-disable-next-line
  await (supabase.from("proposals") as any)
    .update({
      viewed_at: new Date().toISOString(),
      status: proposal.status === "sent" ? "viewed" : proposal.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  const { data: rawCreator } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", proposal.user_id)
    .single();

  const creatorEmail = (rawCreator as { email: string } | null)?.email;

  if (creatorEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendProposalViewedEmail({
      creatorEmail,
      clientName: proposal.client_name,
      proposalTitle: proposal.title,
      proposalUrl: `${appUrl}/proposal/${id}`,
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
