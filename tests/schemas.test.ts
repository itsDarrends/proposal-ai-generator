import { describe, expect, it } from "vitest";
import { patchProposalSchema, proposalContentSchema } from "@/lib/schemas";

const validContent = {
  executiveSummary: "a",
  problemStatement: "b",
  proposedSolution: "c",
  scopeOfWork: "- d",
  timeline: "e",
  investment: "f",
  whyUs: "g",
  termsAndConditions: "h",
  nextSteps: "i",
};

describe("proposalContentSchema", () => {
  it("accepts all nine sections", () => {
    expect(proposalContentSchema.safeParse(validContent).success).toBe(true);
  });

  it("rejects a missing section", () => {
    const rest: Partial<typeof validContent> = { ...validContent };
    delete rest.nextSteps;
    expect(proposalContentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty and non-string sections", () => {
    expect(proposalContentSchema.safeParse({ ...validContent, timeline: "  " }).success).toBe(false);
    expect(proposalContentSchema.safeParse({ ...validContent, timeline: 42 }).success).toBe(false);
  });

  it("rejects unknown extra keys", () => {
    expect(proposalContentSchema.safeParse({ ...validContent, isAdmin: true }).success).toBe(false);
  });

  it("rejects absurdly long sections", () => {
    expect(
      proposalContentSchema.safeParse({ ...validContent, whyUs: "x".repeat(20_001) }).success
    ).toBe(false);
  });

  it("joins a model's bullet array into one string", () => {
    const parsed = proposalContentSchema.parse({ ...validContent, scopeOfWork: ["- one", "- two"] });
    expect(parsed.scopeOfWork).toBe("- one\n- two");
  });
});

describe("patchProposalSchema", () => {
  it("accepts content, status, or both", () => {
    expect(patchProposalSchema.safeParse({ content: validContent }).success).toBe(true);
    expect(patchProposalSchema.safeParse({ status: "sent" }).success).toBe(true);
    expect(patchProposalSchema.safeParse({ content: validContent, status: "sent" }).success).toBe(true);
  });

  it("rejects an empty body", () => {
    expect(patchProposalSchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid statuses and fields the API never allows", () => {
    expect(patchProposalSchema.safeParse({ status: "refunded" }).success).toBe(false);
    expect(patchProposalSchema.safeParse({ amount: 1 }).success).toBe(false);
    expect(patchProposalSchema.safeParse({ user_id: "x", status: "sent" }).success).toBe(false);
  });
});
