import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { patchProposalSchema } from "@/lib/schemas";
import { canOwnerTransition, isImmutable } from "@/lib/proposal-rules";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchProposalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid proposal data" }, { status: 400 });
  }
  const { content, status } = parsed.data;

  const { data: current } = await supabase
    .from("proposals")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isImmutable(current.status)) {
    return NextResponse.json(
      { error: "Signed or paid proposals can no longer be edited" },
      { status: 409 }
    );
  }

  if (status && !canOwnerTransition(current.status, status)) {
    return NextResponse.json(
      { error: `A proposal can't move from "${current.status}" to "${status}"` },
      { status: 409 }
    );
  }

  // Conditional on the status we just read, so a client signing at the same moment
  // can't be overwritten by this edit.
  const { data: updated, error } = await supabase
    .from("proposals")
    .update({
      updated_at: new Date().toISOString(),
      ...(content ? { content } : {}),
      ...(status ? { status } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", current.status)
    .select("id");

  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });

  if (!updated?.length) {
    return NextResponse.json(
      { error: "This proposal just changed. Reload and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
