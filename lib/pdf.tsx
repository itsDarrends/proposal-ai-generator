import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ProposalContent } from "@/lib/supabase/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: "#1a1a1a",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    fontSize: 9,
    color: "#6b7280",
  },
  metaItem: {
    flexDirection: "row",
    gap: 4,
  },
  metaBold: {
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    marginBottom: 8,
    color: "#1a1a1a",
  },
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#374151",
  },
  investmentBox: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  investmentAmount: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
  },
  investmentLabel: {
    fontSize: 9,
    color: "#3b82f6",
  },
  signatureSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  signatureTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  signatureImage: {
    width: 200,
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
});

interface ProposalDocProps {
  title: string;
  clientName: string;
  amount: number;
  createdAt: string;
  expiresAt: string | null;
  content: ProposalContent;
  signatureData: string | null;
  signedAt: string | null;
}

function Section({ title, body }: { title: string; body: string }) {
  const lines = body.split("\n").filter((l) => l.trim());
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {lines.map((line, i) => (
        <Text key={i} style={styles.body}>
          {line.replace(/^[-*]\s+/, "• ").replace(/\*\*/g, "")}
        </Text>
      ))}
    </View>
  );
}

function ProposalDoc({
  title,
  clientName,
  amount,
  createdAt,
  expiresAt,
  content,
  signatureData,
  signedAt,
}: ProposalDocProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.label}>Business Proposal</Text>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaBold}>Prepared for: </Text>
              <Text>{clientName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaBold}>Investment: </Text>
              <Text>{formatCurrency(amount)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaBold}>Date: </Text>
              <Text>{formatDate(createdAt)}</Text>
            </View>
            {expiresAt && (
              <View style={styles.metaItem}>
                <Text style={styles.metaBold}>Valid until: </Text>
                <Text>{formatDate(expiresAt)}</Text>
              </View>
            )}
          </View>
        </View>

        <Section title="Executive Summary" body={content.executiveSummary} />
        <Section title="The Challenge" body={content.problemStatement} />
        <Section title="Proposed Solution" body={content.proposedSolution} />
        <Section title="Scope of Work" body={content.scopeOfWork} />
        <Section title="Timeline" body={content.timeline} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment</Text>
          <View style={styles.investmentBox}>
            <Text style={styles.investmentAmount}>{formatCurrency(amount)}</Text>
            <Text style={styles.investmentLabel}>Total project investment</Text>
          </View>
          <Text style={styles.body}>{content.investment}</Text>
        </View>

        <Section title="Why Us" body={content.whyUs} />
        <Section title="Terms & Conditions" body={content.termsAndConditions} />
        <Section title="Next Steps" body={content.nextSteps} />

        {signatureData && signedAt && (
          <View style={styles.signatureSection}>
            <Text style={styles.signatureTitle}>Client Signature</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={signatureData} style={styles.signatureImage} />
            <Text style={styles.signatureLabel}>
              Signed by {clientName} on {formatDate(signedAt)}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function generateProposalPDF(params: ProposalDocProps): Promise<Buffer> {
  const buffer = await renderToBuffer(<ProposalDoc {...params} />);
  return Buffer.from(buffer);
}
