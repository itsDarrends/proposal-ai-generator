import { beforeEach, describe, expect, it, vi } from "vitest";

const dnsMock = vi.hoisted(() => ({
  resolveMx: vi.fn(),
  resolve4: vi.fn(),
}));

vi.mock("node:dns", () => ({
  promises: { resolveMx: dnsMock.resolveMx, resolve4: dnsMock.resolve4 },
}));

import { checkClientEmail, editDistance, suggestDomain } from "@/lib/email-validation";

const dnsError = (code: string) => Object.assign(new Error(code), { code });

beforeEach(() => {
  vi.clearAllMocks();
  dnsMock.resolveMx.mockResolvedValue([{ exchange: "mx.example.net", priority: 10 }]);
  dnsMock.resolve4.mockResolvedValue(["203.0.113.5"]);
});

describe("editDistance", () => {
  it("counts a swapped pair of letters as one edit", () => {
    expect(editDistance("gmial.com", "gmail.com")).toBe(1);
  });
  it("counts inserts, deletes and replacements", () => {
    expect(editDistance("gmal.com", "gmail.com")).toBe(1);
    expect(editDistance("gmail.con", "gmail.com")).toBe(1);
    expect(editDistance("yahoo.com", "gmail.com")).toBeGreaterThan(1);
  });
});

describe("suggestDomain", () => {
  it.each([
    ["gmial.com", "gmail.com"],
    ["gmal.com", "gmail.com"],
    ["gmail.con", "gmail.com"],
    ["yaho.com", "yahoo.com"],
    ["hotmial.com", "hotmail.com"],
    ["outlok.com", "outlook.com"],
  ])("suggests %s -> %s", (typo, fixed) => {
    expect(suggestDomain(typo)).toBe(fixed);
  });

  it.each(["gmail.com", "yahoo.com", "company.com", "email.com", "mail.com", "gmx.com", "acme.io"])(
    "leaves %s alone",
    (domain) => {
      expect(suggestDomain(domain)).toBeNull();
    }
  );
});

describe("checkClientEmail", () => {
  it.each(["", "plainaddress", "a@b", "a b@example.com", "@example.com", "jane@", "jane@@example.com"])(
    "rejects malformed address %j",
    async (bad) => {
      const r = await checkClientEmail(bad);
      expect(r).toMatchObject({ ok: false, reason: "format" });
    }
  );

  it("rejects over-long addresses", async () => {
    const r = await checkClientEmail(`${"a".repeat(70)}@example.com`);
    expect(r).toMatchObject({ ok: false, reason: "format" });
  });

  it("trims and lower-cases a good address", async () => {
    const r = await checkClientEmail("  Jane.Smith@Acme.COM ");
    expect(r).toEqual({ ok: true, email: "jane.smith@acme.com" });
  });

  it("catches a typo'd popular domain and offers the fix", async () => {
    const r = await checkClientEmail("jane@gmial.com");
    expect(r).toMatchObject({ ok: false, reason: "typo", suggestion: "jane@gmail.com" });
    // a typo domain usually still has mail servers, so this must not rely on DNS
    expect(dnsMock.resolveMx).not.toHaveBeenCalled();
  });

  it("blocks throwaway-mail domains", async () => {
    const r = await checkClientEmail("someone@mailinator.com");
    expect(r).toMatchObject({ ok: false, reason: "disposable" });
  });

  it("accepts a domain with mail servers", async () => {
    const r = await checkClientEmail("jane@acme.com");
    expect(r.ok).toBe(true);
  });

  it("rejects a domain that doesn't exist", async () => {
    dnsMock.resolveMx.mockRejectedValue(dnsError("ENOTFOUND"));
    dnsMock.resolve4.mockRejectedValue(dnsError("ENOTFOUND"));
    const r = await checkClientEmail("jane@no-such-domain-xyz.com");
    expect(r).toMatchObject({ ok: false, reason: "no-mail-server" });
  });

  it("rejects a domain that publishes a null MX (accepts no mail)", async () => {
    dnsMock.resolveMx.mockResolvedValue([{ exchange: "", priority: 0 }]);
    const r = await checkClientEmail("jane@example.com");
    expect(r).toMatchObject({ ok: false, reason: "no-mail-server" });
  });

  it("falls back to the A record when there is no MX record", async () => {
    dnsMock.resolveMx.mockRejectedValue(dnsError("ENODATA"));
    dnsMock.resolve4.mockResolvedValue(["203.0.113.9"]);
    const r = await checkClientEmail("jane@small-site.com");
    expect(r.ok).toBe(true);
  });

  it("never blocks on a flaky DNS lookup (timeout or server failure)", async () => {
    dnsMock.resolveMx.mockRejectedValue(dnsError("ESERVFAIL"));
    expect((await checkClientEmail("jane@acme.com")).ok).toBe(true);

    dnsMock.resolveMx.mockRejectedValue(dnsError("ETIMEOUT"));
    expect((await checkClientEmail("jane@acme.com")).ok).toBe(true);
  });

  it("skips DNS entirely when the check is turned off", async () => {
    dnsMock.resolveMx.mockRejectedValue(dnsError("ENOTFOUND"));
    const r = await checkClientEmail("jane@whatever.test", { dnsCheck: false });
    expect(r.ok).toBe(true);
    expect(dnsMock.resolveMx).not.toHaveBeenCalled();
  });
});
