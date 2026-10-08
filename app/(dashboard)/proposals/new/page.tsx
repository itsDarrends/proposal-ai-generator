"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2, FilePlus, ArrowLeft, Link2, PenLine, CreditCard,
  FileText, User, Mail, DollarSign, Clock, AlignLeft
} from "lucide-react";
import Link from "next/link";

/* ─── feature chips ──────────────────────────────────────────── */
const CHIPS = [
  { icon: Clock,        label: "Drafted in seconds" },
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
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
        {label}
        {hint && <span className="ml-1.5 font-normal text-slate-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── clean input ────────────────────────────────────────────── */
const inputCls =
  "w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[15px] font-medium text-slate-900 placeholder:text-slate-500 " +
  "hover:bg-slate-100 hover:border-slate-200 focus:bg-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm";

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
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm relative group">
      
      {/* top bar */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-red-400/80 transition-colors" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-amber-400/80 transition-colors" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-emerald-400/80 transition-colors" />
        <span className="ml-3 text-[11px] text-slate-500 font-mono tracking-wide">preview.pdf</span>
      </div>

      {/* header */}
      <div className="px-6 pt-6 pb-5 border-b border-slate-200 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-700 mb-1">
              Business Proposal
            </p>
            <h2 className={`text-[18px] font-bold leading-snug transition-colors ${hasTitle ? "text-slate-900" : "text-slate-400"}`}>
              {hasTitle ? title : "Proposal title will appear here"}
            </h2>
            <div className="mt-2 flex flex-col gap-0.5">
              <span className={`text-[12px] transition-colors ${hasClient ? "text-slate-600" : "text-slate-600"}`}>
                {hasClient ? `Prepared for ${clientName}` : "Prepared for — client name"}
              </span>
              <span className={`text-[11px] transition-colors ${hasEmail ? "text-slate-500" : "text-slate-700"}`}>
                {hasEmail ? clientEmail : "client@company.com"}
              </span>
            </div>
          </div>
          <div className={`shrink-0 text-right transition-colors ${hasAmount ? "text-slate-900" : "text-slate-400"}`}>
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
                className="h-1.5 rounded-full bg-slate-100"
                style={{ width: `${85 - (i % 3) * 12}%` }}
              />
              <div
                className="h-1.5 rounded-full bg-slate-100"
                style={{ width: `${65 - (i % 2) * 10}%` }}
              />
              {i % 3 === 0 && (
                <div
                  className="h-1.5 rounded-full bg-slate-100"
                  style={{ width: "45%" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* footer badge */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between relative z-10">
        <span className="text-[10px] text-slate-500">Signature · Payment · PDF</span>
        <span className="text-[10px] text-indigo-700 font-medium">Draft preview</span>
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
    <div className="min-h-full bg-white text-slate-700 p-6 md:p-12 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
      {/* decorative background glow */}
      
      {/* back nav */}
      <div className="relative z-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </Link>

        {/* hero heading */}
        <div className="mb-10">
          <h1 className="text-[36px] font-extrabold text-slate-900 tracking-tight leading-none mb-3">
            Create a <span className="text-indigo-700">proposal.</span>
          </h1>
          <p className="text-slate-600 text-[15px] leading-relaxed max-w-lg mb-6">
            Fill in the details and get a full draft in seconds. Edit it, then send your client a link to sign and pay.
          </p>
          {/* feature chips */}
          <div className="flex flex-wrap gap-2">
            {CHIPS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[12px] font-medium text-slate-700"
              >
                <Icon className="w-3 h-3 text-indigo-700" />
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
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                <FileText className="w-3.5 h-3.5 text-indigo-700" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Proposal Details</span>
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
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                <User className="w-3.5 h-3.5 text-indigo-700" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Client</span>
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
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                <AlignLeft className="w-3.5 h-3.5 text-indigo-700" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Project Description</span>
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
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                <DollarSign className="w-3.5 h-3.5 text-indigo-700" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Investment & Timeline</span>
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
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 shadow-lg">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[15px] gap-2.5 shadow-sm transition-all hover:shadow-sm border border-indigo-400/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI is writing your proposal…
                  </>
                ) : (
                  <>
                    <FilePlus className="w-5 h-5" />
                    Generate Proposal with AI
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-8 mt-6">
                {[
                  { val: "9",      label: "sections drafted" },
                  { val: "Edit",   label: "before you send" },
                  { val: "1 link", label: "to share"       },
                ].map(({ val, label }) => (
                  <div key={label} className="text-center">
                    <p className="text-[16px] font-bold text-slate-900">{val}</p>
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
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
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
              <FilePlus className="w-3 h-3 text-indigo-700/50" />
              Updates as you type · AI fills the rest
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

