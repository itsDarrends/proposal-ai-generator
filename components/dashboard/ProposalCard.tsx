"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { formatCurrency, formatDate, isExpired } from "@/lib/utils";
import type { Database, ProposalStatus } from "@/lib/supabase/types";
import { Copy, ExternalLink, Check, Clock, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

const STATUS_ORDER: ProposalStatus[] = ["draft", "sent", "viewed", "signed", "paid"];

const PIPELINE_COLORS: Record<ProposalStatus, string> = {
  draft:  "bg-slate-300",
  sent:   "bg-blue-400",
  viewed: "bg-amber-400",
  signed: "bg-violet-500",
  paid:   "bg-emerald-500",
};

const LEFT_ACCENT: Record<ProposalStatus, string> = {
  draft:  "border-l-slate-300",
  sent:   "border-l-blue-400",
  viewed: "border-l-amber-400",
  signed: "border-l-violet-500",
  paid:   "border-l-emerald-500",
};

const AVATAR_GRADIENT: Record<ProposalStatus, string> = {
  draft:  "from-slate-400 to-slate-500",
  sent:   "from-blue-500 to-indigo-600",
  viewed: "from-amber-400 to-orange-500",
  signed: "from-violet-500 to-purple-600",
  paid:   "from-emerald-500 to-teal-600",
};

function ClientAvatar({ name, status }: { name: string; status: ProposalStatus }) {
  const parts = name.trim().split(" ");
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : name.slice(0, 2);
  return (
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENT[status]} flex items-center justify-center text-white text-sm font-bold shrink-0 select-none shadow-sm`}>
      {letters.toUpperCase()}
    </div>
  );
}

function Pipeline({ status, expiresAt }: { status: ProposalStatus; expiresAt: string | null }) {
  const expired = isExpired(expiresAt) && status !== "signed" && status !== "paid";
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div className="flex items-center gap-1.5">
      {STATUS_ORDER.map((s, i) => {
        const active = i <= currentIdx;
        const isLast = i === STATUS_ORDER.length - 1;
        return (
          <div
            key={s}
            className={`h-1 rounded-full transition-all duration-300 ${active ? PIPELINE_COLORS[status] : "bg-slate-100"} ${isLast ? "flex-[2]" : "flex-1"}`}
          />
        );
      })}
      {expired && (
        <span className="ml-2 text-[11px] text-red-500 font-semibold tracking-wide uppercase">
          Expired
        </span>
      )}
    </div>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  appUrl: string;
}

export function ProposalCard({ proposal, appUrl }: ProposalCardProps) {
  const [copied, setCopied] = useState(false);
  const proposalUrl = `${appUrl}/proposal/${proposal.id}`;
  const expired = isExpired(proposal.expires_at) &&
    proposal.status !== "signed" && proposal.status !== "paid";

  async function copyLink() {
    await navigator.clipboard.writeText(proposalUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`bg-white rounded-2xl border border-l-[3px] border-slate-100 ${LEFT_ACCENT[proposal.status]} shadow-sm hover:shadow-md transition-all duration-200 group`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <ClientAvatar name={proposal.client_name} status={proposal.status} />

          <div className="flex-1 min-w-0">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4 mb-0.5">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate text-[15px] leading-snug">
                  {proposal.title}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5 truncate">
                  {proposal.client_name}
                  <span className="mx-2 text-slate-200">·</span>
                  <span className="text-slate-400">{proposal.client_email}</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xl font-bold text-slate-900 tabular-nums">
                  {formatCurrency(proposal.amount)}
                </span>
                <StatusBadge status={proposal.status} expiresAt={proposal.expires_at} />
              </div>
            </div>

            {/* Pipeline progress */}
            <div className="mt-4 mb-3">
              <Pipeline status={proposal.status} expiresAt={proposal.expires_at} />
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {formatDate(proposal.created_at)}
                </span>
                {proposal.expires_at && !expired && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    Expires {formatDate(proposal.expires_at)}
                  </span>
                )}
                {proposal.signed_at && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-violet-600 font-medium">
                    Signed {formatDate(proposal.signed_at)}
                  </span>
                )}
                {proposal.paid_at && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <DollarSign className="w-3 h-3" />
                    Paid {formatDate(proposal.paid_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyLink}
                  className="h-7 px-2.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-1">{copied ? "Copied" : "Copy link"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                  asChild
                >
                  <a href={proposalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
