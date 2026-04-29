import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

const FROM = "ProposalAI <onboarding@resend.dev>";

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
  await getResend().emails.send({
    from: FROM,
    to: params.creatorEmail,
    subject: `${params.clientName} opened your proposal`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Proposal Viewed</h2>
        <p><strong>${params.clientName}</strong> just opened your proposal "<em>${params.proposalTitle}</em>".</p>
        <p>Now is a great time to follow up if you haven't already.</p>
        <a href="${params.proposalUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">View Proposal</a>
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
  await getResend().emails.send({
    from: FROM,
    to: params.creatorEmail,
    subject: `${params.clientName} signed your proposal`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Proposal Signed!</h2>
        <p><strong>${params.clientName}</strong> has signed "<em>${params.proposalTitle}</em>".</p>
        <p>They have been redirected to complete payment. You'll get another notification when payment is confirmed.</p>
        <a href="${params.proposalUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">View Proposal</a>
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
  await getResend().emails.send({
    from: FROM,
    to: params.creatorEmail,
    subject: `Payment received from ${params.clientName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Payment Received!</h2>
        <p><strong>${params.clientName}</strong> has paid <strong>$${params.amount.toLocaleString()}</strong> for "<em>${params.proposalTitle}</em>".</p>
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
  await getResend().emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: `Your signed proposal — ${params.proposalTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Thank you, ${params.clientName}!</h2>
        <p>Your proposal for "<em>${params.proposalTitle}</em>" has been signed and payment of <strong>$${params.amount.toLocaleString()}</strong> has been received.</p>
        <p>You can download a copy of your signed proposal below.</p>
        <a href="${params.pdfUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin-top:8px;">Download Signed Proposal (PDF)</a>
        <p style="margin-top:24px;color:#666;font-size:14px;">We're excited to get started. Expect to hear from us shortly.</p>
      </div>
    `,
  });
}
