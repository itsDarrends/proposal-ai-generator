import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { SuccessAnimation } from "@/components/proposal/SuccessAnimation";
import type { Database } from "@/lib/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SuccessPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: rawProposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  const proposal = rawProposal as Proposal | null;

  if (!proposal) {
    notFound();
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
