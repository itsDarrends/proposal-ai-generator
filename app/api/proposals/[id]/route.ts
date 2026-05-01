import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { ProposalContent } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { content, status } = body as { content?: ProposalContent; status?: string };

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (content) update.content = content;
  if (status) update.status = status;

  // eslint-disable-next-line
  const { error } = await (supabase.from("proposals") as any)
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
