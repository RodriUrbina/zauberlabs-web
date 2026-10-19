import Link from "next/link";
import type { Source } from "@/lib/blog-schema";
import { sourceAnchor, sourcesPath } from "@/lib/blog";
import { dictionaries, type Locale } from "@/lib/i18n";
import { ConfidenceBadge } from "./Confidence";

const ORDER = ["HIGH", "MEDIUM", "LOW", "NA"] as const;

/**
 * BL-055 — the one line under every article that replaces the "Sources & confidence" box:
 * how many sources, how they grade, and a link to this article's section on the sources page.
 */
export default function SourcesLine({ lang, slug, sources }: { lang: Locale; slug: string; sources: Source[] }) {
  const t = dictionaries[lang].blog;
  const counts = ORDER.map((level) => [level, sources.filter((s) => s.confidence === level).length] as const).filter(([, n]) => n > 0);
  return (
    <p className="not-prose flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-5 text-[14px] text-body">
      <span className="eyebrow text-[11px] text-muted">{t.sourcesTitle}</span>
      <span className="font-semibold text-ink">{t.sourcesCount(sources.length)}</span>
      <span className="flex flex-wrap items-center gap-1.5">
        {counts.map(([level, n]) => (
          <span key={level} className="inline-flex items-center gap-1 font-mono text-[12px] text-muted">
            {n}
            <ConfidenceBadge level={level} lang={lang} />
          </span>
        ))}
      </span>
      <Link href={`${sourcesPath(lang)}#${sourceAnchor(slug)}`} className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent">
        {t.sourcesLineLink} →
      </Link>
    </p>
  );
}
