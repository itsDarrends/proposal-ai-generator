import { describe, expect, it } from "vitest";
import {
  canOwnerTransition,
  canSign,
  isImmutable,
  OWNER_TRANSITIONS,
  PROMOTED_ON_VIEW,
} from "@/lib/proposal-rules";
import type { ProposalStatus } from "@/lib/supabase/types";

const ALL: ProposalStatus[] = ["draft", "sent", "viewed", "signed", "paid"];

describe("isImmutable", () => {
  it("locks signed and paid proposals only", () => {
    expect(ALL.filter(isImmutable)).toEqual(["signed", "paid"]);
  });
});

describe("canSign", () => {
  it("allows sent and viewed, never drafts or finished proposals", () => {
    expect(ALL.filter(canSign)).toEqual(["sent", "viewed"]);
  });
});

describe("canOwnerTransition", () => {
  it("lets the owner mark a draft as sent and take it back", () => {
    expect(canOwnerTransition("draft", "sent")).toBe(true);
    expect(canOwnerTransition("sent", "draft")).toBe(true);
  });

  it("allows a no-op (same status)", () => {
    for (const s of ALL) expect(canOwnerTransition(s, s)).toBe(true);
  });

  it("never lets the owner set viewed, signed or paid themselves", () => {
    for (const from of ALL) {
      for (const to of ["viewed", "signed", "paid"] as ProposalStatus[]) {
        if (from !== to) expect(canOwnerTransition(from, to)).toBe(false);
      }
    }
  });

  it("offers no way out of viewed, signed or paid", () => {
    for (const from of ["viewed", "signed", "paid"] as ProposalStatus[]) {
      expect(OWNER_TRANSITIONS[from]).toEqual([]);
    }
  });
});

describe("PROMOTED_ON_VIEW", () => {
  it("only promotes proposals that haven't been signed", () => {
    expect([...PROMOTED_ON_VIEW]).toEqual(["draft", "sent"]);
  });
});
