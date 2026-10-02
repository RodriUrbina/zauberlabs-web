import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { feedUrl, getBlog, SITE_URL, tagUrl } from "@/lib/blog";
import { dictionaries, isLocale, LOCALES, type Locale } from "@/lib/i18n";
import BlogListing from "@/components/blog/BlogListing";

export const dynamicParams = false;

export function generateStaticParams() {
  const blog = getBlog();
  return LOCALES.flatMap((lang) => blog.listTags(lang).map((t) => ({ lang, tag: t.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; tag: string }> }): Promise<Metadata> {
  const { lang, tag: slug } = await params;
  if (!isLocale(lang)) return {};
  const tag = getBlog().getTag(lang, slug);
  if (!tag) return {};
  const t = dictionaries[lang].blog;
  const title = `${t.tagTitle(tag.name)} — Zauberlabs`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: t.tagMetaDescription(tag.name),
    alternates: {
      canonical: tagUrl(lang, tag.name),
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l, tagUrl(l, tag.name)])), "x-default": tagUrl("en", tag.name) },
      types: { "application/rss+xml": feedUrl(lang) },
    },
    openGraph: { title, description: t.tagMetaDescription(tag.name), url: tagUrl(lang, tag.name), type: "website", locale: lang === "de" ? "de_DE" : "en_US", images: ["/images/hero.jpg"] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function TagPage({ params }: { params: Promise<{ lang: string; tag: string }> }) {
  const { lang, tag: slug } = await params;
  if (!isLocale(lang)) notFound();
  const blog = getBlog();
  const tag = blog.getTag(lang, slug);
  if (!tag) notFound();
  return <BlogListing lang={lang as Locale} items={blog.listPosts(lang, { tag: tag.name })} tags={blog.listTags(lang)} activeTag={tag} />;
}
