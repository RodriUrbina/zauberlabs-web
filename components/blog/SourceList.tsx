import type { Source } from "@/lib/blog-schema";
import { CONFIDENCE_LEGEND } from "@/lib/confidence-legend";
import { sourceAnchor } from "@/lib/blog";
import type { Locale } from "@/lib/i18n";
import { ConfidenceBadge } from "./Confidence";

/**
 * One article's sources, as listed on the sources page (BL-055; formerly the "Sources & confidence" box under every article).
 * Each entry carries the anchor #<slug>-s<n> that the article's superscript numbers link to.
 */
export function SourceList({ slug, lang, sources }: { slug: string; lang: Locale; sources: Source[] }) {
  return (
    <ol className="flex min-w-0 flex-col divide-y divide-line border-y border-line">
      {sources.map((s) => (
        <li key={s.id} id={sourceAnchor(slug, s.id)} className="grid min-w-0 scroll-mt-24 gap-1.5 py-4 target:bg-e46/15 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
          <span className="font-mono text-[13px] text-muted">{s.id}</span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold break-words text-ink [overflow-wrap:anywhere]">{s.label}</p>
            {s.type && <p className="mt-0.5 text-[13px] break-words text-muted [overflow-wrap:anywhere]">{s.type}</p>}
            <p className="mt-1 font-mono text-[12px] break-all text-muted">{s.path}</p>
            {s.note && <p className="mt-1.5 text-[13px] leading-relaxed break-words text-body [overflow-wrap:anywhere]">{s.note}</p>}
          </div>
          <ConfidenceBadge level={s.confidence} lang={lang} className="justify-self-start sm:justify-self-end" />
        </li>
      ))}
    </ol>
  );
}

/** The ONE site-level HIGH / MEDIUM / LOW legend (lib/confidence-legend.ts), shown once at the top of the sources page. */
export function ConfidenceLegend({ lang }: { lang: Locale }) {
  const legend = CONFIDENCE_LEGEND[lang];
  return (
    <div aria-label={legend.title}>
      <p className="eyebrow text-[11px] text-muted">{legend.title}</p>
      <dl className="mt-3 flex flex-col gap-2.5">
        {legend.items.map((item) => (
          <div key={item.level} className="grid gap-1 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-3">
            <dt>
              <ConfidenceBadge level={item.level} lang={lang} />
            </dt>
            <dd className="text-[13px] leading-relaxed text-muted">{item.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
