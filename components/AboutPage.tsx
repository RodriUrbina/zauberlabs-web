import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/blog";
import { ABOUT_DESCRIPTION, ABOUT_HEADLINE, ABOUT_TITLE, aboutPath } from "@/lib/about";
import { dictionaries, isLocale, LOCALES, type Locale } from "@/lib/i18n";
import { SITE_OG_IMAGE } from "@/lib/blog-og";
import BlogHeader from "@/components/blog/BlogHeader";
import AboutContent from "@/components/AboutContent";
import SiteFooter from "@/components/SiteFooter";
import Title from "@/components/Title";

/** BL-108 — shared by app/[lang]/about (English only) and app/[lang]/ueber-uns (German only); the other combinations are 404s. */
export function aboutMetadata(lang: string, only: Locale): Metadata {
  if (lang !== only) return {};
  return {
    metadataBase: new URL(SITE_URL),
    title: ABOUT_TITLE[only],
    description: ABOUT_DESCRIPTION[only],
    alternates: { canonical: `${SITE_URL}${aboutPath(only)}`, languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}${aboutPath(l)}`])) },
    openGraph: { title: ABOUT_TITLE[only], description: ABOUT_DESCRIPTION[only], url: `${SITE_URL}${aboutPath(only)}`, locale: only === "de" ? "de_DE" : "en_US", type: "website",
      // T-286 (PO 2026-11-10): the site's share image too (this openGraph replaces the layout's, so it had none); own title and description.
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: dictionaries[only].hero.ogAlt }] },
  };
}

export default function AboutPage({ lang, only }: { lang: string; only: Locale }) {
  if (!isLocale(lang) || lang !== only) notFound();
  const other: Locale = lang === "de" ? "en" : "de";
  return (
    <div className="min-h-screen">
      {/* PO 2026-11-04: no "Blog" label next to the logo on the About page. */}
      <BlogHeader lang={lang} otherHref={aboutPath(other)} blogLabel={false} />
      <main className="mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20">
        <article className="mx-auto flex w-full max-w-[760px] flex-col gap-8 py-10 md:py-16">
          <Title as="h1" lead={ABOUT_HEADLINE[lang][0]} accent={ABOUT_HEADLINE[lang][1]} className="text-[34px] leading-[1.02] font-extrabold tracking-[-0.035em] text-ink md:text-[52px]" />
          <div className="prose prose-zl prose-lg max-w-none">
            <AboutContent lang={lang} />
          </div>
        </article>
      </main>
      <SiteFooter lang={lang} otherHref={aboutPath(other)} homePath={`/${lang}`} />
    </div>
  );
}
