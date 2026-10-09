import { promises as dns } from "node:dns";
import { z } from "zod";

/**
 * Validation for a client's email address before we store it or send to it.
 *
 * No check can prove a mailbox exists short of sending to it, so this catches the
 * mistakes that actually happen: malformed addresses, typo'd popular domains
 * (gmial.com), throwaway-mail domains, and domains that can't receive mail at all.
 * Genuine bounces still need handling at the mail provider.
 */

export type EmailCheck =
  | { ok: true; email: string }
  | {
      ok: false;
      reason: "format" | "typo" | "disposable" | "no-mail-server";
      message: string;
      suggestion?: string;
    };

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

// Only big, unambiguous providers: a short list keeps false "did you mean" hits rare.
const POPULAR_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "live.com",
];

// Real providers that happen to sit one edit away from a popular domain (mail.com is one
// letter off gmail.com). Never flag these as typos, or real clients get rejected.
const KNOWN_REAL_DOMAINS = new Set([
  ...POPULAR_DOMAINS,
  "mail.com",
  "email.com",
  "gmx.com",
  "gmx.net",
  "googlemail.com",
  "ymail.com",
  "rocketmail.com",
  "me.com",
  "mac.com",
  "msn.com",
  "zoho.com",
  "hey.com",
  "fastmail.com",
  "protonmail.com",
  "pm.me",
  "yandex.com",
  "comcast.net",
  "att.net",
  "verizon.net",
  "sbcglobal.net",
]);

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "throwawaymail.com",
  "dispostable.com",
  "maildrop.cc",
]);

/** Edit distance where swapping two adjacent letters counts as one edit (gmial -> gmail). */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => {
    const row = new Array<number>(b.length + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= b.length; j++) d[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** The popular domain this one is probably a typo of, or null. */
export function suggestDomain(domain: string): string | null {
  if (KNOWN_REAL_DOMAINS.has(domain) || domain.length < 5) return null;
  for (const popular of POPULAR_DOMAINS) {
    if (editDistance(domain, popular) === 1) return popular;
  }
  return null;
}

const DNS_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error("dns timeout"), { code: "ETIMEOUT" })), ms);
    promise.then(
      (v) => (clearTimeout(timer), resolve(v)),
      (e) => (clearTimeout(timer), reject(e))
    );
  });
}

const NO_RECORD = new Set(["ENOTFOUND", "ENODATA"]);

/**
 * true  = the domain can receive mail
 * false = it definitely can't (no such domain, or it publishes a "null MX")
 * null  = couldn't tell (DNS timeout or error): never block a user over a flaky lookup
 */
async function domainAcceptsMail(domain: string): Promise<boolean | null> {
  try {
    const records = await withTimeout(dns.resolveMx(domain), DNS_TIMEOUT_MS);
    if (records.length > 0) {
      // RFC 7505: a lone "." MX means "this domain accepts no mail".
      return records.some((r) => r.exchange && r.exchange !== ".");
    }
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (!code || !NO_RECORD.has(code)) return null;
  }

  // No MX record: RFC 5321 says mail falls back to the domain's own A record.
  try {
    const addresses = await withTimeout(dns.resolve4(domain), DNS_TIMEOUT_MS);
    return addresses.length > 0;
  } catch (err) {
    const code = (err as { code?: string }).code;
    return code && NO_RECORD.has(code) ? false : null;
  }
}

export async function checkClientEmail(
  raw: string,
  options: { dnsCheck?: boolean } = {}
): Promise<EmailCheck> {
  const dnsCheck = options.dnsCheck ?? process.env.EMAIL_DNS_CHECK !== "off";

  const parsed = emailSchema.safeParse(raw);
  const looksValid =
    parsed.success && parsed.data.split("@")[0].length <= 64 && parsed.data.split("@")[1].includes(".");
  if (!parsed.success || !looksValid) {
    return { ok: false, reason: "format", message: "That doesn't look like a valid email address." };
  }

  const email = parsed.data;
  const domain = email.split("@")[1];

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      reason: "disposable",
      message: "Throwaway email addresses can't be used. Please use the client's real address.",
    };
  }

  const suggestedDomain = suggestDomain(domain);
  if (suggestedDomain) {
    const suggestion = `${email.split("@")[0]}@${suggestedDomain}`;
    return {
      ok: false,
      reason: "typo",
      suggestion,
      message: `That email looks like a typo. Did you mean ${suggestion}?`,
    };
  }

  if (dnsCheck && (await domainAcceptsMail(domain)) === false) {
    return {
      ok: false,
      reason: "no-mail-server",
      message: `${domain} can't receive email. Check the address for a typo.`,
    };
  }

  return { ok: true, email };
}
