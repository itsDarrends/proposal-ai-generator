import { z } from "zod";

const MAX_SECTION_LENGTH = 20_000;

// Models occasionally return a bullet list as an array instead of one string.
const section = z.preprocess(
  (v) => (Array.isArray(v) ? v.map(String).join("\n") : v),
  z.string().trim().min(1).max(MAX_SECTION_LENGTH)
);

/** The nine sections of a proposal. Shared by AI output validation and the PATCH endpoint. */
export const proposalContentSchema = z.strictObject({
  executiveSummary: section,
  problemStatement: section,
  proposedSolution: section,
  scopeOfWork: section,
  timeline: section,
  investment: section,
  whyUs: section,
  termsAndConditions: section,
  nextSteps: section,
});

export const proposalStatusSchema = z.enum(["draft", "sent", "viewed", "signed", "paid"]);

export const patchProposalSchema = z
  .strictObject({
    content: proposalContentSchema.optional(),
    status: proposalStatusSchema.optional(),
  })
  .refine((v) => v.content !== undefined || v.status !== undefined, {
    message: "Nothing to update",
  });
