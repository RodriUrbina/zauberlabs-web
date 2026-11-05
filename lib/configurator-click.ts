import { ABOUT_SLUG } from "./about";

/**
 * BL-050 — which configurator a link points to, for the "configurator_click" analytics event.
 * Matched by host only, so every link to a configurator counts (header button, hero, garage panel,
 * article CTA, inline article links, footer) and nothing from the link's URL itself (path, query) is sent.
 * BL-116 (PO 2026-11-05): the event also says on which of our pages (`from`) and where on it (`place`) the link was clicked,
 * so the PO can see which articles send visitors to E46BUILD. Nothing about the person.
 */
export const CONFIGURATOR_CLICK_EVENT = "configurator_click";

/**
 * BL-116 — the page a click happened on, without the language, query or hash: "home", "blog/<slug>", "blog/tag/<tag>", "about",
 * "shop", "datenschutz" … The German About path counts as "about", so both languages add up. Anything that is not a plain
 * path of our own (odd characters, very long, deep) becomes "other", so a typed-in address never reaches the statistics.
 */
export function clickFrom(pathname: string): string {
  const parts = pathname.split(/[?#]/)[0].split("/").filter(Boolean);
  if (parts[0] === "en" || parts[0] === "de") parts.shift();
  if (parts.length === 0) return "home";
  if (parts[0] === ABOUT_SLUG.de) parts[0] = ABOUT_SLUG.en;
  if (parts.length > 3 || parts.some((p) => !/^[a-z0-9-]{1,80}$/.test(p))) return "other";
  return parts.join("/");
}

/** BL-116 — the slots a configurator link can sit in. Marked with data-click-place; header and footer are found by their element. */
export const CLICK_PLACES = ["header", "hero", "closer-look", "vote", "blog-teaser", "sticky-bar", "article-cta", "inline", "footer"] as const;
export type ClickPlace = (typeof CLICK_PLACES)[number];

type Closest = { closest(selector: string): { getAttribute(name: string): string | null } | null };

/** BL-116 — where on the page the clicked link sits; only values from CLICK_PLACES (or "other") are ever sent. */
export function clickPlace(link: Closest): ClickPlace | "other" {
  const marked = link.closest("[data-click-place]")?.getAttribute("data-click-place");
  if (marked && (CLICK_PLACES as readonly string[]).includes(marked)) return marked as ClickPlace;
  if (link.closest("footer")) return "footer";
  if (link.closest("header")) return "header";
  return "other";
}

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
