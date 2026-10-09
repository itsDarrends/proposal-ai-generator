import type { ProposalStatus } from "@/lib/supabase/types";

/** Once a proposal is signed or paid it is a record of an agreement and must not change. */
export const IMMUTABLE_STATUSES: readonly ProposalStatus[] = ["signed", "paid"];

/** Statuses a client may sign from. A draft that nobody has opened can't be signed. */
export const SIGNABLE_STATUSES: readonly ProposalStatus[] = ["sent", "viewed"];

/** Statuses a client's first visit promotes to "viewed". */
export const PROMOTED_ON_VIEW: readonly ProposalStatus[] = ["draft", "sent"];

/**
 * Status changes the creator may make themselves (via PATCH). Everything else
 * (viewed, signed, paid) is set only by the client-facing flows and Stripe.
 */
export const OWNER_TRANSITIONS: Record<ProposalStatus, readonly ProposalStatus[]> = {
  draft: ["sent"],
  sent: ["draft"],
  viewed: [],
  signed: [],
  paid: [],
};

export function isImmutable(status: ProposalStatus): boolean {
  return IMMUTABLE_STATUSES.includes(status);
}

export function canSign(status: ProposalStatus): boolean {
  return SIGNABLE_STATUSES.includes(status);
}

export function canOwnerTransition(from: ProposalStatus, to: ProposalStatus): boolean {
  return from === to || OWNER_TRANSITIONS[from].includes(to);
}
