import Link from "next/link";
import type { Tag } from "@/lib/blog";
import { dictionaries, type Locale } from "@/lib/i18n";

/** Tag filter: chips linking to the tag pages; the active one is highlighted. */
export default function TagChips({ lang, tags, active }: { lang: Locale; tags: Tag[]; active?: string }) {
  const t = dictionaries[lang].blog;
  if (!tags.length) return null;
  const chip = (selected: boolean) =>
    `inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors ${
      selected ? "border-ink bg-ink text-paper" : "border-line bg-paper text-body hover:border-ink hover:text-ink"
    }`;
  return (
    <nav aria-label={t.topics} className="flex flex-wrap gap-2">
      <Link href={`/${lang}/blog`} className={chip(!active)} aria-current={!active ? "page" : undefined}>
        {t.allArticles}
      </Link>
      {tags.map((tag) => (
        <Link key={tag.slug} href={`/${lang}/blog/tag/${encodeURIComponent(tag.slug)}`} className={chip(active === tag.slug)} aria-current={active === tag.slug ? "page" : undefined}>
          {tag.name}
          <span className={`font-mono text-[11px] ${active === tag.slug ? "text-fog" : "text-muted"}`}>{tag.count}</span>
        </Link>
      ))}
    </nav>
  );
}
