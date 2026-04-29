import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateProposalContent } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_TITLE_LENGTH = 200;
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 10_000_000;

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, clientName, clientEmail, description, amount, expiryDays } = body;

    if (!title || !clientName || !clientEmail || !description || amount == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof title !== "string" || title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json({ error: "Title too long" }, { status: 400 });
    }

    if (typeof description !== "string" || description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json({ error: `Description must be under ${MAX_DESCRIPTION_LENGTH} characters` }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (!isFinite(parsedAmount) || parsedAmount < MIN_AMOUNT || parsedAmount > MAX_AMOUNT) {
      return NextResponse.json({ error: "Amount must be between $1 and $10,000,000" }, { status: 400 });
    }

    const parsedExpiry = Number(expiryDays) || 30;
    const clampedExpiry = Math.min(Math.max(Math.floor(parsedExpiry), 1), 365);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(clientEmail))) {
      return NextResponse.json({ error: "Invalid client email" }, { status: 400 });
    }

    const content = await generateProposalContent({
      title: title.trim(),
      clientName: String(clientName).trim(),
      clientEmail: String(clientEmail).trim(),
      description: description.trim(),
      amount: parsedAmount,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + clampedExpiry);

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        title: title.trim(),
        client_name: String(clientName).trim(),
        client_email: String(clientEmail).trim(),
        content,
        amount: parsedAmount,
        status: "draft",
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("DB insert error:", error);
      return NextResponse.json({ error: "Failed to save proposal" }, { status: 500 });
    }

    return NextResponse.json({ proposalId: data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generate proposal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
