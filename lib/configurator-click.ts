/**
 * BL-050 — which configurator a link points to, for the "configurator_click" analytics event.
 * Matched by host only, so every link to a configurator counts (header button, hero card, garage card,
 * article CTA, inline article links, footer) and nothing from the URL itself (path, query) is sent.
 */
export const CONFIGURATOR_CLICK_EVENT = "configurator_click";

/**
 * BL-095 — an E46BUILD start link (?start=<body> and/or ?section=<category>): each load can create a build there and its
 * robots.txt disallows them, so such links carry rel="nofollow" (as HomeHero/CloserLook do).
 */
export function isStartLink(href: string): boolean {
  try {
    const u = new URL(href);
    return u.searchParams.has("start") || u.searchParams.has("section");
  } catch {
    return false;
  }
}

/** Host → configurator id. Only ids from this map are ever sent. */
export function configuratorHosts(e46Url: string): Record<string, string> {
  try {
    return { [new URL(e46Url).host]: "e46" };
  } catch {
    return {};
  }
}

/** The configurator id for a link, or null when the link goes anywhere else. */
export function configuratorFor(href: string, hosts: Record<string, string>): string | null {
  try {
    return hosts[new URL(href).host] ?? null;
  } catch {
    return null;
  }
}
