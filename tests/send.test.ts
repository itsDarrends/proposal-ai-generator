import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, type Query } from "./helpers/fake-supabase";

const h = vi.hoisted(() => ({
  sendProposalToClientEmail: vi.fn(),
  userDb: null as unknown,
  serviceDb: null as unknown,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => h.userDb,
  createServiceClient: async () => h.serviceDb,
}));
vi.mock("@/lib/email", () => ({
  sendProposalToClientEmail: h.sendProposalToClientEmail,
}));

import { POST } from "@/app/api/proposals/[id]/send/route";

const params = { params: Promise.resolve({ id: "p1" }) };

function proposal(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    user_id: "u1",
    status: "draft",
    title: "Site Redesign",
    client_name: "Jenny",
    client_email: "jenny@acme.com",
    amount: 1200,
    expires_at: null,
    send_count: 0,
    last_sent_at: null,
    ...overrides,
  };
}

interface Setup {
  user?: boolean;
  proposal?: Record<string, unknown> | null;
  claimRows?: unknown[];
}

function setup(opts: Setup = {}) {
  const user = fakeSupabase({
    proposals: { select: { data: opts.proposal === null ? null : opts.proposal ?? proposal(), error: null } },
  });
  user.client.auth.getUser = async () =>
    ({ data: { user: opts.user === false ? null : { id: "u1", email: "me@creator.com" } } }) as never;

  const service = fakeSupabase({
    proposals: {
      // The claim is the update filtered on send_count; everything else just succeeds.
      update: (q: Query) =>
        q.filters.some((f) => f.col === "send_count")
          ? { data: opts.claimRows ?? [{ id: "p1" }], error: null }
          : { data: [{ id: "p1" }], error: null },
    },
    profiles: { select: { data: { company_name: "Acme Design" }, error: null } },
  });

  h.userDb = user.client;
  h.serviceDb = service.client;
  return { service: service.calls };
}

const updates = (calls: Query[]) => calls.filter((c) => c.op === "update");
const send = (body?: unknown) =>
  POST(
    new Request("http://localhost/api/proposals/p1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    params
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("EMAIL_DNS_CHECK", "off");
  h.sendProposalToClientEmail.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/proposals/[id]/send", () => {
  it("requires a signed-in user", async () => {
    setup({ user: false });
    expect((await send()).status).toBe(401);
    expect(h.sendProposalToClientEmail).not.toHaveBeenCalled();
  });

  it("404s for a proposal the user doesn't own", async () => {
    setup({ proposal: null });
    expect((await send()).status).toBe(404);
  });

  it.each(["signed", "paid"])("won't email a proposal that is already %s", async (status) => {
    setup({ proposal: proposal({ status }) });
    expect((await send()).status).toBe(409);
    expect(h.sendProposalToClientEmail).not.toHaveBeenCalled();
  });

  it("won't email an expired proposal", async () => {
    setup({ proposal: proposal({ expires_at: "2000-01-01T00:00:00Z" }) });
    expect((await send()).status).toBe(409);
  });

  it("re-validates the saved address and refuses a typo, suggesting the fix", async () => {
    const { service } = setup({ proposal: proposal({ client_email: "jenny@gmial.com" }) });
    const res = await send();
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ suggestion: "jenny@gmail.com" });
    expect(h.sendProposalToClientEmail).not.toHaveBeenCalled();
    expect(updates(service)).toHaveLength(0);
  });

  it("stops at the per-proposal cap", async () => {
    setup({ proposal: proposal({ send_count: 5 }) });
    expect((await send()).status).toBe(429);
    expect(h.sendProposalToClientEmail).not.toHaveBeenCalled();
  });

  it("enforces a cooldown between sends and says how long to wait", async () => {
    setup({ proposal: proposal({ send_count: 1, last_sent_at: new Date(Date.now() - 10_000).toISOString() }) });
    const res = await send();
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(h.sendProposalToClientEmail).not.toHaveBeenCalled();
  });

  it("allows another send once the cooldown has passed", async () => {
    setup({ proposal: proposal({ send_count: 1, last_sent_at: new Date(Date.now() - 120_000).toISOString() }) });
    expect((await send()).status).toBe(200);
  });

  it("doesn't send twice when a second click races the first (claim matches no rows)", async () => {
    setup({ claimRows: [] });
    const res = await send();
    expect(res.status).toBe(409);
    expect(h.sendProposalToClientEmail).not.toHaveBeenCalled();
  });

  it("claims the send, emails the saved address with Reply-To set to the creator, then marks it sent", async () => {
    const { service } = setup();
    const res = await send();

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, sentTo: "jenny@acme.com" });

    const [claim, promote] = updates(service);
    expect(claim.payload).toMatchObject({ send_count: 1 });
    expect(claim.filters).toContainEqual({ kind: "eq", col: "send_count", val: 0 });

    expect(h.sendProposalToClientEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        clientEmail: "jenny@acme.com",
        replyTo: "me@creator.com",
        senderName: "Acme Design",
        proposalTitle: "Site Redesign",
      })
    );

    expect(promote.payload).toMatchObject({ status: "sent" });
    expect(promote.filters).toContainEqual({ kind: "eq", col: "status", val: "draft" });
  });

  it("ignores any recipient in the request body", async () => {
    setup();
    await send({ to: "victim@elsewhere.com", clientEmail: "victim@elsewhere.com" });
    expect(h.sendProposalToClientEmail).toHaveBeenCalledWith(
      expect.objectContaining({ clientEmail: "jenny@acme.com" })
    );
  });

  it("rolls the claim back and reports a clear error if the email can't be delivered", async () => {
    const { service } = setup({ proposal: proposal({ send_count: 2, last_sent_at: "2026-01-01T00:00:00.000Z" }) });
    h.sendProposalToClientEmail.mockRejectedValue(new Error("Resend rejected the email"));

    const res = await send();

    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/verified a sending domain/i);
    const [claim, rollback, ...rest] = updates(service);
    expect(claim.payload).toMatchObject({ send_count: 3 });
    expect(rollback.payload).toEqual({ last_sent_at: "2026-01-01T00:00:00.000Z", send_count: 2 });
    // and it must not promote the status as if it had been sent
    expect(rest).toHaveLength(0);
  });
});
