import Link from "next/link";
import type { Resolved } from "@/lib/blog";
import { dictionaries, type Locale } from "@/lib/i18n";

type Props = { lang: Locale; previous: Resolved | null; next: Resolved | null };

/**
 * BL-054 — links to the previous (older) and next (newer) published article in the same language.
 * `PrevNext` sits at the end of the article (two cards, stacked on phones); `PrevNextCompact` is the small row at the top.
 */
export default function PrevNext({ lang, previous, next }: Props) {
  if (!previous && !next) return null;
  const t = dictionaries[lang].blog;
  const card = "group flex min-w-0 flex-col gap-1.5 rounded-2xl border border-line bg-white p-5 hover:border-ink";
  return (
    <nav aria-label={t.articleNav} className="not-prose grid gap-3 sm:grid-cols-2">
      {previous ? (
        <Link href={`/${lang}/blog/${previous.post.slug}`} rel="prev" className={card}>
          <span className="eyebrow text-[11px] text-muted">← {t.prevArticle}</span>
          <span className="text-[16px] leading-snug font-semibold text-ink group-hover:underline">{previous.post.meta.title}</span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <Link href={`/${lang}/blog/${next.post.slug}`} rel="next" className={`${card} sm:items-end sm:text-right`}>
          <span className="eyebrow text-[11px] text-muted">{t.nextArticle} →</span>
          <span className="text-[16px] leading-snug font-semibold text-ink group-hover:underline">{next.post.meta.title}</span>
        </Link>
      )}
    </nav>
  );
}

export function PrevNextCompact({ lang, previous, next }: Props) {
  if (!previous && !next) return null;
  const t = dictionaries[lang].blog;
  const link = "inline-flex h-8 items-center rounded-full border border-line px-3 hover:border-ink hover:text-ink";
  return (
    <span className="flex items-center gap-2">
      {previous && (
        <Link href={`/${lang}/blog/${previous.post.slug}`} rel="prev" title={previous.post.meta.title} aria-label={`${t.prevArticle}: ${previous.post.meta.title}`} className={link}>
          ← <span className="ml-1.5 hidden sm:inline">{t.prevArticle}</span>
        </Link>
      )}
      {next && (
        <Link href={`/${lang}/blog/${next.post.slug}`} rel="next" title={next.post.meta.title} aria-label={`${t.nextArticle}: ${next.post.meta.title}`} className={link}>
          <span className="mr-1.5 hidden sm:inline">{t.nextArticle}</span> →
        </Link>
      )}
    </span>
  );
}
