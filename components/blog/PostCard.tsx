import Link from "next/link";
import { formatDate, tagSlug, type Resolved } from "@/lib/blog";
import { dictionaries, type Locale } from "@/lib/i18n";
import { Arrow } from "@/components/Icons";
import HeroImage from "./HeroImage";

/** One article in the listing. `lang` is the page language; the article may be in the other one (fallback). */
export default function PostCard({ lang, item, featured = false }: { lang: Locale; item: Resolved; featured?: boolean }) {
  const t = dictionaries[lang].blog;
  const { post, fallback } = item;
  const href = `/${lang}/blog/${post.slug}`;
  const langNote = fallback ? (post.lang === "en" ? t.englishOnly : t.germanOnly) : null;
  const hero = { ...post.meta.hero, credit: null, licence: null }; // credit is shown on the article, not on cards
  return (
    <article className={`group flex flex-col overflow-hidden rounded-3xl border border-line bg-paper ${featured ? "md:grid md:grid-cols-2" : ""}`}>
      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
        <HeroImage hero={hero} lang={lang} priority={featured} sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"} className="[&>div]:rounded-none [&>div]:rounded-t-3xl md:[&>div]:h-full" />
      </Link>
      <div className={`flex flex-1 flex-col gap-4 p-6 ${featured ? "md:p-9" : ""}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
          <time dateTime={post.meta.date}>{formatDate(post.meta.date, lang)}</time>
          <span aria-hidden="true">·</span>
          <span>{t.readingTime(post.readingMinutes)}</span>
          {langNote && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-accent">{langNote}</span>
            </>
          )}
          {post.meta.draft && (
            <>
              <span aria-hidden="true">·</span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-paper">{t.draft}</span>
            </>
          )}
        </div>
        <h2 className={`font-extrabold tracking-[-0.03em] text-ink ${featured ? "text-[28px] leading-[1.05] md:text-[40px]" : "text-[22px] leading-[1.1]"}`}>
          <Link href={href} className="hover:text-accent" lang={fallback ? post.lang : undefined}>
            {post.meta.title}
          </Link>
        </h2>
        <p className="text-[15px] leading-relaxed text-body" lang={fallback ? post.lang : undefined}>
          {post.meta.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <ul className="flex flex-wrap gap-2" aria-label={t.topics}>
            {post.meta.tags.map((tag) => (
              <li key={tag}>
                <Link href={`/${lang}/blog/tag/${encodeURIComponent(tagSlug(tag))}`} className="inline-flex h-7 items-center rounded-full border border-line px-3 text-[12px] font-medium text-muted hover:border-ink hover:text-ink">
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent" aria-hidden="true" tabIndex={-1}>
            <Arrow />
          </Link>
        </div>
      </div>
    </article>
  );
}
