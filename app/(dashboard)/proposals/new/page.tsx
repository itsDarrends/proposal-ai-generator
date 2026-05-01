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
      <label htmlFor={id} className="block text-[13px] font-semibold text-slate-700">
        {label}
        {hint && <span className="ml-1.5 font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── clean input ────────────────────────────────────────────── */
const inputCls =
  "w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-800 placeholder:text-slate-300 " +
  "focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all";

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
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* top bar */}
      <div className="px-5 py-3.5 bg-slate-950 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-[11px] text-slate-500 font-mono tracking-wide">proposal preview</span>
      </div>

      {/* header */}
      <div className="px-6 pt-6 pb-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">
              Business Proposal
            </p>
            <h2 className={`text-[18px] font-bold leading-snug transition-colors ${hasTitle ? "text-slate-900" : "text-slate-300"}`}>
              {hasTitle ? title : "Proposal title will appear here"}
            </h2>
            <div className="mt-2 flex flex-col gap-0.5">
              <span className={`text-[12px] transition-colors ${hasClient ? "text-slate-600" : "text-slate-300"}`}>
                {hasClient ? `Prepared for ${clientName}` : "Prepared for — client name"}
              </span>
              <span className={`text-[11px] transition-colors ${hasEmail ? "text-slate-400" : "text-slate-200"}`}>
                {hasEmail ? clientEmail : "client@company.com"}
              </span>
            </div>
          </div>
          <div className={`shrink-0 text-right transition-colors ${hasAmount ? "text-slate-900" : "text-slate-300"}`}>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Investment</p>
            <p className="text-[22px] font-bold tabular-nums leading-none">
              {hasAmount ? `$${Number(amount).toLocaleString()}` : "$0"}
            </p>
          </div>
        </div>
      </div>

      {/* sections skeleton */}
      <div className="px-6 py-5 space-y-4">
        {sections.map((s, i) => (
          <div key={s} className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500">{s}</div>
            <div className="space-y-1">
              <div
                className="h-2 rounded-full bg-slate-100 animate-pulse"
                style={{ width: `${85 - (i % 3) * 12}%`, animationDelay: `${i * 80}ms` }}
              />
              <div
                className="h-2 rounded-full bg-slate-100 animate-pulse"
                style={{ width: `${65 - (i % 2) * 10}%`, animationDelay: `${i * 80 + 40}ms` }}
              />
              {i % 3 === 0 && (
                <div
                  className="h-2 rounded-full bg-slate-100 animate-pulse"
                  style={{ width: "45%", animationDelay: `${i * 80 + 80}ms` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* footer badge */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Signature · Payment · PDF</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 font-medium">
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
    <div className="min-h-full">
      {/* back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to dashboard
      </Link>

      {/* hero heading */}
      <div className="mb-8">
        <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-none mb-3">
          Create a proposal.
        </h1>
        <p className="text-slate-500 text-[15px] leading-relaxed max-w-lg mb-5">
          Fill in the details — AI writes the complete, professional proposal in seconds. Ready to sign and pay.
        </p>
        {/* feature chips */}
        <div className="flex flex-wrap gap-2">
          {CHIPS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-600 shadow-sm"
            >
              <Icon className="w-3 h-3 text-slate-400" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">

        {/* ── LEFT: form ── */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Proposal details */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Proposal Details</span>
            </div>
            <div className="p-5">
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
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Client</span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <Field id="clientName" label="Name">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                  <input
                    id="clientName"
                    className={`${inputCls} pl-9`}
                    placeholder="Jane Smith"
                    value={form.clientName}
                    onChange={update("clientName")}
                    required
                  />
                </div>
              </Field>
              <Field id="clientEmail" label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                  <input
                    id="clientEmail"
                    type="email"
                    className={`${inputCls} pl-9`}
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
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Project Description</span>
            </div>
            <div className="p-5">
              <Field
                id="description"
                label="Describe the project"
                hint="(1–3 paragraphs — the more detail, the better the output)"
              >
                <textarea
                  id="description"
                  className={`${inputCls} h-auto py-3 resize-none leading-relaxed`}
                  placeholder="Describe the client's challenge, the work you'll do, the outcomes they can expect, and any relevant context about the engagement..."
                  value={form.description}
                  onChange={update("description")}
                  required
                  rows={7}
                />
              </Field>
            </div>
          </div>

          {/* Amount & expiry */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Investment & Timeline</span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <Field id="amount" label="Amount (USD)">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-slate-400 font-medium pointer-events-none">$</span>
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    className={`${inputCls} pl-7`}
                    placeholder="5,000"
                    value={form.amount}
                    onChange={update("amount")}
                    required
                  />
                </div>
              </Field>
              <Field id="expiryDays" label="Valid for">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                  <input
                    id="expiryDays"
                    type="number"
                    min="1"
                    max="365"
                    className={`${inputCls} pl-9 pr-14`}
                    placeholder="30"
                    value={form.expiryDays}
                    onChange={update("expiryDays")}
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 pointer-events-none">days</span>
                </div>
              </Field>
            </div>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[14px] gap-2.5 shadow-lg shadow-slate-900/20 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is writing your proposal…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Proposal with AI
                </>
              )}
            </Button>
            <div className="flex items-center justify-center gap-5 mt-4">
              {[
                { val: "~20s",   label: "generation time" },
                { val: "9",      label: "sections written" },
                { val: "100%",   label: "ready to send"   },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-[15px] font-bold text-slate-800">{val}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* ── RIGHT: live preview ── */}
        <div className="hidden xl:block sticky top-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
            Live preview
          </p>
          <ProposalPreview
            title={form.title}
            clientName={form.clientName}
            clientEmail={form.clientEmail}
            amount={form.amount}
          />
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Updates as you type · AI fills the rest
          </p>
        </div>

      </div>
    </div>
  );
}
