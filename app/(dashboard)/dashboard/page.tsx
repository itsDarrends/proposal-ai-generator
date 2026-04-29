import { createServerClient } from "@/lib/supabase/server";
import { ProposalCard } from "@/components/dashboard/ProposalCard";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, FileText } from "lucide-react";
import type { Database } from "@/lib/supabase/types";
import { isExpired } from "@/lib/utils";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawProposals } = await supabase
    .from("proposals")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const proposals = (rawProposals ?? []) as Proposal[];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const totalRevenue = proposals
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const awaitingAction = proposals.filter((p) =>
    ["sent", "viewed", "signed"].includes(p.status)
  ).length;

  const paid = proposals.filter((p) => p.status === "paid").length;

  const sentOrBeyond = proposals.filter((p) =>
    ["sent", "viewed", "signed", "paid"].includes(p.status)
  ).length;

  const winRate = sentOrBeyond > 0 ? Math.round((paid / sentOrBeyond) * 100) : 0;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Proposals</h1>
          <p className="text-sm text-slate-500 mt-1">
            {proposals.length === 0
              ? "No proposals yet — create your first one"
              : `${proposals.length} total · ${paid} paid · ${awaitingAction} awaiting action`}
          </p>
        </div>
        <Button asChild size="default" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200">
          <Link href="/proposals/new">
            <Sparkles className="w-4 h-4" />
            New Proposal
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <StatsBar
        totalRevenue={totalRevenue}
        totalProposals={proposals.length}
        awaitingAction={awaitingAction}
        winRate={winRate}
      />

      {/* Proposal list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
            Recent Proposals
          </h2>
          {proposals.length > 0 && (
            <span className="text-xs text-slate-400">{proposals.length} proposals</span>
          )}
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No proposals yet</h3>
            <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
              Describe your project in a few sentences and Claude will write a full proposal in seconds.
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="/proposals/new">
                <Sparkles className="w-4 h-4" />
                Generate your first proposal
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                appUrl={appUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
