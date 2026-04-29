import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPaymentReceivedEmail, sendClientConfirmationEmail } from "@/lib/email";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

export async function POST(request: Request) {
  if (process.env.MOCK_PAYMENT !== "true") {
    return NextResponse.json({ error: "Mock payment not enabled" }, { status: 403 });
  }

  try {
    const { proposalId } = await request.json();
    if (!proposalId) {
      return NextResponse.json({ error: "proposalId required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: rawProposal } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    const proposal = rawProposal as Proposal | null;
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // eslint-disable-next-line
    await (supabase.from("proposals") as any)
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const pdfUrl = `${appUrl}/api/proposals/${proposalId}/pdf`;

    const { data: rawCreator } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", proposal.user_id)
      .single();

    const creatorEmail = (rawCreator as { email: string } | null)?.email;
    if (creatorEmail) {
      await sendPaymentReceivedEmail({
        creatorEmail,
        clientName: proposal.client_name,
        proposalTitle: proposal.title,
        amount: proposal.amount,
      }).catch(console.error);
    }

    await sendClientConfirmationEmail({
      clientEmail: proposal.client_email,
      clientName: proposal.client_name,
      proposalTitle: proposal.title,
      amount: proposal.amount,
      pdfUrl,
    }).catch(console.error);

    return NextResponse.json({
      redirectUrl: `${appUrl}/proposal/${proposalId}/success`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
