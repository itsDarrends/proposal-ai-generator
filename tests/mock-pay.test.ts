import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, jsonRequest, type Query } from "./helpers/fake-supabase";

const h = vi.hoisted(() => ({
  sendPaymentReceivedEmail: vi.fn(),
  sendClientConfirmationEmail: vi.fn(),
  db: null as unknown,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: async () => h.db,
}));
vi.mock("@/lib/email", () => ({
  sendPaymentReceivedEmail: h.sendPaymentReceivedEmail,
  sendClientConfirmationEmail: h.sendClientConfirmationEmail,
}));

import { POST } from "@/app/api/stripe/mock-pay/route";

const PROPOSAL = {
  id: "p1",
  user_id: "u1",
  status: "signed",
  amount: 500,
  title: "Site",
  client_name: "Jenny",
  client_email: "jenny@example.com",
};

function setup(updateRows: unknown[] = [{ id: "p1" }]) {
  const { client, calls } = fakeSupabase({
    proposals: { select: { data: PROPOSAL, error: null }, update: { data: updateRows, error: null } },
    profiles: { select: { data: { email: "me@example.com" }, error: null } },
  });
  h.db = client;
  return calls;
}

const updates = (calls: Query[]) => calls.filter((c) => c.op === "update");

beforeEach(() => {
  vi.clearAllMocks();
  h.sendPaymentReceivedEmail.mockResolvedValue(undefined);
  h.sendClientConfirmationEmail.mockResolvedValue(undefined);
  vi.stubEnv("MOCK_PAYMENT", "true");
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/stripe/mock-pay", () => {
  it("is disabled unless MOCK_PAYMENT is on", async () => {
    vi.stubEnv("MOCK_PAYMENT", "false");
    const calls = setup();
    const res = await POST(jsonRequest("http://x", { proposalId: "p1" }));
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("is disabled in production even if MOCK_PAYMENT=true leaked into the environment", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const calls = setup();
    const res = await POST(jsonRequest("http://x", { proposalId: "p1" }));
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("marks a signed proposal paid, conditional on status, and emails both sides", async () => {
    const calls = setup();
    const res = await POST(jsonRequest("http://x", { proposalId: "p1" }));

    expect(res.status).toBe(200);
    const [update] = updates(calls);
    expect(update.payload).toMatchObject({ status: "paid" });
    expect(update.filters).toContainEqual({ kind: "eq", col: "status", val: "signed" });
    expect(h.sendClientConfirmationEmail).toHaveBeenCalledTimes(1);
  });

  it("refuses to pay a proposal that isn't signed (guarded update matches nothing)", async () => {
    setup([]);
    const res = await POST(jsonRequest("http://x", { proposalId: "p1" }));
    expect(res.status).toBe(409);
    expect(h.sendClientConfirmationEmail).not.toHaveBeenCalled();
  });
});
