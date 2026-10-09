/**
 * Mock payments skip Stripe entirely, so they are for local development only.
 * They stay off in production builds even if MOCK_PAYMENT=true is set there.
 */
export function isMockPaymentEnabled(): boolean {
  return process.env.MOCK_PAYMENT === "true" && process.env.NODE_ENV !== "production";
}
