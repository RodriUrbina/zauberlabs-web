import { blogUrl, tagUrl, type Resolved, type Tag } from "@/lib/blog";
import { dictionaries, type Locale } from "@/lib/i18n";
import BlogHeader from "./BlogHeader";
import ConfiguratorCta from "./ConfiguratorCta";
import JsonLd from "./JsonLd";
import PostCard from "./PostCard";
import TagChips from "./TagChips";
import SiteFooter from "@/components/SiteFooter";

const wrap = "mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20";

/** Shared page for /[lang]/blog and /[lang]/blog/tag/[tag]. */
export default function BlogListing({ lang, items, tags, activeTag }: { lang: Locale; items: Resolved[]; tags: Tag[]; activeTag?: Tag }) {
  const t = dictionaries[lang].blog;
  const other: Locale = lang === "de" ? "en" : "de";
  const otherHref = activeTag ? `/${other}/blog/tag/${activeTag.slug}` : `/${other}/blog`;
  const [first, ...rest] = items;
  const url = activeTag ? tagUrl(lang, activeTag.name) : blogUrl(lang);
  const configuratorTag = first?.post.meta.configurator.tag ?? "E46";

  return (
    <div className="min-h-screen">
      <BlogHeader lang={lang} otherHref={otherHref} />
      <main>
        <section className={`${wrap} flex flex-col gap-8 pt-12 pb-10 md:pt-20 md:pb-14`}>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="flex max-w-[760px] flex-col gap-4">
              <p className="eyebrow text-muted">{t.eyebrow}</p>
              <h1 className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]">
                {activeTag ? (
                  t.tagTitle(activeTag.name)
                ) : (
                  <>
                    {t.title[0]}
                    <span className="accent-serif text-accent">{t.title[1]}</span>
                  </>
                )}
              </h1>
              <p className="max-w-[560px] text-base leading-relaxed text-body md:text-[17px]">{t.intro}</p>
            </div>
            <a href={`/${lang}/blog/feed.xml`} className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-line px-4 font-mono text-[12px] tracking-[0.08em] text-muted hover:border-ink hover:text-ink md:self-end">
              RSS
              <span className="sr-only">{t.feedLabel}</span>
            </a>
          </div>
          <TagChips lang={lang} tags={tags} active={activeTag?.slug} />
        </section>

        <section className={`${wrap} flex flex-col gap-6 pb-16 md:pb-24`}>
          {!items.length && <p className="rounded-3xl border border-line bg-paper p-8 text-body">{t.empty}</p>}
          {first && <PostCard lang={lang} item={first} featured />}
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((item) => (
                <PostCard key={item.post.slug} lang={lang} item={item} />
              ))}
            </div>
          )}
          <ConfiguratorCta lang={lang} tag={configuratorTag} compact />
        </section>
      </main>
      <SiteFooter lang={lang} otherHref={otherHref} homePath={`/${lang}`} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: activeTag ? t.tagTitle(activeTag.name) : t.metaTitle,
          description: activeTag ? t.tagMetaDescription(activeTag.name) : t.metaDescription,
          url,
          inLanguage: lang,
          isPartOf: { "@type": "WebSite", name: "Zauberlabs", url: "https://www.zauberlabs.de" },
        }}
      />
    </div>
  );
}
