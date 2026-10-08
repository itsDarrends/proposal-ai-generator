import type { ProposalContent as Content } from "@/lib/supabase/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ProposalContentProps {
  content: Content;
  title: string;
  clientName: string;
  amount: number;
  createdAt: string;
  expiresAt: string | null;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  brandColor?: string | null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 relative group">
      <div className="absolute -inset-x-4 -inset-y-4 z-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
      <h2 className="text-2xl font-bold text-white mb-5 pb-3 border-b border-white/10 relative z-10 flex items-center">
        {title}
      </h2>
      <div className="text-slate-300 leading-relaxed space-y-4 relative z-10 text-[15px]">{children}</div>
    </section>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div className="prose prose-invert prose-slate max-w-none prose-p:my-3 prose-li:my-1 prose-headings:text-white prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

export function ProposalContent({
  content,
  title,
  clientName,
  amount,
  createdAt,
  expiresAt,
  companyName,
  companyLogoUrl,
  brandColor,
}: ProposalContentProps) {
  const accent = brandColor ?? "#6366f1"; // Default to indigo-500

  return (
    <article className="max-w-3xl mx-auto bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl relative z-10">
      {/* Header */}
      <div className="mb-14 pb-10 border-b border-white/10" style={{ borderBottomColor: `${accent}40` }}>
        {(companyLogoUrl || companyName) && (
          <div className="flex items-center gap-4 mb-8">
            {companyLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={companyLogoUrl} alt={companyName ?? "Company logo"} className="h-12 w-auto object-contain drop-shadow-md" />
            )}
            {companyName && (
              <span className="text-xl font-bold text-white tracking-tight">{companyName}</span>
            )}
          </div>
        )}
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
          Business Proposal
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">{title}</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-slate-400 bg-black/20 p-6 rounded-2xl border border-white/5">
          <div>
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Prepared for</span>
            <span className="font-medium text-white">{clientName}</span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Investment</span>
            <span className="font-bold text-white">{formatCurrency(amount)}</span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Date</span>
            <span className="font-medium text-white">{formatDate(createdAt)}</span>
          </div>
          {expiresAt && (
            <div>
              <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Valid until</span>
              <span className="font-medium text-white">{formatDate(expiresAt)}</span>
            </div>
          )}
        </div>
      </div>

      <Section title="Executive Summary">
        <Prose text={content.executiveSummary} />
      </Section>

      <Section title="The Challenge">
        <Prose text={content.problemStatement} />
      </Section>

      <Section title="Our Proposed Solution">
        <Prose text={content.proposedSolution} />
      </Section>

      <Section title="Scope of Work">
        <Prose text={content.scopeOfWork} />
      </Section>

      <Section title="Timeline">
        <Prose text={content.timeline} />
      </Section>

      <Section title="Investment">
        <div className="rounded-2xl p-8 mb-6 relative overflow-hidden group" style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}30` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="text-4xl font-extrabold mb-2" style={{ color: accent }}>
            {formatCurrency(amount)}
          </div>
          <p className="text-sm font-medium" style={{ color: `${accent}cc` }}>Total project investment</p>
        </div>
        <Prose text={content.investment} />
      </Section>

      <Section title="Why Us">
        <Prose text={content.whyUs} />
      </Section>

      <Section title="Terms & Conditions">
        <Prose text={content.termsAndConditions} />
      </Section>

      <Section title="Next Steps">
        <Prose text={content.nextSteps} />
      </Section>
    </article>
  );
}
