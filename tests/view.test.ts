import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, type Query } from "./helpers/fake-supabase";

const h = vi.hoisted(() => ({
  sendProposalViewedEmail: vi.fn(),
  db: null as unknown,
  user: null as { id: string } | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: async () => h.db,
  createServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: h.user } }) } }),
}));
vi.mock("@/lib/email", () => ({
  sendProposalViewedEmail: h.sendProposalViewedEmail,
}));

import { POST } from "@/app/api/proposals/[id]/view/route";

const params = { params: Promise.resolve({ id: "p1" }) };
const BROWSER =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function viewRequest(userAgent: string | null = BROWSER) {
  return new Request("http://localhost/api/proposals/p1/view", {
    method: "POST",
    headers: userAgent ? { "user-agent": userAgent } : {},
  });
}

function setup(proposal: Record<string, unknown>, firstViewUpdateRows: unknown[] = [{ id: "p1" }]) {
  const { client, calls } = fakeSupabase({
    proposals: {
      select: {
        data: { id: "p1", user_id: "owner", client_name: "Jenny", title: "Site", view_count: 0, ...proposal },
        error: null,
      },
      // The first-view update is the one filtered on viewed_at IS NULL.
      update: (q: Query) =>
        q.filters.some((f) => f.kind === "is")
          ? { data: firstViewUpdateRows, error: null }
          : { data: [{ id: "p1" }], error: null },
    },
    profiles: { select: { data: { email: "me@example.com" }, error: null } },
  });
  h.db = client;
  return calls;
}

const updates = (calls: Query[]) => calls.filter((c) => c.op === "update");

beforeEach(() => {
  vi.clearAllMocks();
  h.user = null;
  h.sendProposalViewedEmail.mockResolvedValue(undefined);
});

describe("POST /api/proposals/[id]/view", () => {
  it("ignores link-preview bots and crawlers entirely", async () => {
    const calls = setup({ status: "sent", viewed_at: null });
    const res = await POST(viewRequest("Slackbot-LinkExpanding 1.0"), params);
    expect(await res.json()).toMatchObject({ counted: false });
    expect(calls).toHaveLength(0);
    expect(h.sendProposalViewedEmail).not.toHaveBeenCalled();
  });

  it("doesn't count the creator previewing their own proposal", async () => {
    h.user = { id: "owner" };
    const calls = setup({ status: "sent", viewed_at: null });
    const res = await POST(viewRequest(), params);
    expect(await res.json()).toMatchObject({ counted: false });
    expect(updates(calls)).toHaveLength(0);
    expect(h.sendProposalViewedEmail).not.toHaveBeenCalled();
  });

  it("counts a signed-in stranger (a different user) as a real view", async () => {
    h.user = { id: "someone-else" };
    setup({ status: "sent", viewed_at: null });
    const res = await POST(viewRequest(), params);
    expect(await res.json()).toMatchObject({ counted: true });
  });

  it("on the first view: stamps viewed_at, promotes sent/draft to viewed, emails once", async () => {
    const calls = setup({ status: "draft", viewed_at: null });
    await POST(viewRequest(), params);

    const [first, promote] = updates(calls);
    expect(first.payload).toMatchObject({ view_count: 1 });
    expect(first.filters).toContainEqual({ kind: "is", col: "viewed_at", val: null });
    expect(promote.payload).toEqual({ status: "viewed" });
    expect(promote.filters).toContainEqual({ kind: "in", col: "status", val: ["draft", "sent"] });
    expect(h.sendProposalViewedEmail).toHaveBeenCalledTimes(1);
  });

  it("never emails on a repeat view, only bumps the counter", async () => {
    const calls = setup({ status: "viewed", viewed_at: "2026-10-01T00:00:00Z", view_count: 4 });
    await POST(viewRequest(), params);

    expect(h.sendProposalViewedEmail).not.toHaveBeenCalled();
    const [bump] = updates(calls);
    expect(bump.payload).toMatchObject({ view_count: 5 });
  });

  it("emails only once when several first-view requests race (loser's update matches no rows)", async () => {
    setup({ status: "sent", viewed_at: null }, []);
    await POST(viewRequest(), params);
    expect(h.sendProposalViewedEmail).not.toHaveBeenCalled();
  });
});
