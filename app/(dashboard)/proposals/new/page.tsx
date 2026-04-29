"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft, User, Mail, DollarSign, Clock, FileText } from "lucide-react";
import Link from "next/link";

export default function NewProposalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    clientName: "",
    clientEmail: "",
    description: "",
    amount: "",
    expiryDays: "30",
  });

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          description: form.description,
          amount: parseFloat(form.amount),
          expiryDays: parseInt(form.expiryDays),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate proposal");
      }

      toast.success("Proposal generated! Copy the link to share with your client.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </Link>
      </div>

      {/* Header card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">New Proposal</h1>
            <p className="text-indigo-200 text-sm mt-0.5">
              Claude will generate a complete, professional proposal from your description.
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSubmit}>
          {/* Section: Proposal details */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Proposal Details</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Proposal Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Website Redesign for Acme Corp"
                  value={form.title}
                  onChange={update("title")}
                  required
                  className="h-10 border-slate-200 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Client info */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Client Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-sm font-medium text-slate-700">
                  Client Name
                </Label>
                <Input
                  id="clientName"
                  placeholder="Jane Smith"
                  value={form.clientName}
                  onChange={update("clientName")}
                  required
                  className="h-10 border-slate-200 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientEmail" className="text-sm font-medium text-slate-700">
                  Client Email
                </Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="jane@company.com"
                  value={form.clientEmail}
                  onChange={update("clientEmail")}
                  required
                  className="h-10 border-slate-200 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Project description */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Project Description</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Describe the project{" "}
                <span className="text-slate-400 font-normal">(1–3 paragraphs)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the client's challenge, the work you'll do, the outcomes they can expect, and any relevant context about the engagement..."
                value={form.description}
                onChange={update("description")}
                required
                rows={7}
                className="border-slate-200 focus-visible:ring-indigo-500 resize-none text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* Section: Terms */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Investment & Timeline</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                  Amount (USD)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="5,000"
                    value={form.amount}
                    onChange={update("amount")}
                    required
                    className="h-10 pl-7 border-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiryDays" className="text-sm font-medium text-slate-700">
                  Expires in (days)
                </Label>
                <div className="relative">
                  <Input
                    id="expiryDays"
                    type="number"
                    min="1"
                    max="365"
                    placeholder="30"
                    value={form.expiryDays}
                    onChange={update("expiryDays")}
                    required
                    className="h-10 pr-12 border-slate-200 focus-visible:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="p-6">
            <Button
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm shadow-indigo-200 text-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Claude is writing your proposal...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Proposal with AI
                </>
              )}
            </Button>
            <p className="text-center text-xs text-slate-400 mt-3">
              Generation typically takes 10–30 seconds
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
