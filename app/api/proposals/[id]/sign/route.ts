import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/server";
import { sendProposalSignedEmail } from "@/lib/email";
import { isExpired } from "@/lib/utils";
import { settleWithin } from "@/lib/async";
import { isImmutable, SIGNABLE_STATUSES } from "@/lib/proposal-rules";

interface Params {
  params: Promise<{ id: string }>;
}

// ~2MB limit for base64 PNG signature
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const signatureData = body?.signatureData;

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

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (isImmutable(proposal.status)) {
    return NextResponse.json({ ok: true });
  }

  if (isExpired(proposal.expires_at)) {
    return NextResponse.json({ error: "Proposal has expired" }, { status: 400 });
  }

  // The status check lives in the UPDATE itself, so two racing requests (or a draft
  // nobody has opened) can't both sign. Only one row-update can match.
  const { data: signed, error } = await supabase
    .from("proposals")
    .update({
      signature_data: signatureData,
      status: "signed",
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", [...SIGNABLE_STATUSES])
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to save signature" }, { status: 500 });
  }

  if (!signed?.length) {
    // Either someone else signed first (fine) or the proposal isn't signable yet.
    const { data: latest } = await supabase.from("proposals").select("status").eq("id", id).single();
    if (latest && isImmutable(latest.status)) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "This proposal can't be signed yet" }, { status: 409 });
  }

  const { data: creator } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", proposal.user_id)
    .single();

  if (creator?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await settleWithin([
      sendProposalSignedEmail({
        creatorEmail: creator.email,
        clientName: proposal.client_name,
        proposalTitle: proposal.title,
        proposalUrl: `${appUrl}/proposal/${id}`,
      }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
