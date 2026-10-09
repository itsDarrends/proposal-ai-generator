import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { sendProposalViewedEmail } from "@/lib/email";
import { settleWithin } from "@/lib/async";
import { isLikelyBot } from "@/lib/bots";
import { PROMOTED_ON_VIEW } from "@/lib/proposal-rules";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Called from the browser by <ViewTracker/> once per tab session. Always answers
 * ok so the client page never shows an error for analytics.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  // Link-preview unfurlers and crawlers aren't a client reading the proposal.
  if (isLikelyBot(request.headers.get("user-agent"))) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const supabase = await createServiceClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) return NextResponse.json({ ok: true, counted: false });

  // The creator previewing their own proposal isn't the client opening it.
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (user?.id === proposal.user_id) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const now = new Date().toISOString();

  if (!proposal.viewed_at) {
    // First view. Conditional on viewed_at still being null, so when several requests
    // arrive together only one wins and only that one sends the "opened" email.
    const { data: first } = await supabase
      .from("proposals")
      .update({ viewed_at: now, view_count: (proposal.view_count ?? 0) + 1, updated_at: now })
      .eq("id", id)
      .is("viewed_at", null)
      .select("id");

    if (first?.length) {
      // A client opening the link means it has been shared, even if the creator never
      // marked it sent. Never touches signed/paid proposals.
      await supabase
        .from("proposals")
        .update({ status: "viewed" })
        .eq("id", id)
        .in("status", [...PROMOTED_ON_VIEW]);

      const { data: creator } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", proposal.user_id)
        .single();

      if (creator?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        await settleWithin([
          sendProposalViewedEmail({
            creatorEmail: creator.email,
            clientName: proposal.client_name,
            proposalTitle: proposal.title,
            proposalUrl: `${appUrl}/proposal/${id}`,
          }),
        ]);
      }
      return NextResponse.json({ ok: true, counted: true });
    }
  }

  // Repeat view: bump the counter. Compare-and-set on the value we read, so a lost
  // race drops one increment instead of overwriting a newer count.
  await supabase
    .from("proposals")
    .update({ view_count: (proposal.view_count ?? 0) + 1, updated_at: now })
    .eq("id", id)
    .eq("view_count", proposal.view_count ?? 0);

  return NextResponse.json({ ok: true, counted: true });
}
