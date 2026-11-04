import type { Locale } from "./i18n";

/**
 * BL-108 (PO 2026-11-04) — the About page: /en/about and /de/ueber-uns. Each language has its own path, so the language switch,
 * hreflang, canonical, sitemap and the footer "About" link all take it from here. The page text lives in components/AboutContent.tsx
 * (PO-approved copy, word for word).
 */
export const ABOUT_SLUG: Record<Locale, string> = { en: "about", de: "ueber-uns" };
export const aboutPath = (lang: Locale) => `/${lang}/${ABOUT_SLUG[lang]}`;

export const ABOUT_TITLE: Record<Locale, string> = { en: "About zauberlabs", de: "Über zauberlabs" };
/** The h1 like the homepage headlines (PO 2026-11-04): first part black, second in the accent serif. */
export const ABOUT_HEADLINE: Record<Locale, [string, string]> = { en: ["About ", "zauberlabs"], de: ["Über ", "zauberlabs"] };
/** Meta description: the page's own second sentence. */
export const ABOUT_DESCRIPTION: Record<Locale, string> = {
  en: "zauberlabs makes configurators for modern classics: the cars people still drive and love every day.",
  de: "zauberlabs baut Konfiguratoren für moderne Klassiker: die Autos, die viele noch jeden Tag fahren und lieben.",
};

/** Doug DeMuro's E46 M3 Touring review: linked at the timestamp, opened in a new tab, never embedded (no YouTube iframe or cookies). */
export const DEMURO_VIDEO = "https://www.youtube.com/watch?v=fmw_yxxcdPw";
export const demuroAt = (seconds: number) => `${DEMURO_VIDEO}&t=${seconds}s`;
