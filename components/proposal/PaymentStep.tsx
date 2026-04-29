"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, CreditCard, Download, CheckCircle, FlaskConical } from "lucide-react";

interface PaymentStepProps {
  proposalId: string;
  amount: number;
  pdfUrl: string;
  mockPayment?: boolean;
}

export function PaymentStep({ proposalId, amount, pdfUrl, mockPayment }: PaymentStepProps) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);

    try {
      if (mockPayment) {
        const res = await fetch("/api/stripe/mock-pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Mock payment failed");
        window.location.href = data.redirectUrl;
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Proposal Signed!</h3>
        {mockPayment && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
            <FlaskConical className="w-3 h-3" />
            Test mode
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Your signature has been recorded. Complete your payment of{" "}
        <strong className="text-gray-900">{formatCurrency(amount)}</strong> to confirm the engagement.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handlePayment} disabled={loading} size="lg" className="flex-1">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {mockPayment ? "Simulating payment..." : "Redirecting to payment..."}
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              {mockPayment ? `Simulate Payment of ${formatCurrency(amount)}` : `Pay ${formatCurrency(amount)}`}
            </>
          )}
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Download className="w-4 h-4" />
            Download Signed PDF
          </a>
        </Button>
      </div>
    </div>
  );
}
