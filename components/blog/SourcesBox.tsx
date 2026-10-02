import type { Source } from "@/lib/blog-schema";
import { CONFIDENCE_LEGEND } from "@/lib/confidence-legend";
import { dictionaries, type Locale } from "@/lib/i18n";
import { ConfidenceBadge } from "./Confidence";

/**
 * "Sources & confidence" box rendered from front matter on every article (BL-000 evidence rule),
 * followed by the one site-level legend (lib/confidence-legend.ts). Articles carry no legend of their own.
 */
export default function SourcesBox({ lang, sources, evidenceRoot }: { lang: Locale; sources: Source[]; evidenceRoot?: string }) {
  const t = dictionaries[lang].blog;
  const legend = CONFIDENCE_LEGEND[lang];
  const used = new Set(sources.map((s) => s.confidence));
  return (
    <section className="not-prose rounded-3xl border border-line bg-paper p-6 md:p-8" aria-labelledby="sources-title">
      <p className="eyebrow text-[11px] text-muted">{t.sourcesTitle}</p>
      <h2 id="sources-title" className="sr-only">{t.sourcesTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-body">
        {t.sourcesIntro}
        {evidenceRoot && (
          <>
            {" "}
            {t.pathsRelativeTo} <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[12px]">{evidenceRoot}</code>
          </>
        )}
      </p>
      <ol className="mt-5 flex flex-col divide-y divide-line border-y border-line">
        {sources.map((s) => (
          <li key={s.id} id={`src-${s.id.toLowerCase()}`} className="grid scroll-mt-24 gap-1.5 py-4 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
            <span className="font-mono text-[13px] text-muted">{s.id}</span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-ink">{s.label}</p>
              {s.type && <p className="mt-0.5 text-[13px] text-muted">{s.type}</p>}
              <p className="mt-1 font-mono text-[12px] break-all text-muted">{s.path}</p>
              {s.note && <p className="mt-1.5 text-[13px] leading-relaxed text-body">{s.note}</p>}
            </div>
            <ConfidenceBadge level={s.confidence} lang={lang} className="justify-self-start sm:justify-self-end" />
          </li>
        ))}
      </ol>
      <div className="mt-6" aria-label={legend.title}>
        <p className="eyebrow text-[11px] text-muted">{legend.title}</p>
        <dl className="mt-3 flex flex-col gap-2.5">
          {legend.items
            .filter((item) => item.level !== "NA" || used.has("NA"))
            .map((item) => (
              <div key={item.level} className="grid gap-1 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-3">
                <dt>
                  <ConfidenceBadge level={item.level} lang={lang} />
                </dt>
                <dd className="text-[13px] leading-relaxed text-muted">{item.text}</dd>
              </div>
            ))}
        </dl>
      </div>
    </section>
  );
}
