import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, type Query } from "./helpers/fake-supabase";

const h = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => h.db,
}));

import { PATCH } from "@/app/api/proposals/[id]/route";

const params = { params: Promise.resolve({ id: "p1" }) };

const CONTENT = {
  executiveSummary: "a",
  problemStatement: "b",
  proposedSolution: "c",
  scopeOfWork: "d",
  timeline: "e",
  investment: "f",
  whyUs: "g",
  termsAndConditions: "h",
  nextSteps: "i",
};

function patch(body: unknown) {
  return new Request("http://localhost/api/proposals/p1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setup(opts: { user?: boolean; status?: string | null; updateRows?: unknown[] }) {
  const { client, calls } = fakeSupabase({
    proposals: {
      select: {
        data: opts.status === null ? null : { status: opts.status ?? "draft" },
        error: null,
      },
      update: { data: opts.updateRows ?? [{ id: "p1" }], error: null },
    },
  });
  client.auth.getUser = async () => ({ data: { user: opts.user === false ? null : { id: "u1" } } }) as never;
  h.db = client;
  return calls;
}

const updates = (calls: Query[]) => calls.filter((c) => c.op === "update");

beforeEach(() => vi.clearAllMocks());

describe("PATCH /api/proposals/[id]", () => {
  it("requires a signed-in user", async () => {
    setup({ user: false });
    expect((await PATCH(patch({ status: "sent" }), params)).status).toBe(401);
  });

  it("rejects malformed bodies without touching the database", async () => {
    const calls = setup({});
    expect((await PATCH(patch({}), params)).status).toBe(400);
    expect((await PATCH(patch({ content: { executiveSummary: "only one section" } }), params)).status).toBe(400);
    expect((await PATCH(patch({ status: "refunded" }), params)).status).toBe(400);
    expect((await PATCH(patch({ amount: 1 }), params)).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("404s for a proposal the user doesn't own", async () => {
    setup({ status: null });
    expect((await PATCH(patch({ status: "sent" }), params)).status).toBe(404);
  });

  it.each(["signed", "paid"])("won't edit content once the proposal is %s", async (status) => {
    const calls = setup({ status });
    const res = await PATCH(patch({ content: CONTENT }), params);
    expect(res.status).toBe(409);
    expect(updates(calls)).toHaveLength(0);
  });

  it.each([
    ["draft", "paid"],
    ["draft", "signed"],
    ["draft", "viewed"],
    ["sent", "paid"],
    ["viewed", "draft"],
  ])("won't let the owner move %s -> %s", async (from, to) => {
    const calls = setup({ status: from });
    const res = await PATCH(patch({ status: to }), params);
    expect(res.status).toBe(409);
    expect(updates(calls)).toHaveLength(0);
  });

  it("allows draft -> sent and conditions the update on the status it read", async () => {
    const calls = setup({ status: "draft" });
    const res = await PATCH(patch({ status: "sent" }), params);

    expect(res.status).toBe(200);
    const [update] = updates(calls);
    expect(update.payload).toMatchObject({ status: "sent" });
    expect(update.filters).toContainEqual({ kind: "eq", col: "status", val: "draft" });
    expect(update.filters).toContainEqual({ kind: "eq", col: "user_id", val: "u1" });
  });

  it("saves valid content edits on a draft", async () => {
    const calls = setup({ status: "draft" });
    const res = await PATCH(patch({ content: CONTENT }), params);
    expect(res.status).toBe(200);
    expect(updates(calls)[0].payload).toMatchObject({ content: CONTENT });
  });

  it("reports a conflict if the proposal changed while editing (update matched no rows)", async () => {
    setup({ status: "sent", updateRows: [] });
    const res = await PATCH(patch({ content: CONTENT }), params);
    expect(res.status).toBe(409);
  });
});
