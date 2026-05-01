import { NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = await createServiceClient();
  const { data } = await service.from("profiles").select("company_name, company_logo_url, brand_color, email").eq("id", user.id).single();

  return NextResponse.json(data ?? {});
}

export async function PATCH(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { company_name, company_logo_url, brand_color } = await request.json();

  const service = await createServiceClient();
  // eslint-disable-next-line
  const { error } = await (service.from("profiles") as any)
    .update({ company_name, company_logo_url, brand_color })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
