import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPaymentReceivedEmail, sendClientConfirmationEmail } from "@/lib/email";
import type Stripe from "stripe";
import type { Database } from "@/lib/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const proposalId = session.metadata?.proposalId;

    if (!proposalId) return NextResponse.json({ ok: true });

    const supabase = await createServiceClient();

    const { data: rawProposal } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    const proposal = rawProposal as Proposal | null;

    if (!proposal || proposal.status === "paid") {
      return NextResponse.json({ ok: true });
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
  }

  return NextResponse.json({ ok: true });
}
