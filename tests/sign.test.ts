import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, jsonRequest, type Query } from "./helpers/fake-supabase";

const h = vi.hoisted(() => ({
  sendProposalSignedEmail: vi.fn(),
  db: null as unknown,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: async () => h.db,
}));
vi.mock("@/lib/email", () => ({
  sendProposalSignedEmail: h.sendProposalSignedEmail,
}));

import { POST } from "@/app/api/proposals/[id]/sign/route";

const SIGNATURE = "data:image/png;base64,iVBORw0KGgo=";
const params = { params: Promise.resolve({ id: "p1" }) };

function proposal(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: "p1",
    user_id: "u1",
    status,
    expires_at: null,
    title: "Site",
    client_name: "Jenny",
    ...extra,
  };
}

const updates = (calls: Query[]) => calls.filter((c) => c.op === "update");

beforeEach(() => {
  vi.clearAllMocks();
  h.sendProposalSignedEmail.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/proposals/[id]/sign", () => {
  it("rejects a missing or non-PNG signature", async () => {
    h.db = fakeSupabase({}).client;
    expect((await POST(jsonRequest("http://x", {}), params)).status).toBe(400);
    expect((await POST(jsonRequest("http://x", { signatureData: "data:image/jpeg;base64,xx" }), params)).status).toBe(400);
    expect((await POST(jsonRequest("http://x", "not json"), params)).status).toBe(400);
  });

  it("signs a sent proposal with an update guarded by status, then emails the creator", async () => {
    const { client, calls } = fakeSupabase({
      proposals: {
        select: { data: proposal("sent"), error: null },
        update: { data: [{ id: "p1" }], error: null },
      },
      profiles: { select: { data: { email: "me@example.com" }, error: null } },
    });
    h.db = client;

    const res = await POST(jsonRequest("http://x", { signatureData: SIGNATURE }), params);

    expect(res.status).toBe(200);
    const [update] = updates(calls);
    expect(update.payload).toMatchObject({ status: "signed", signature_data: SIGNATURE });
    expect(update.filters).toContainEqual({ kind: "in", col: "status", val: ["sent", "viewed"] });
    expect(h.sendProposalSignedEmail).toHaveBeenCalledTimes(1);
  });

  it("refuses to sign a draft nobody has opened (atomic guard matches no rows)", async () => {
    const { client } = fakeSupabase({
      proposals: {
        select: { data: proposal("draft"), error: null },
        update: { data: [], error: null },
      },
    });
    h.db = client;

    const res = await POST(jsonRequest("http://x", { signatureData: SIGNATURE }), params);

    expect(res.status).toBe(409);
    expect(h.sendProposalSignedEmail).not.toHaveBeenCalled();
  });

  it("treats an already-signed proposal as success without writing again", async () => {
    const { client, calls } = fakeSupabase({
      proposals: { select: { data: proposal("signed"), error: null } },
    });
    h.db = client;

    const res = await POST(jsonRequest("http://x", { signatureData: SIGNATURE }), params);

    expect(res.status).toBe(200);
    expect(updates(calls)).toHaveLength(0);
    expect(h.sendProposalSignedEmail).not.toHaveBeenCalled();
  });

  it("is idempotent when two requests race and the other one wins", async () => {
    let reads = 0;
    const { client } = fakeSupabase({
      proposals: {
        // first read: still "viewed"; the guarded update then matches nothing; re-read: "signed"
        select: () => ({ data: proposal(++reads === 1 ? "viewed" : "signed"), error: null }),
        update: { data: [], error: null },
      },
    });
    h.db = client;

    const res = await POST(jsonRequest("http://x", { signatureData: SIGNATURE }), params);

    expect(res.status).toBe(200);
    expect(h.sendProposalSignedEmail).not.toHaveBeenCalled();
  });

  it("refuses an expired proposal", async () => {
    const { client, calls } = fakeSupabase({
      proposals: {
        select: { data: proposal("sent", { expires_at: "2000-01-01T00:00:00Z" }), error: null },
      },
    });
    h.db = client;

    const res = await POST(jsonRequest("http://x", { signatureData: SIGNATURE }), params);

    expect(res.status).toBe(400);
    expect(updates(calls)).toHaveLength(0);
  });
});
