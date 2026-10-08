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
      <div className="mt-10 rounded-lg bg-emerald-50 border border-emerald-200 p-10 text-center relative overflow-hidden group">
        <div className="w-16 h-16 bg-emerald-900/50 rounded-lg flex items-center justify-center mx-auto mb-6 border border-emerald-200 relative z-10">
          <CheckCircle2 className="w-8 h-8 text-emerald-700" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3 relative z-10">Proposal Complete</h3>
        <p className="text-emerald-800/70 text-[15px] mb-8 relative z-10 max-w-md mx-auto">
          This proposal has been signed and payment has been received. We are thrilled to start working with you!
        </p>
        <div className="relative z-10">
          <Button asChild variant="outline" className="bg-slate-50 border-emerald-200 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-100 h-12 px-6 rounded-xl transition-all">
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
