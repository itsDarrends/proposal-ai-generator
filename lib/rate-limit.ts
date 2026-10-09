import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const GENERATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 15 };

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Per-user limit on AI generation, counted from the proposals table so it holds
 * across serverless instances (an in-memory counter would reset on every cold start).
 * Duplicated proposals count too; that's a small price for needing no extra table.
 */
export async function checkGenerateRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  now: number = Date.now(),
  limit = GENERATE_LIMIT
): Promise<RateLimitResult> {
  const since = new Date(now - limit.windowMs).toISOString();

  const { data, error } = await supabase
    .from("proposals")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit.max);

  // If the check itself fails, don't block people; the AI call has its own quota errors.
  if (error || !data || data.length < limit.max) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const oldestInWindow = new Date(data[data.length - 1].created_at).getTime();
  const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + limit.windowMs - now) / 1000));
  return { allowed: false, retryAfterSeconds };
}
