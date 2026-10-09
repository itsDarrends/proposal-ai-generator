/**
 * Run side effects (emails) concurrently without letting them stall a request.
 * Failures are logged, never thrown. On serverless a floating promise can be
 * killed once the response is sent, so we wait - but only up to `ms`.
 */
export async function settleWithin(tasks: Promise<unknown>[], ms = 4000): Promise<void> {
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, ms));
  const all = Promise.allSettled(tasks).then((results) => {
    for (const r of results) {
      if (r.status === "rejected") console.error("[side effect failed]", r.reason);
    }
  });
  await Promise.race([all, timeout]);
}
