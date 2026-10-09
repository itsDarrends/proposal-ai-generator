import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPaymentReceivedEmail, sendClientConfirmationEmail } from "@/lib/email";
import { settleWithin } from "@/lib/async";
import { isMockPaymentEnabled } from "@/lib/mock-payment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isMockPaymentEnabled()) {
    return NextResponse.json({ error: "Mock payment not enabled" }, { status: 403 });
  }

  try {
    const { proposalId } = await request.json();
    if (!proposalId || typeof proposalId !== "string") {
      return NextResponse.json({ error: "proposalId required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: proposal } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Same rule as real checkout: only a signed proposal can be paid, and only once.
    const { data: paid, error } = await supabase
      .from("proposals")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .eq("status", "signed")
      .select("id");

    if (error) {
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }
    if (!paid?.length) {
      return NextResponse.json({ error: "Proposal must be signed before payment" }, { status: 409 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const pdfUrl = `${appUrl}/api/proposals/${proposalId}/pdf`;

    const { data: creator } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", proposal.user_id)
      .single();

    await settleWithin([
      ...(creator?.email
        ? [
            sendPaymentReceivedEmail({
              creatorEmail: creator.email,
              clientName: proposal.client_name,
              proposalTitle: proposal.title,
              amount: proposal.amount,
            }),
          ]
        : []),
      sendClientConfirmationEmail({
        clientEmail: proposal.client_email,
        clientName: proposal.client_name,
        proposalTitle: proposal.title,
        amount: proposal.amount,
        pdfUrl,
      }),
    ]);

    return NextResponse.json({
      redirectUrl: `${appUrl}/proposal/${proposalId}/success`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
