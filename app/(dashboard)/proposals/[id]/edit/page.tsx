import { redirect, notFound } from "next/navigation";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { ProposalEditForm } from "@/components/dashboard/ProposalEditForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProposalPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = await createServiceClient();
  const { data: proposal } = await service
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!proposal) notFound();

  if (proposal.status !== "draft" && proposal.status !== "sent") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <a href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          ← Back to dashboard
        </a>
        <h1 className="text-2xl font-bold text-slate-900 mt-3">Edit Proposal</h1>
        <p className="text-slate-500 mt-1 text-sm">{proposal.title} · {proposal.client_name}</p>
      </div>
      <ProposalEditForm proposal={proposal} />
    </div>
  );
}
