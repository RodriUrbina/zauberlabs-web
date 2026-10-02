import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogUrl, feedUrl, getBlog, SITE_URL } from "@/lib/blog";
import { dictionaries, isLocale, LOCALES, type Locale } from "@/lib/i18n";
import BlogListing from "@/components/blog/BlogListing";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = dictionaries[lang].blog;
  return {
    metadataBase: new URL(SITE_URL),
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: blogUrl(lang),
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l, blogUrl(l)])), "x-default": blogUrl("en") },
      types: { "application/rss+xml": feedUrl(lang) },
    },
    openGraph: { title: t.metaTitle, description: t.metaDescription, url: blogUrl(lang), type: "website", locale: lang === "de" ? "de_DE" : "en_US", images: ["/images/hero.jpg"] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const blog = getBlog();
  return <BlogListing lang={lang as Locale} items={blog.listPosts(lang)} tags={blog.listTags(lang)} />;
}
