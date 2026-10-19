import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getBlog, SITE_URL, sourceAnchor, sourcesUrl } from "@/lib/blog";
import { dictionaries, isLocale, LOCALES, type Locale } from "@/lib/i18n";
import BlogHeader from "@/components/blog/BlogHeader";
import { ConfidenceLegend, SourceList } from "@/components/blog/SourceList";
import SiteFooter from "@/components/SiteFooter";

/**
 * BL-055 (PO decision 2026-10-19) — ONE page with every article's sources, generated from the articles' front matter
 * (no extra content files). Anchors: #<slug> per article, #<slug>-s<n> per source; the articles' superscript numbers
 * and their "Sources & confidence" line link here. Same visibility rules and 5-minute refresh as the blog listing.
 */
export const revalidate = 300;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = dictionaries[lang].blog;
  return {
    metadataBase: new URL(SITE_URL),
    title: `${t.sourcesPageTitle} — zauberlabs`,
    description: t.sourcesPageMeta,
    alternates: { canonical: sourcesUrl(lang), languages: Object.fromEntries(LOCALES.map((l) => [l, sourcesUrl(l)])) },
  };
}

export default async function SourcesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = dictionaries[lang as Locale].blog;
  const other: Locale = lang === "de" ? "en" : "de";
  const items = getBlog().sourcesEntries(lang); // same visibility rule as the blog index and previous/next

  return (
    <div className="min-h-screen">
      <BlogHeader lang={lang} otherHref={`/${other}/blog/sources`} />
      <main className="mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20">
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-10 py-10 md:py-16">
          <header className="flex flex-col gap-5">
            <nav aria-label="Breadcrumb" className="font-mono text-[12px] tracking-[0.08em] text-muted">
              <Link href={`/${lang}/blog`} className="hover:text-ink">
                {t.backToBlog}
              </Link>
            </nav>
            <h1 className="text-[34px] leading-[1.02] font-extrabold tracking-[-0.035em] text-ink md:text-[52px]">{t.sourcesPageTitle}</h1>
            <p className="text-lg leading-relaxed text-body">{t.sourcesPageIntro}</p>
          </header>

          <section className="rounded-3xl border border-line bg-paper p-6 md:p-8">
            <ConfidenceLegend lang={lang} />
          </section>

          <nav aria-labelledby="sources-toc" className="flex flex-col gap-3">
            <h2 id="sources-toc" className="eyebrow text-[11px] text-muted">
              {t.sourcesArticles}
            </h2>
            <ol className="flex flex-col gap-1.5 text-[15px]">
              {items.map(({ post }) => (
                <li key={post.slug}>
                  <a href={`#${sourceAnchor(post.slug)}`} className="text-ink underline decoration-line underline-offset-4 hover:decoration-accent">
                    {post.meta.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {items.map(({ post, fallback }) => (
            <section key={post.slug} id={sourceAnchor(post.slug)} aria-labelledby={`${post.slug}-title`} className="flex scroll-mt-24 flex-col gap-4" lang={fallback ? post.lang : undefined}>
              <div className="flex flex-col gap-1.5">
                <p className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase" lang={lang}>
                  <time dateTime={post.meta.date}>{formatDate(post.meta.date, lang)}</time> · {t.sourcesCount(post.meta.sources.length)}
                </p>
                <h2 id={`${post.slug}-title`} className="text-[24px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                  {post.meta.title}
                </h2>
                <p className="text-[14px] text-body" lang={lang}>
                  <Link href={`/${lang}/blog/${post.slug}`} className="font-semibold underline decoration-accent decoration-2 underline-offset-4 hover:text-accent">
                    {t.sourcesReadArticle} →
                  </Link>
                  {post.meta.evidenceRoot && (
                    <span className="ml-3 text-muted">
                      {t.pathsRelativeTo} <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[12px]">{post.meta.evidenceRoot}</code>
                    </span>
                  )}
                </p>
              </div>
              <SourceList slug={post.slug} lang={lang} sources={post.meta.sources} />
            </section>
          ))}
        </div>
      </main>
      <SiteFooter lang={lang} otherHref={`/${other}/blog/sources`} homePath={`/${lang}`} />
    </div>
  );
}
