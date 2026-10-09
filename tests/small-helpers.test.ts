import { describe, expect, it } from "vitest";
import { isLikelyBot } from "@/lib/bots";
import { escapeHtml } from "@/lib/html";
import { checkGenerateRateLimit } from "@/lib/rate-limit";
import { fakeSupabase } from "./helpers/fake-supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

describe("isLikelyBot", () => {
  it.each([
    "facebookexternalhit/1.1",
    "WhatsApp/2.23.20 A",
    "Slackbot-LinkExpanding 1.0",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Twitterbot/1.0",
    "curl/8.4.0",
    "node-fetch",
    "",
    null,
  ])("treats %j as a bot", (ua) => {
    expect(isLikelyBot(ua as string | null)).toBe(true);
  });

  it("lets real browsers through", () => {
    expect(
      isLikelyBot(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
      )
    ).toBe(false);
    expect(
      isLikelyBot(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
      )
    ).toBe(false);
  });
});

describe("escapeHtml", () => {
  it("neutralises markup in names and titles", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    expect(escapeHtml("Tom & Jerry's")).toBe("Tom &amp; Jerry&#39;s");
  });

  it("leaves plain text alone", () => {
    expect(escapeHtml("Website Redesign")).toBe("Website Redesign");
  });
});

describe("checkGenerateRateLimit", () => {
  const hour = 60 * 60 * 1000;
  const now = Date.parse("2026-10-08T12:00:00Z");
  const limit = { windowMs: hour, max: 3 };
  const asClient = (c: unknown) => c as SupabaseClient<Database>;

  it("allows a user under the limit", async () => {
    const { client } = fakeSupabase({
      proposals: { select: { data: [{ created_at: new Date(now - 1000).toISOString() }], error: null } },
    });
    const r = await checkGenerateRateLimit(asClient(client), "u1", now, limit);
    expect(r.allowed).toBe(true);
  });

  it("blocks at the limit and says when to retry", async () => {
    const rows = [10, 20, 30].map((min) => ({ created_at: new Date(now - min * 60_000).toISOString() }));
    const { client } = fakeSupabase({ proposals: { select: { data: rows, error: null } } });
    const r = await checkGenerateRateLimit(asClient(client), "u1", now, limit);
    expect(r.allowed).toBe(false);
    // oldest was 30 min ago, so the window frees up in 30 min
    expect(r.retryAfterSeconds).toBe(30 * 60);
  });

  it("fails open when the check itself errors", async () => {
    const { client } = fakeSupabase({ proposals: { select: { data: null, error: { message: "db down" } } } });
    const r = await checkGenerateRateLimit(asClient(client), "u1", now, limit);
    expect(r.allowed).toBe(true);
  });
});
