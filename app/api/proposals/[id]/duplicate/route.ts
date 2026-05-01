import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: raw } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const proposal = raw as Proposal | null;
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      user_id: user.id,
      title: `${proposal.title} (Copy)`,
      client_name: proposal.client_name,
      client_email: proposal.client_email,
      content: proposal.content,
      amount: proposal.amount,
      status: "draft",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Failed to duplicate" }, { status: 500 });

  return NextResponse.json({ proposalId: data.id });
}
