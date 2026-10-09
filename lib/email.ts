import { Resend } from "resend";
import { escapeHtml } from "@/lib/html";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

// onboarding@resend.dev only delivers to the Resend account owner's own address. To email
// clients, verify a domain in Resend and set EMAIL_FROM, e.g. "ProposalAI <hello@yourdomain.com>".
const FROM = process.env.EMAIL_FROM ?? "ProposalAI <onboarding@resend.dev>";

/** Resend's send() resolves with { error } instead of throwing, so surface it. */
async function deliver(message: Parameters<Resend["emails"]["send"]>[0]) {
  const { error } = await getResend().emails.send(message);
  if (error) throw new Error(`Resend rejected the email (${error.name}): ${error.message}`);
}

/** Subjects are headers: strip line breaks so user-supplied text can't inject extra ones. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function isMocked() {
  return process.env.MOCK_EMAIL === "true";
}

export async function sendProposalViewedEmail(params: {
  creatorEmail: string;
  clientName: string;
  proposalTitle: string;
  proposalUrl: string;
}) {
  if (isMocked()) {
    console.log(`[email mock] Viewed: ${params.clientName} opened "${params.proposalTitle}"`);
    return;
  }
  await deliver({
    from: FROM,
    to: params.creatorEmail,
    subject: oneLine(`${params.clientName} opened your proposal`),
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Proposal Viewed</h2>
        <p><strong>${escapeHtml(params.clientName)}</strong> just opened your proposal "<em>${escapeHtml(params.proposalTitle)}</em>".</p>
        <p>Now is a great time to follow up if you haven't already.</p>
        <a href="${escapeHtml(params.proposalUrl)}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">View Proposal</a>
      </div>
    `,
  });
}

export async function sendProposalSignedEmail(params: {
  creatorEmail: string;
  clientName: string;
  proposalTitle: string;
  proposalUrl: string;
}) {
  if (isMocked()) {
    console.log(`[email mock] Signed: ${params.clientName} signed "${params.proposalTitle}"`);
    return;
  }
  await deliver({
    from: FROM,
    to: params.creatorEmail,
    subject: oneLine(`${params.clientName} signed your proposal`),
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Proposal Signed!</h2>
        <p><strong>${escapeHtml(params.clientName)}</strong> has signed "<em>${escapeHtml(params.proposalTitle)}</em>".</p>
        <p>They have been redirected to complete payment. You'll get another notification when payment is confirmed.</p>
        <a href="${escapeHtml(params.proposalUrl)}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">View Proposal</a>
      </div>
    `,
  });
}

export async function sendPaymentReceivedEmail(params: {
  creatorEmail: string;
  clientName: string;
  proposalTitle: string;
  amount: number;
}) {
  if (isMocked()) {
    console.log(`[email mock] Paid: ${params.clientName} paid $${params.amount} for "${params.proposalTitle}"`);
    return;
  }
  await deliver({
    from: FROM,
    to: params.creatorEmail,
    subject: oneLine(`Payment received from ${params.clientName}`),
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Payment Received!</h2>
        <p><strong>${escapeHtml(params.clientName)}</strong> has paid <strong>$${params.amount.toLocaleString()}</strong> for "<em>${escapeHtml(params.proposalTitle)}</em>".</p>
        <p>The proposal is now fully executed. Congratulations!</p>
      </div>
    `,
  });
}

export async function sendClientConfirmationEmail(params: {
  clientEmail: string;
  clientName: string;
  proposalTitle: string;
  amount: number;
  pdfUrl: string;
}) {
  if (isMocked()) {
    console.log(`[email mock] Confirmation sent to ${params.clientEmail} for "${params.proposalTitle}"`);
    return;
  }
  await deliver({
    from: FROM,
    to: params.clientEmail,
    subject: oneLine(`Your signed proposal — ${params.proposalTitle}`),
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Thank you, ${escapeHtml(params.clientName)}!</h2>
        <p>Your proposal for "<em>${escapeHtml(params.proposalTitle)}</em>" has been signed and payment of <strong>$${params.amount.toLocaleString()}</strong> has been received.</p>
        <p>You can download a copy of your signed proposal below.</p>
        <a href="${escapeHtml(params.pdfUrl)}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">Download Signed Proposal (PDF)</a>
        <p style="margin-top:24px;color:#666;font-size:14px;">We're excited to get started. Expect to hear from us shortly.</p>
      </div>
    `,
  });
}

export async function sendProposalToClientEmail(params: {
  clientEmail: string;
  clientName: string;
  proposalTitle: string;
  senderName: string;
  /** Replies go here, so the client answers the creator, not our no-reply address. */
  replyTo: string;
  amount: number;
  proposalUrl: string;
  expiresAt: string | null;
}) {
  if (isMocked()) {
    console.log(`[email mock] Proposal "${params.proposalTitle}" sent to ${params.clientEmail}`);
    return;
  }
  const expires = params.expiresAt
    ? new Date(params.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  await deliver({
    from: FROM,
    to: params.clientEmail,
    replyTo: params.replyTo,
    subject: oneLine(`${params.senderName} sent you a proposal: ${params.proposalTitle}`),
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin-bottom: 4px;">${escapeHtml(params.proposalTitle)}</h2>
        <p style="color: #666; margin-top: 0;">A proposal from ${escapeHtml(params.senderName)}</p>
        <p>Hi ${escapeHtml(params.clientName)},</p>
        <p>${escapeHtml(params.senderName)} has sent you a proposal for <strong>$${params.amount.toLocaleString()}</strong>. You can read it, sign it and pay on one page.</p>
        <a href="${escapeHtml(params.proposalUrl)}" style="display:inline-block;padding:12px 24px;background:#238449;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">View and sign proposal</a>
        ${expires ? `<p style="color:#666;font-size:14px;margin-top:20px;">This proposal is open until ${escapeHtml(expires)}.</p>` : ""}
        <p style="color:#666;font-size:14px;">Questions? Just reply to this email and it will reach ${escapeHtml(params.senderName)}.</p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0 12px;" />
        <p style="color:#999;font-size:12px;">You received this because ${escapeHtml(params.senderName)} entered your address on ProposalAI. If you weren't expecting it, you can ignore this email.</p>
      </div>
    `,
  });
}
