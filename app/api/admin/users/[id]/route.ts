import { NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const { action } = await request.json();

  // Verify caller is admin
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = await createServiceClient();
  const { data: callerProfile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Prevent admin from acting on themselves
  if (id === user.id) return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });

  // Prevent acting on other admins
  const { data: targetProfile } = await service.from("profiles").select("role").eq("id", id).single();
  if (targetProfile?.role === "admin") return NextResponse.json({ error: "Cannot modify another admin account" }, { status: 400 });

  if (action === "disable") {
    const { error } = await service.auth.admin.updateUserById(id, {
      ban_duration: "876600h", // ~100 years
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === "enable") {
    const { error } = await service.auth.admin.updateUserById(id, {
      ban_duration: "none",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === "delete") {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
