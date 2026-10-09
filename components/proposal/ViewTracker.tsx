"use client";

import { useEffect } from "react";

/**
 * Records a view from the visitor's browser, once per tab session.
 *
 * This replaces a server-side fetch that ran on every render of the proposal page,
 * which counted link-preview bots and every refresh. Bots that don't run JavaScript
 * never reach this, and the API also filters bot user agents and the creator.
 */
export function ViewTracker({ proposalId }: { proposalId: string }) {
  useEffect(() => {
    const key = `proposal-viewed:${proposalId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked (private mode): still record, just can't dedupe.
    }

    fetch(`/api/proposals/${proposalId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [proposalId]);

  return null;
}
