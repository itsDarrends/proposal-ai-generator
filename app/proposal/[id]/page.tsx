import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { isExpired } from "@/lib/utils";
import { ProposalContent } from "@/components/proposal/ProposalContent";
import { ProposalClientShell } from "@/components/proposal/ProposalClientShell";
import { Clock } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProposalPage({ params }: Props) {
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

  // Track view count on every visit (fire and forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  fetch(`${appUrl}/api/proposals/${id}/view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});

  // Fetch creator branding
  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("company_name, company_logo_url, brand_color")
    .eq("id", proposal.user_id)
    .single();
  const profile = rawProfile as { company_name: string | null; company_logo_url: string | null; brand_color: string | null } | null;

  const expired = isExpired(proposal.expires_at) &&
    proposal.status !== "signed" &&
    proposal.status !== "paid";

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 relative overflow-hidden">
        <div className="text-center max-w-md bg-slate-50 border border-slate-200 p-8 rounded-lg shadow-sm relative z-10">
          <div className="w-16 h-16 rounded-lg bg-slate-50 flex items-center justify-center mx-auto mb-6 border border-slate-200">
            <Clock className="w-8 h-8 text-indigo-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Proposal has expired</h1>
          <p className="text-slate-600 leading-relaxed">
            This proposal is no longer accepting signatures. Please contact us to receive an updated version.
          </p>
        </div>
      </div>
    );
  }

  const mockPayment = process.env.MOCK_PAYMENT === "true";

  return (
    <div className="min-h-screen bg-white text-slate-700 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background ambient lighting */}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <ProposalContent
          content={proposal.content}
          title={proposal.title}
          clientName={proposal.client_name}
          amount={proposal.amount}
          createdAt={proposal.created_at}
          expiresAt={proposal.expires_at}
          companyName={profile?.company_name ?? null}
          companyLogoUrl={profile?.company_logo_url ?? null}
          brandColor={profile?.brand_color ?? null}
        />

        <div className="mt-12">
          <ProposalClientShell
            proposalId={proposal.id}
            status={proposal.status}
            amount={proposal.amount}
            appUrl={appUrl}
            mockPayment={mockPayment}
          />
        </div>
      </div>
    </div>
  );
}
