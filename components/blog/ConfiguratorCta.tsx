import { ArrowUpRight } from "@/components/Icons";
import { dictionaries, E46_LIVE, E46_URL, type Locale } from "@/lib/i18n";

export function configuratorHref(url?: string) {
  return url ?? E46_URL;
}

type Props = { lang: Locale; tag: string; url?: string; label?: string; compact?: boolean };

/**
 * "Try it on your car" box at the end of every article (and as a teaser on the listing).
 * While the configurator is not online (E46_LIVE false) the button is a "coming soon" pill with no link.
 */
export default function ConfiguratorCta({ lang, tag, url, label, compact = false }: Props) {
  const t = dictionaries[lang];
  return (
    <section className={`not-prose rounded-3xl bg-ink text-paper ${compact ? "p-6 md:p-8" : "p-6 md:p-10"}`} aria-labelledby="cta-title">
      <p className="eyebrow text-[11px] text-e46">{t.blog.ctaEyebrow}</p>
      <h2 id="cta-title" className={`mt-3 font-extrabold tracking-[-0.03em] ${compact ? "text-[26px] leading-[1.05] md:text-[30px]" : "text-[30px] leading-[1.02] md:text-[40px]"}`}>
        {t.blog.ctaTitle[0]}
        <span className="accent-serif text-accent-dark">{t.blog.ctaTitle[1]}</span>
      </h2>
      <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-fog">{t.blog.ctaBody}</p>
      {E46_LIVE ? (
        <a href={configuratorHref(url)} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-paper px-6 text-[15px] font-semibold text-ink hover:bg-white">
          {label ?? t.blog.ctaButton(tag.toUpperCase())} <ArrowUpRight />
        </a>
      ) : (
        <span className="mt-6 inline-flex h-12 items-center rounded-full border border-[#3A3A40] px-6 text-[15px] font-semibold text-fog">{t.nav.comingSoon}</span>
      )}
    </section>
  );
}

/** Inline building block for the article body. Plain text with a "coming soon" note while the configurator is offline. */
export function ConfiguratorLink({ href, children, lang }: { href?: string; children: React.ReactNode; lang: Locale }) {
  if (!E46_LIVE) {
    return (
      <span className="font-semibold text-ink">
        {children} <span className="font-mono text-[0.75em] tracking-[0.06em] text-muted uppercase">({dictionaries[lang].nav.comingSoon})</span>
      </span>
    );
  }
  return (
    <a href={configuratorHref(href)} className="inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent">
      {children} <ArrowUpRight className="size-3.5" />
    </a>
  );
}
