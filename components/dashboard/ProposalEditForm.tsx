"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import type { Database, ProposalContent } from "@/lib/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

const SECTIONS: { key: keyof ProposalContent; label: string; rows: number }[] = [
  { key: "executiveSummary",    label: "Executive Summary",    rows: 5 },
  { key: "problemStatement",    label: "The Challenge",        rows: 4 },
  { key: "proposedSolution",    label: "Our Proposed Solution",rows: 5 },
  { key: "scopeOfWork",         label: "Scope of Work",        rows: 6 },
  { key: "timeline",            label: "Timeline",             rows: 4 },
  { key: "investment",          label: "Investment Details",   rows: 4 },
  { key: "whyUs",               label: "Why Us",               rows: 4 },
  { key: "termsAndConditions",  label: "Terms & Conditions",   rows: 5 },
  { key: "nextSteps",           label: "Next Steps",           rows: 3 },
];

interface ProposalEditFormProps {
  proposal: Proposal;
}

export function ProposalEditForm({ proposal }: ProposalEditFormProps) {
  const router = useRouter();
  const [content, setContent] = useState<ProposalContent>({ ...proposal.content });
  const [saving, setSaving] = useState(false);

  function update(key: keyof ProposalContent, value: string) {
    setContent(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      toast.success("Proposal saved");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to save proposal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map(({ key, label, rows }) => (
        <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <label className="text-sm font-semibold text-slate-700">{label}</label>
          </div>
          <textarea
            value={content[key]}
            onChange={e => update(key, e.target.value)}
            rows={rows}
            className="w-full px-5 py-4 text-sm text-slate-700 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300 placeholder:text-slate-300"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        </div>
      ))}

      <div className="flex items-center justify-end gap-3 pt-2 pb-8">
        <Button variant="outline" onClick={() => router.push("/dashboard")} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
