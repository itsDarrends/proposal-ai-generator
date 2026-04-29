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
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div className="prose prose-gray max-w-none prose-p:my-2 prose-li:my-0.5">
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
}: ProposalContentProps) {
  return (
    <article className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-12 pb-8 border-b-2 border-gray-900">
        <p className="text-sm text-gray-500 mb-2 uppercase tracking-widest font-medium">
          Business Proposal
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-900">Prepared for: </span>
            {clientName}
          </div>
          <div>
            <span className="font-medium text-gray-900">Investment: </span>
            {formatCurrency(amount)}
          </div>
          <div>
            <span className="font-medium text-gray-900">Date: </span>
            {formatDate(createdAt)}
          </div>
          {expiresAt && (
            <div>
              <span className="font-medium text-gray-900">Valid until: </span>
              {formatDate(expiresAt)}
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
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-4">
          <div className="text-3xl font-bold text-blue-700 mb-1">
            {formatCurrency(amount)}
          </div>
          <p className="text-sm text-blue-600">Total project investment</p>
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
