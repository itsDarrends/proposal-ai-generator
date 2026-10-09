import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPaymentReceivedEmail, sendClientConfirmationEmail } from "@/lib/email";
import { settleWithin } from "@/lib/async";
import type Stripe from "stripe";

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

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const proposalId = session.metadata?.proposalId;
  if (!proposalId) return NextResponse.json({ ok: true });

  // "completed" can still mean an async payment that hasn't cleared yet.
  if (session.payment_status !== "paid") {
    console.warn(`[stripe webhook] session ${session.id} completed but payment_status=${session.payment_status}`);
    return NextResponse.json({ ok: true });
  }

  const supabase = await createServiceClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (!proposal) return NextResponse.json({ ok: true });

  // Never mark a proposal paid for the wrong amount. 200 (not an error) because a
  // mismatch won't fix itself on retry; it needs a human to look at it.
  const expectedCents = Math.round(Number(proposal.amount) * 100);
  if (session.amount_total !== expectedCents || session.currency !== "usd") {
    console.error(
      `[stripe webhook] amount mismatch for proposal ${proposalId}: ` +
        `got ${session.amount_total} ${session.currency}, expected ${expectedCents} usd (session ${session.id})`
    );
    return NextResponse.json({ ok: true });
  }

  // Conditional on still being "signed": Stripe retries and duplicate deliveries
  // can't double-process, and only the delivery that wins the update sends emails.
  const { data: updated, error } = await supabase
    .from("proposals")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId)
    .eq("status", "signed")
    .select("id");

  // A real database failure should make Stripe retry.
  if (error) return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });

  if (!updated?.length) return NextResponse.json({ ok: true });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const pdfUrl = `${appUrl}/api/proposals/${proposalId}/pdf`;

  const { data: creator } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", proposal.user_id)
    .single();

  // Emails run in parallel with a hard cap so a slow mail provider can't push the
  // handler past Stripe's timeout (which would trigger retries).
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

  return NextResponse.json({ ok: true });
}
