import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/server";
import { sendProposalSignedEmail } from "@/lib/email";
import { isExpired } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

interface Params {
  params: Promise<{ id: string }>;
}

// ~2MB limit for base64 PNG signature
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const { signatureData } = await request.json();

  if (!signatureData || typeof signatureData !== "string") {
    return NextResponse.json({ error: "Signature data required" }, { status: 400 });
  }

  if (!signatureData.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
  }

  if (Buffer.byteLength(signatureData, "utf8") > MAX_SIGNATURE_BYTES) {
    return NextResponse.json({ error: "Signature image too large" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: rawProposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  const proposal = rawProposal as Proposal | null;

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status === "signed" || proposal.status === "paid") {
    return NextResponse.json({ ok: true });
  }

  if (isExpired(proposal.expires_at)) {
    return NextResponse.json({ error: "Proposal has expired" }, { status: 400 });
  }

  // eslint-disable-next-line
  const { error } = await (supabase.from("proposals") as any)
    .update({
      signature_data: signatureData,
      status: "signed",
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to save signature" }, { status: 500 });
  }

  const { data: rawCreator } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", proposal.user_id)
    .single();

  const creatorEmail = (rawCreator as { email: string } | null)?.email;

  if (creatorEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendProposalSignedEmail({
      creatorEmail,
      clientName: proposal.client_name,
      proposalTitle: proposal.title,
      proposalUrl: `${appUrl}/proposal/${id}`,
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
