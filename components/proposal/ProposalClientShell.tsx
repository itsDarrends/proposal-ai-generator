"use client";

import { useState } from "react";
import type { ProposalStatus } from "@/lib/supabase/types";
import { SignatureStep } from "./SignatureStep";
import { PaymentStep } from "./PaymentStep";

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
    return null;
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
