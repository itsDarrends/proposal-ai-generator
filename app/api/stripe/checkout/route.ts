import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  // Must be signed before payment is allowed
  if (proposal.status !== "signed") {
    return NextResponse.json({ error: "Proposal must be signed before payment" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Reuse the checkout session if the client already has one open (double-click,
  // back button, reopening the page) instead of creating a new one every time.
  if (proposal.stripe_checkout_session_id) {
    try {
      const existing = await getStripe().checkout.sessions.retrieve(proposal.stripe_checkout_session_id);
      if (existing.status === "open" && existing.url) {
        return NextResponse.json({ url: existing.url });
      }
    } catch {
      // Stale or unknown session id; fall through and create a fresh one.
    }
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: proposal.title,
            description: `Proposal for ${proposal.client_name}`,
          },
          unit_amount: Math.round(proposal.amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${appUrl}/proposal/${proposalId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/proposal/${proposalId}`,
    customer_email: proposal.client_email,
    metadata: {
      proposalId,
    },
  });

  await supabase
    .from("proposals")
    .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
    .eq("id", proposalId);

  if (!session.url) {
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
