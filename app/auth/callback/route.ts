import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Make sure a profile row exists. The signup trigger normally creates it; never
      // overwrite an existing row (it holds role and branding), so conflicts are ignored.
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
