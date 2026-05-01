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

  if (!proposal) {
    return NextResponse.json({ ok: true });
  }

  const updatePayload: Record<string, unknown> = {
    view_count: (proposal.view_count ?? 0) + 1,
    updated_at: new Date().toISOString(),
  };

  if (!proposal.viewed_at) {
    updatePayload.viewed_at = new Date().toISOString();
    updatePayload.status = proposal.status === "sent" ? "viewed" : proposal.status;
  }

  // eslint-disable-next-line
  await (supabase.from("proposals") as any)
    .update(updatePayload)
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
