"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2, Sparkles, ArrowLeft, Zap, Link2, PenLine, CreditCard,
  FileText, User, Mail, DollarSign, Clock, AlignLeft
} from "lucide-react";
import Link from "next/link";

/* ─── feature chips ──────────────────────────────────────────── */
const CHIPS = [
  { icon: Zap,        label: "AI-generated in ~20s" },
  { icon: Link2,      label: "Shareable link"        },
  { icon: PenLine,    label: "E-signature"            },
  { icon: CreditCard, label: "Stripe payments"        },
];

/* ─── field ──────────────────────────────────────────────────── */
function Field({
  id, label, hint, children,
}: {
  id?: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-300">
        {label}
        {hint && <span className="ml-1.5 font-normal text-slate-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── clean input ────────────────────────────────────────────── */
const inputCls =
  "w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-[15px] font-medium text-white placeholder:text-slate-500 " +
  "hover:bg-white/10 hover:border-white/20 focus:bg-white/10 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm";

/* ─── proposal preview ───────────────────────────────────────── */
function ProposalPreview({
  title,
  clientName,
  clientEmail,
  amount,
}: {
  title: string;
  clientName: string;
  clientEmail: string;
  amount: string;
}) {
  const hasTitle   = title.trim().length > 0;
  const hasClient  = clientName.trim().length > 0;
  const hasEmail   = clientEmail.trim().length > 0;
  const hasAmount  = amount.trim().length > 0;

  const sections = [
    "Executive Summary",
    "The Challenge",
    "Proposed Solution",
    "Scope of Work",
    "Timeline",
    "Investment",
    "Why Us",
    "Terms",
    "Next Steps",
  ];

  return (
    <div className="bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* top bar */}
      <div className="px-5 py-3.5 bg-black/40 border-b border-white/5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-red-400/80 transition-colors" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-amber-400/80 transition-colors" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-emerald-400/80 transition-colors" />
        <span className="ml-3 text-[11px] text-slate-500 font-mono tracking-wide">preview.pdf</span>
      </div>

      {/* header */}
      <div className="px-6 pt-6 pb-5 border-b border-white/5 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-1">
              Business Proposal
            </p>
            <h2 className={`text-[18px] font-bold leading-snug transition-colors ${hasTitle ? "text-white" : "text-slate-600"}`}>
              {hasTitle ? title : "Proposal title will appear here"}
            </h2>
            <div className="mt-2 flex flex-col gap-0.5">
              <span className={`text-[12px] transition-colors ${hasClient ? "text-slate-400" : "text-slate-600"}`}>
                {hasClient ? `Prepared for ${clientName}` : "Prepared for — client name"}
              </span>
              <span className={`text-[11px] transition-colors ${hasEmail ? "text-slate-500" : "text-slate-700"}`}>
                {hasEmail ? clientEmail : "client@company.com"}
              </span>
            </div>
          </div>
          <div className={`shrink-0 text-right transition-colors ${hasAmount ? "text-white" : "text-slate-600"}`}>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Investment</p>
            <p className="text-[22px] font-bold tabular-nums leading-none">
              {hasAmount ? `$${Number(amount).toLocaleString()}` : "$0"}
            </p>
          </div>
        </div>
      </div>

      {/* sections skeleton */}
      <div className="px-6 py-5 space-y-4 relative z-10">
        {sections.map((s, i) => (
          <div key={s} className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-500">{s}</div>
            <div className="space-y-1.5">
              <div
                className="h-1.5 rounded-full bg-slate-800/50"
                style={{ width: `${85 - (i % 3) * 12}%` }}
              />
              <div
                className="h-1.5 rounded-full bg-slate-800/50"
                style={{ width: `${65 - (i % 2) * 10}%` }}
              />
              {i % 3 === 0 && (
                <div
                  className="h-1.5 rounded-full bg-slate-800/50"
                  style={{ width: "45%" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* footer badge */}
      <div className="px-6 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between relative z-10">
        <span className="text-[10px] text-slate-500">Signature · Payment · PDF</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
          <Sparkles className="w-2.5 h-2.5" />
          AI-generated
        </span>
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────── */
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
      setForm(prev => ({ ...prev, [field]: e.target.value }));
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
        // Netlify returns an HTML page (not JSON) when the function times out
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ??
            (res.status === 502 || res.status === 504
              ? "Generation timed out. Please try again."
              : "Failed to generate proposal")
        );
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
    <div className="min-h-full bg-slate-950 text-slate-300 p-6 md:p-12 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
      {/* decorative background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* back nav */}
      <div className="relative z-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </Link>

        {/* hero heading */}
        <div className="mb-10">
          <h1 className="text-[36px] font-extrabold text-white tracking-tight leading-none mb-3">
            Create a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">proposal.</span>
          </h1>
          <p className="text-slate-400 text-[15px] leading-relaxed max-w-lg mb-6">
            Fill in the details — AI writes the complete, professional proposal in seconds. Ready to sign and pay.
          </p>
          {/* feature chips */}
          <div className="flex flex-wrap gap-2">
            {CHIPS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[12px] font-medium text-slate-300 backdrop-blur-sm"
              >
                <Icon className="w-3 h-3 text-indigo-400" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-10 items-start">

          {/* ── LEFT: form ── */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Proposal details */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2 bg-black/20">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Proposal Details</span>
              </div>
              <div className="p-6">
                <Field id="title" label="Proposal Title">
                  <input
                    id="title"
                    className={inputCls}
                    placeholder="e.g. Website Redesign for Acme Corp"
                    value={form.title}
                    onChange={update("title")}
                    required
                  />
                </Field>
              </div>
            </div>

            {/* Client info */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2 bg-black/20">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Client</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field id="clientName" label="Name">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <input
                      id="clientName"
                      className={`${inputCls} pl-10`}
                      placeholder="Jane Smith"
                      value={form.clientName}
                      onChange={update("clientName")}
                      required
                    />
                  </div>
                </Field>
                <Field id="clientEmail" label="Email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <input
                      id="clientEmail"
                      type="email"
                      className={`${inputCls} pl-10`}
                      placeholder="jane@company.com"
                      value={form.clientEmail}
                      onChange={update("clientEmail")}
                      required
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2 bg-black/20">
                <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Project Description</span>
              </div>
              <div className="p-6">
                <Field
                  id="description"
                  label="Describe the project"
                  hint="(1–3 paragraphs — the more detail, the better the output)"
                >
                  <textarea
                    id="description"
                    className={`${inputCls} h-auto py-4 resize-none leading-relaxed`}
                    placeholder="Describe the client's challenge, the work you'll do, the outcomes they can expect, and any relevant context about the engagement..."
                    value={form.description}
                    onChange={update("description")}
                    required
                    rows={6}
                  />
                </Field>
              </div>
            </div>

            {/* Amount & expiry */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2 bg-black/20">
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Investment & Timeline</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field id="amount" label="Amount (USD)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-slate-500 font-medium pointer-events-none">$</span>
                    <input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      className={`${inputCls} pl-8`}
                      placeholder="5,000"
                      value={form.amount}
                      onChange={update("amount")}
                      required
                    />
                  </div>
                </Field>
                <Field id="expiryDays" label="Valid for">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <input
                      id="expiryDays"
                      type="number"
                      min="1"
                      max="365"
                      className={`${inputCls} pl-10 pr-14`}
                      placeholder="30"
                      value={form.expiryDays}
                      onChange={update("expiryDays")}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-slate-500 pointer-events-none">days</span>
                  </div>
                </Field>
              </div>
            </div>

            {/* Submit */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-lg">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[15px] gap-2.5 shadow-[0_0_40px_-10px_rgb(79,70,229)] transition-all hover:shadow-[0_0_60px_-10px_rgb(79,70,229)] border border-indigo-400/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI is writing your proposal…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Proposal with AI
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-8 mt-6">
                {[
                  { val: "~20s",   label: "generation time" },
                  { val: "9",      label: "sections written" },
                  { val: "100%",   label: "ready to send"   },
                ].map(({ val, label }) => (
                  <div key={label} className="text-center">
                    <p className="text-[16px] font-bold text-white">{val}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* ── RIGHT: live preview ── */}
          <div className="hidden xl:block sticky top-8">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Live preview
              </p>
            </div>
            <ProposalPreview
              title={form.title}
              clientName={form.clientName}
              clientEmail={form.clientEmail}
              amount={form.amount}
            />
            <p className="text-[11px] text-slate-500 text-center mt-4 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400/50" />
              Updates as you type · AI fills the rest
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

