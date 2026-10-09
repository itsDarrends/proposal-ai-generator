import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, type Query } from "./helpers/fake-supabase";

const h = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  sendPaymentReceivedEmail: vi.fn(),
  sendClientConfirmationEmail: vi.fn(),
  db: null as unknown,
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: h.constructEvent } }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: async () => h.db,
}));
vi.mock("@/lib/email", () => ({
  sendPaymentReceivedEmail: h.sendPaymentReceivedEmail,
  sendClientConfirmationEmail: h.sendClientConfirmationEmail,
}));

import { POST } from "@/app/api/stripe/webhook/route";

const PROPOSAL = {
  id: "p1",
  user_id: "u1",
  status: "signed",
  amount: 1200,
  title: "Site",
  client_name: "Jenny",
  client_email: "jenny@example.com",
};

function completedEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_1",
        payment_status: "paid",
        amount_total: 120000,
        currency: "usd",
        metadata: { proposalId: "p1" },
        ...overrides,
      },
    },
  };
}

function request(withSignature = true) {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: withSignature ? { "stripe-signature": "sig" } : {},
    body: "{}",
  });
}

function setup(updateResult: { data: unknown; error: unknown } = { data: [{ id: "p1" }], error: null }) {
  const { client, calls } = fakeSupabase({
    proposals: { select: { data: PROPOSAL, error: null }, update: updateResult },
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
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("stripe webhook", () => {
  it("rejects a request with no signature header", async () => {
    setup();
    const res = await POST(request(false));
    expect(res.status).toBe(400);
  });

  it("rejects a bad signature", async () => {
    setup();
    h.constructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });
    const res = await POST(request());
    expect(res.status).toBe(400);
  });

  it("ignores events other than checkout.session.completed", async () => {
    const calls = setup();
    h.constructEvent.mockReturnValue({ type: "charge.refunded", data: { object: {} } });
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(0);
  });

  it("does not mark paid while the payment is still unpaid", async () => {
    const calls = setup();
    h.constructEvent.mockReturnValue(completedEvent({ payment_status: "unpaid" }));
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(updates(calls)).toHaveLength(0);
    expect(h.sendClientConfirmationEmail).not.toHaveBeenCalled();
  });

  it("does not mark paid when the amount doesn't match the proposal", async () => {
    const calls = setup();
    h.constructEvent.mockReturnValue(completedEvent({ amount_total: 100 }));
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(updates(calls)).toHaveLength(0);
    expect(h.sendClientConfirmationEmail).not.toHaveBeenCalled();
  });

  it("does not mark paid when the currency is wrong", async () => {
    const calls = setup();
    h.constructEvent.mockReturnValue(completedEvent({ currency: "eur" }));
    await POST(request());
    expect(updates(calls)).toHaveLength(0);
  });

  it("marks a signed proposal paid, conditional on it still being signed, and emails both sides", async () => {
    const calls = setup();
    h.constructEvent.mockReturnValue(completedEvent());

    const res = await POST(request());

    expect(res.status).toBe(200);
    const [update] = updates(calls);
    expect(update.payload).toMatchObject({ status: "paid" });
    expect(update.filters).toContainEqual({ kind: "eq", col: "id", val: "p1" });
    expect(update.filters).toContainEqual({ kind: "eq", col: "status", val: "signed" });
    expect(h.sendPaymentReceivedEmail).toHaveBeenCalledTimes(1);
    expect(h.sendClientConfirmationEmail).toHaveBeenCalledTimes(1);
  });

  it("does nothing on a duplicate delivery (update matched no rows)", async () => {
    setup({ data: [], error: null });
    h.constructEvent.mockReturnValue(completedEvent());

    const res = await POST(request());

    expect(res.status).toBe(200);
    expect(h.sendPaymentReceivedEmail).not.toHaveBeenCalled();
    expect(h.sendClientConfirmationEmail).not.toHaveBeenCalled();
  });

  it("returns 500 on a database error so Stripe retries", async () => {
    setup({ data: null, error: { message: "db down" } });
    h.constructEvent.mockReturnValue(completedEvent());
    const res = await POST(request());
    expect(res.status).toBe(500);
  });

  it("still answers 200 when an email fails to send", async () => {
    setup();
    h.constructEvent.mockReturnValue(completedEvent());
    h.sendClientConfirmationEmail.mockRejectedValue(new Error("resend down"));
    const res = await POST(request());
    expect(res.status).toBe(200);
  });
});
