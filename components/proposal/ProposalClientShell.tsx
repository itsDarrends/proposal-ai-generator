"use client";

import { useState } from "react";
import type { ProposalStatus } from "@/lib/supabase/types";
import { SignatureStep } from "./SignatureStep";
import { PaymentStep } from "./PaymentStep";
import { CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  proposalId: string;
  status: ProposalStatus;
  amount: number;
  appUrl: string;
  mockPayment?: boolean;
}

export function ProposalClientShell({ proposalId, status, amount, appUrl, mockPayment }: Props) {
  const [currentStatus, setCurrentStatus] = useState<ProposalStatus>(status);

  const pdfUrl = `${appUrl}/api/proposals/${proposalId}/pdf`;

  if (currentStatus === "paid") {
    return (
      <div className="mt-10 rounded-3xl bg-emerald-950/30 backdrop-blur-md border border-emerald-500/20 p-10 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="w-16 h-16 bg-emerald-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 relative z-10">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Proposal Complete</h3>
        <p className="text-emerald-200/70 text-[15px] mb-8 relative z-10 max-w-md mx-auto">
          This proposal has been signed and payment has been received. We are thrilled to start working with you!
        </p>
        <div className="relative z-10">
          <Button asChild variant="outline" className="bg-white/5 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-100 h-12 px-6 rounded-xl transition-all">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Download Signed Proposal
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (currentStatus === "signed") {
    return (
      <PaymentStep
        proposalId={proposalId}
        amount={amount}
        pdfUrl={pdfUrl}
        mockPayment={mockPayment}
      />
    );
  }

  return (
    <SignatureStep
      proposalId={proposalId}
      onSigned={() => setCurrentStatus("signed")}
    />
  );
}
