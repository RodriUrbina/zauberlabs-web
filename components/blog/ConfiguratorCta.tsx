import { ArrowUpRight } from "@/components/Icons";
import Title from "@/components/Title";
import { dictionaries, E46_LIVE, e46Url, localizeE46Href, type Locale } from "@/lib/i18n";

/** BL-105: German pages open the German E46BUILD, also when the article names its own E46BUILD link (cta.href). */
export function configuratorHref(lang: Locale, url?: string) {
  return url ? localizeE46Href(url, lang) : e46Url(lang);
}

/**
 * BL-056 (PO decision 2026-10-19): configurator links inside the blog open in a new tab, so the article stays open.
 * rel="noopener" without "noreferrer", so E46BUILD still sees where the visitor came from. Home cards, header and footer
 * keep opening in the same tab. Counting (components/ConfiguratorClickTracker.tsx) runs on the click itself, so new-tab
 * and middle clicks are counted too.
 */
export const NEW_TAB = { target: "_blank", rel: "noopener" } as const;

type Props = { lang: Locale; tag: string; url?: string; label?: string; compact?: boolean };

/**
 * "Try it on your car" box at the end of every article (and as a teaser on the listing).
 * While the configurator is not online (E46_LIVE false) the button is a "coming soon" pill with no link.
 */
export default function ConfiguratorCta({ lang, tag, url, label, compact = false }: Props) {
  const t = dictionaries[lang];
  return (
    <section data-click-place="article-cta" className={`not-prose rounded-3xl bg-ink text-paper ${compact ? "p-6 md:p-8" : "p-6 md:p-10"}`} aria-labelledby="cta-title">
      <Title
        id="cta-title"
        tone="dark"
        eyebrow={t.blog.ctaEyebrow}
        eyebrowClassName="text-[11px] text-e46"
        lead={t.blog.ctaTitle[0]}
        accent={t.blog.ctaTitle[1]}
        className={`mt-3 font-extrabold tracking-[-0.03em] ${compact ? "text-[26px] leading-[1.05] md:text-[30px]" : "text-[30px] leading-[1.02] md:text-[40px]"}`}
      />
      <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-fog">{t.blog.ctaBody}</p>
      {E46_LIVE ? (
        <a href={configuratorHref(lang, url)} {...NEW_TAB} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-paper px-6 text-[15px] font-semibold text-ink hover:bg-white">
          {label ?? t.blog.ctaButton(tag.toUpperCase())} <ArrowUpRight />
          <span className="sr-only">{t.blog.opensNewTab}</span>
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
    <a href={configuratorHref(lang, href)} {...NEW_TAB} data-click-place="inline" className="inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent">
      {children} <ArrowUpRight className="size-3.5" />
      <span className="sr-only">{dictionaries[lang].blog.opensNewTab}</span>
    </a>
  );
}
