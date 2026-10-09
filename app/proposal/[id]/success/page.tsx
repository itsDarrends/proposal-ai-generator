import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { SuccessAnimation } from "@/components/proposal/SuccessAnimation";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;
  const supabase = await createServiceClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) {
    notFound();
  }

  // Only show the success screen for a proposal that is actually paid. The Stripe
  // webhook can arrive a moment after the redirect, so when the database doesn't say
  // "paid" yet, ask Stripe whether this very session was paid for this proposal.
  let paid = proposal.status === "paid";
  if (!paid && sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === "paid" && session.metadata?.proposalId === id;
    } catch {
      paid = false;
    }
  }

  if (!paid) {
    redirect(`/proposal/${id}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <SuccessAnimation
      clientName={proposal.client_name}
      proposalTitle={proposal.title}
      amount={proposal.amount}
      pdfUrl={`${appUrl}/api/proposals/${id}/pdf`}
    />
  );
}
