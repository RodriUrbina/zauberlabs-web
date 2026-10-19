/**
 * BL-050 — which configurator a link points to, for the "configurator_click" analytics event.
 * Matched by host only, so every link to a configurator counts (header button, hero card, garage card,
 * article CTA, inline article links, footer) and nothing from the URL itself (path, query) is sent.
 */
export const CONFIGURATOR_CLICK_EVENT = "configurator_click";

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
