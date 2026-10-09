import { createServerClient as createSupabaseServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function createServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  // @supabase/ssr 0.5.x is typed against an older supabase-js generic signature than the
  // installed one, which made every insert/update resolve to `never` (the old `as any`
  // casts). Re-typing the returned client here fixes it for all call sites.
  const client = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — mutations are a no-op
          }
        },
      },
    }
  );
  return client as unknown as SupabaseClient<Database>;
}

/**
 * Service-role client: bypasses RLS and deliberately has NO session.
 *
 * It must not read the request cookies. supabase-js sends the signed-in user's
 * access token when a session exists and only falls back to the key otherwise,
 * so a cookie-backed "service" client would silently run as the logged-in user
 * (and RLS would hide other people's proposals from public pages).
 * Stays async so existing `await createServiceClient()` call sites are unchanged.
 */
export async function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}
