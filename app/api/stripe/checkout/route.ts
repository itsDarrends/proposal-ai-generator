import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

export async function POST(request: Request) {
  const { proposalId } = await request.json();

  if (!proposalId || typeof proposalId !== "string") {
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

  // Must be signed before payment is allowed
  if (proposal.status !== "signed") {
    return NextResponse.json({ error: "Proposal must be signed before payment" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

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

  // eslint-disable-next-line
  await (supabase.from("proposals") as any)
    .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
    .eq("id", proposalId);

  return NextResponse.json({ url: session.url });
}
