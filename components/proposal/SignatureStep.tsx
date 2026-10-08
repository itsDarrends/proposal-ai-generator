"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RotateCcw, PenLine } from "lucide-react";

interface SignatureStepProps {
  proposalId: string;
  onSigned: () => void;
}

export function SignatureStep({ proposalId, onSigned }: SignatureStepProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [loading, setLoading] = useState(false);

  function clear() {
    sigRef.current?.clear();
    setIsEmpty(true);
  }

  async function submit() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature before submitting.");
      return;
    }

    setLoading(true);
    // Note: The signature image is black by default, we can invert it on the backend or keep it as is. 
    // In dark mode we use a light pen on a transparent background.
    const signatureData = sigRef.current.toDataURL("image/png");

    try {
      const res = await fetch(`/api/proposals/${proposalId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit signature");
      }

      onSigned();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mt-10 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <PenLine className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Sign This Proposal</h3>
        </div>
        <p className="text-[15px] text-slate-400 mb-6">
          By signing below, you agree to the terms and conditions outlined in this proposal.
        </p>

        <div className="border border-dashed border-white/20 rounded-2xl overflow-hidden bg-black/40 mb-5 relative group transition-colors hover:border-indigo-500/50">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{
              className: "w-full",
              height: 200,
              style: { touchAction: "none" },
            }}
            onEnd={() => setIsEmpty(false)}
            penColor="#ffffff"
            backgroundColor="rgba(0,0,0,0)"
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-500 text-[15px] font-medium tracking-wide">Draw your signature here</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={clear} disabled={isEmpty || loading} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl h-12 px-6">
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear Signature
          </Button>
          <Button onClick={submit} disabled={isEmpty || loading} size="lg" className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-[0_0_30px_-5px_rgb(79,70,229,0.5)] border border-indigo-400/20 transition-all hover:shadow-[0_0_40px_-5px_rgb(79,70,229,0.7)] hover:-translate-y-0.5">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Sign & Continue to Payment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
