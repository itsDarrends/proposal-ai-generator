// Link-preview unfurlers, crawlers and scripted clients. They fetch shared links
// without a person ever reading the proposal, so they must not count as views.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|unfurl|facebookexternalhit|whatsapp|telegram|slack|discord|linkedin|skype|embedly|headless|lighthouse|pingdom|uptime|monitor|curl\/|wget\/|python-requests|node-fetch|undici|axios|go-http-client|java\//i;

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}
