import { NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { checkClientEmail } from "@/lib/email-validation";
import { sendProposalToClientEmail } from "@/lib/email";
import { isImmutable } from "@/lib/proposal-rules";
import { isExpired } from "@/lib/utils";
import { MAX_SENDS_PER_PROPOSAL, SEND_COOLDOWN_SECONDS } from "@/lib/send-limits";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Always sends to the address saved on the proposal, never one supplied with the
  // request, so this can't be pointed at an arbitrary inbox.
  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isImmutable(proposal.status)) {
    return NextResponse.json({ error: "This proposal is already signed" }, { status: 409 });
  }
  if (isExpired(proposal.expires_at)) {
    return NextResponse.json({ error: "This proposal has expired" }, { status: 409 });
  }

  const check = await checkClientEmail(proposal.client_email);
  if (!check.ok) {
    return NextResponse.json({ error: check.message, suggestion: check.suggestion }, { status: 422 });
  }

  if (proposal.send_count >= MAX_SENDS_PER_PROPOSAL) {
    return NextResponse.json(
      { error: `You've already emailed this proposal ${MAX_SENDS_PER_PROPOSAL} times. Use "Copy link" to share it another way.` },
      { status: 429 }
    );
  }

  const now = Date.now();
  if (proposal.last_sent_at) {
    const waitSeconds = Math.ceil(
      (new Date(proposal.last_sent_at).getTime() + SEND_COOLDOWN_SECONDS * 1000 - now) / 1000
    );
    if (waitSeconds > 0) {
      return NextResponse.json(
        { error: `Already sent a moment ago. You can send again in ${waitSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(waitSeconds) } }
      );
    }
  }

  const service = await createServiceClient();

  // Claim the send first, conditional on the count we read, so two quick clicks can't
  // both pass the cooldown. If the email then fails, the claim is rolled back below.
  const { data: claimed, error: claimError } = await service
    .from("proposals")
    .update({ last_sent_at: new Date(now).toISOString(), send_count: proposal.send_count + 1 })
    .eq("id", id)
    .eq("send_count", proposal.send_count)
    .select("id");

  if (claimError) {
    // Most likely migration 005 (send_count / last_sent_at) hasn't been applied yet.
    console.error("[send proposal] couldn't record the send:", claimError);
    return NextResponse.json(
      { error: "Sending isn't set up yet. The site admin needs to run the latest database migration." },
      { status: 500 }
    );
  }

  if (!claimed?.length) {
    return NextResponse.json({ error: "Already sending. Please wait a moment." }, { status: 409 });
  }

  const { data: profile } = await service
    .from("profiles")
    .select("company_name")
    .eq("id", user.id)
    .single();

  const senderName = profile?.company_name?.trim() || user.email?.split("@")[0] || "Someone";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  try {
    await sendProposalToClientEmail({
      clientEmail: check.email,
      clientName: proposal.client_name,
      proposalTitle: proposal.title,
      senderName,
      replyTo: user.email ?? "",
      amount: proposal.amount,
      proposalUrl: `${appUrl}/proposal/${id}`,
      expiresAt: proposal.expires_at,
    });
  } catch (err) {
    console.error("[send proposal] email failed:", err);
    // A send that never left shouldn't count against the cap or start a cooldown.
    await service
      .from("proposals")
      .update({ last_sent_at: proposal.last_sent_at, send_count: proposal.send_count })
      .eq("id", id);

    return NextResponse.json(
      {
        error:
          "The email couldn't be delivered. If you haven't verified a sending domain in Resend, " +
          "it can only reach your own address. Use \"Copy link\" or \"Open in Gmail\" instead.",
      },
      { status: 502 }
    );
  }

  // A draft that has now been emailed is "sent". Never touches viewed/signed/paid.
  await service
    .from("proposals")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft");

  return NextResponse.json({ ok: true, sentTo: check.email });
}
