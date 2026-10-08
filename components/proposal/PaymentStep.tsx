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
    <div className="bg-emerald-950/20 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 mt-10 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Proposal Signed!</h3>
          {mockPayment && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1 font-medium tracking-wide">
              <FlaskConical className="w-3 h-3" />
              Test mode
            </span>
          )}
        </div>
        <p className="text-[15px] text-emerald-200/70 mb-8 leading-relaxed">
          Your signature has been securely recorded. To officially confirm the engagement, please complete your payment of{" "}
          <strong className="text-white font-bold">{formatCurrency(amount)}</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handlePayment} disabled={loading} size="lg" className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_30px_-5px_rgb(16,185,129,0.4)] border border-emerald-400/20 transition-all hover:shadow-[0_0_40px_-5px_rgb(16,185,129,0.6)] hover:-translate-y-0.5">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {mockPayment ? "Simulating..." : "Redirecting..."}
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                {mockPayment ? `Simulate Payment (${formatCurrency(amount)})` : `Pay ${formatCurrency(amount)}`}
              </>
            )}
          </Button>
          <Button variant="outline" size="lg" asChild className="h-12 rounded-xl bg-white/5 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-100 transition-colors">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Signed PDF
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
