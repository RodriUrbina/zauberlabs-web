/**
 * BL-119 (PO 2026-11-06) — count visits that arrive from our Instagram profile: a page opened with ?from=instagram sends one
 * Vercel Web Analytics custom event "visit_from" { from: "instagram", page } (Datenschutz Abschnitt 5). BL-128: also from=pdf,
 * reddit, email and whatsapp (VISIT_SOURCES); any other from= value, and every other parameter, is ignored.
 *
 * "Once per visit" without storing anything in the browser (Datenschutz § 5/§ 6 say we store nothing there, and § 25 TDDDG
 * would ask for consent): the event fires on a full page load only, and not when the visitor came from one of our own pages.
 * So /links → an article (a new page load, referrer zauberlabs.de) is not counted twice, and client-side navigations never
 * re-run it. A reload of the landing page can count again; that is the accepted cost of storing nothing.
 */
export const VISIT_FROM_EVENT = "visit_from";
/** BL-128 (PO 2026-11-10): the sources of the links we hand out; only these values are ever recorded. */
export const VISIT_SOURCES = ["instagram", "pdf", "reddit", "email", "whatsapp"] as const;
export type VisitSource = (typeof VISIT_SOURCES)[number];

const isSource = (v: string | null): v is VisitSource => v !== null && (VISIT_SOURCES as readonly string[]).includes(v);

export function visitFrom(search: string, pathname: string, referrer: string, ownHost: string): { from: VisitSource; page: string } | null {
  const from = new URLSearchParams(search).get("from");
  if (!isSource(from)) return null;
  try {
    if (referrer && new URL(referrer).host === ownHost) return null;
  } catch {
    // an unreadable referrer counts as "not ours"
  }
  const page = /^\/[a-z0-9\-/]{0,160}$/.test(pathname) ? pathname.replace(/(.)\/+$/, "$1") : "other";
  return { from, page };
}
