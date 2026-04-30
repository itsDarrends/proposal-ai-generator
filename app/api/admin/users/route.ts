import { NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Verify caller is admin
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = await createServiceClient();
  const { data: callerProfile } = await service.from("profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch all auth users
  const { data: authUsers } = await service.auth.admin.listUsers();

  // Fetch all profiles with proposal stats
  const { data: profiles } = await service.from("profiles").select("id, email, role, created_at");
  const { data: proposals } = await service.from("proposals").select("user_id, amount, status");

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const authMap = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u]));

  const rows = (profiles ?? []).map((profile) => {
    const userProposals = (proposals ?? []).filter((p) => p.user_id === profile.id);
    const revenue = userProposals
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const authUser = authMap[profile.id];

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role ?? "user",
      created_at: profile.created_at,
      proposal_count: userProposals.length,
      revenue,
      banned: !!authUser?.banned_until,
    };
  });

  return NextResponse.json(rows);
}
