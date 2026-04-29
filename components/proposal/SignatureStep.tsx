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
    <div className="bg-white border border-gray-200 rounded-xl p-6 mt-10">
      <div className="flex items-center gap-2 mb-4">
        <PenLine className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Sign This Proposal</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        By signing below, you agree to the terms and conditions outlined in this proposal.
      </p>

      <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50 mb-3 relative">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: "w-full",
            height: 180,
            style: { touchAction: "none" },
          }}
          onEnd={() => setIsEmpty(false)}
          penColor="#1a1a1a"
          backgroundColor="rgba(249,250,251,0)"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm">Draw your signature here</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={clear} disabled={isEmpty || loading}>
          <RotateCcw className="w-4 h-4" />
          Clear
        </Button>
        <Button onClick={submit} disabled={isEmpty || loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Sign & Continue to Payment"
          )}
        </Button>
      </div>
    </div>
  );
}
