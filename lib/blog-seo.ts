/**
 * BL-149 (PO 2026-11-26) — an article's titles for the <head>: the browser tab (<title>, with " — zauberlabs") and the share
 * title (og:title, twitter:title, without the suffix, as before). Front matter `seoTitle`, when set, replaces `title` there and
 * only there; " — zauberlabs" is not added twice when the seoTitle already ends with "zauberlabs". Without a seoTitle both are
 * exactly what they were before BL-149.
 */
export function articleHeadTitles(meta: { title: string; seoTitle?: string }): { document: string; social: string } {
  if (!meta.seoTitle) return { document: `${meta.title} — zauberlabs`, social: meta.title };
  const seo = meta.seoTitle.trim();
  return { document: /zauberlabs\s*$/i.test(seo) ? seo : `${seo} — zauberlabs`, social: seo };
}
