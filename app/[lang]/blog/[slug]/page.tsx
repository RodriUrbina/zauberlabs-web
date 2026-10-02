import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import remarkCite from "@/lib/remark-cite";
import { blogUrl, feedUrl, formatDate, getBlog, postUrl, SITE_URL, tagSlug } from "@/lib/blog";
import { formatPublishMoment } from "@/lib/publish-time";
import { dictionaries, isLocale, LOCALES, type Locale } from "@/lib/i18n";
import BlogHeader from "@/components/blog/BlogHeader";
import ConfiguratorCta from "@/components/blog/ConfiguratorCta";
import HeroImage from "@/components/blog/HeroImage";
import JsonLd from "@/components/blog/JsonLd";
import LanguageNote from "@/components/blog/LanguageNote";
import SourcesBox from "@/components/blog/SourcesBox";
import { mdxComponents } from "@/components/blog/mdx-components";
import SiteFooter from "@/components/SiteFooter";

type Params = Promise<{ lang: string; slug: string }>;

// Scheduled publishing (BL-004): re-rendered on Vercel at most every 5 minutes, so an article whose
// publish moment has passed appears by itself; no deploy, cron or agent needed.
export const revalidate = 300;
// Slugs not built at deploy time (scheduled articles) render on demand once their moment has passed;
// before that, and for unknown slugs and production drafts, the page is a 404.
export const dynamicParams = true;

export function generateStaticParams() {
  const slugs = getBlog().slugs();
  return LOCALES.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const resolved = getBlog().getPost(slug, lang);
  if (!resolved) return {};
  const { post, fallback, available } = resolved;
  const m = post.meta;
  // A fallback page shows another language's text: its canonical is that language's URL.
  const canonical = m.canonical ?? postUrl(fallback ? post.lang : lang, slug);
  const languages: Record<string, string> = Object.fromEntries(available.map((l) => [l, postUrl(l, slug)]));
  languages["x-default"] = postUrl(available.includes("en") ? "en" : available[0], slug);
  const image = m.hero.src ?? "/images/hero.jpg";
  return {
    metadataBase: new URL(SITE_URL),
    title: `${m.title} — Zauberlabs`,
    description: m.description,
    authors: [{ name: m.author }],
    alternates: { canonical, languages, types: { "application/rss+xml": feedUrl(lang) } },
    robots: m.draft || resolved.scheduled ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: m.title,
      description: m.description,
      url: postUrl(lang, slug),
      locale: post.lang === "de" ? "de_DE" : "en_US",
      publishedTime: m.date,
      modifiedTime: m.updated ?? m.date,
      authors: [m.author],
      tags: m.tags,
      images: [{ url: image, alt: m.hero.alt }],
    },
    twitter: { card: "summary_large_image", title: m.title, description: m.description, images: [image] },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const resolved = getBlog().getPost(slug, lang);
  if (!resolved) notFound();
  const { post, fallback, scheduled } = resolved;
  const m = post.meta;
  const t = dictionaries[lang].blog;
  const other: Locale = lang === "de" ? "en" : "de";

  const { content } = await compileMDX({
    source: post.body,
    components: mdxComponents(lang, m.configurator.url),
    options: { mdxOptions: { remarkPlugins: [remarkGfm, remarkCite], rehypePlugins: [rehypeSlug] } },
  });

  const image = m.hero.src ? `${SITE_URL}${m.hero.src}` : `${SITE_URL}/images/hero.jpg`;

  return (
    <div className="min-h-screen">
      <BlogHeader lang={lang} otherHref={`/${other}/blog/${slug}`} />
      <main className="mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20">
        <article className="mx-auto flex w-full max-w-[760px] flex-col gap-8 py-10 md:py-16" lang={fallback ? post.lang : undefined}>
          <header className="flex flex-col gap-6">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-mono text-[12px] tracking-[0.08em] text-muted" lang={lang}>
              <Link href={`/${lang}/blog`} className="hover:text-ink">
                {t.backToBlog}
              </Link>
            </nav>
            {m.draft && (
              <p className="self-start rounded-full bg-accent px-3 py-1 font-mono text-[11px] tracking-[0.1em] text-paper uppercase" lang={lang}>
                {t.draft}
              </p>
            )}
            {scheduled && m.publishAtMs !== null && (
              <p role="note" className="rounded-2xl border border-e46/60 bg-e46/15 px-5 py-3.5 text-[14px] leading-relaxed text-body" lang={lang}>
                <span className="eyebrow mr-3 text-[10px] text-ink">{t.scheduled}</span>
                {t.scheduledBanner(formatPublishMoment(m.publishAtMs, lang))}
              </p>
            )}
            {fallback && (
              <div lang={lang}>
                <LanguageNote lang={lang} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
              <time dateTime={m.date}>{formatDate(m.date, lang)}</time>
              <span aria-hidden="true">·</span>
              <span>{t.readingTime(post.readingMinutes)}</span>
              {m.updated && m.updated !== m.date && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t.updated} <time dateTime={m.updated}>{formatDate(m.updated, lang)}</time>
                  </span>
                </>
              )}
            </div>
            <h1 className="text-[34px] leading-[1.02] font-extrabold tracking-[-0.035em] text-ink md:text-[52px]">{m.title}</h1>
            <p className="text-lg leading-relaxed text-body md:text-[21px]">{m.description}</p>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <p className="text-sm text-muted" lang={lang}>
                {t.by} <span className="font-semibold text-ink">{m.author}</span>
              </p>
              <ul className="flex flex-wrap gap-2" aria-label={t.topics}>
                {m.tags.map((tag) => (
                  <li key={tag}>
                    <Link href={`/${lang}/blog/tag/${encodeURIComponent(tagSlug(tag))}`} className="inline-flex h-7 items-center rounded-full border border-line px-3 text-[12px] font-medium text-muted hover:border-ink hover:text-ink">
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <HeroImage hero={m.hero} lang={lang} priority />

          <div className="prose prose-zl prose-lg max-w-none">{content}</div>

          <div className="mt-4 flex flex-col gap-6" lang={lang}>
            <ConfiguratorCta lang={lang} tag={m.configurator.tag} url={m.configurator.url} label={m.ctaLabel} />
            <SourcesBox lang={lang} sources={m.sources} evidenceRoot={m.evidenceRoot} />
          </div>
        </article>
      </main>
      <SiteFooter lang={lang} otherHref={`/${other}/blog/${slug}`} homePath={`/${lang}`} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: m.title,
          description: m.description,
          image: [image],
          datePublished: m.date,
          dateModified: m.updated ?? m.date,
          author: { "@type": m.author === "Zauberlabs" ? "Organization" : "Person", name: m.author },
          publisher: { "@type": "Organization", name: "Zauberlabs", url: SITE_URL },
          inLanguage: post.lang,
          keywords: m.tags.join(", "),
          mainEntityOfPage: postUrl(lang, slug),
          isPartOf: { "@type": "Blog", name: t.feedTitle, url: blogUrl(lang) },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `${SITE_URL}/${lang}` },
            { "@type": "ListItem", position: 2, name: t.feedTitle, item: blogUrl(lang) },
            { "@type": "ListItem", position: 3, name: m.title, item: postUrl(lang, slug) },
          ],
        }}
      />
    </div>
  );
}
