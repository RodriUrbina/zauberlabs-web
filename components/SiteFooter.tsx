import Link from "next/link";
import { CONTACT_EMAIL, dictionaries, E46_LIVE, e46Url, INSTAGRAM_URL, localizeE46Href, type Locale } from "@/lib/i18n";
import { SHOP_LAUNCHED } from "@/lib/shop-flag";
import { getBlog } from "@/lib/blog";
import { footerBlogTopics } from "@/lib/footer-topics";
import { E46_TOPIC_GROUPS } from "@/lib/e46-topics";
import { aboutPath } from "@/lib/about";
import { Instagram, Wordmark } from "./Icons";

const wrap = "mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20";

type Props = {
  lang: Locale;
  /** Where the language switch goes; defaults to the other language's home page. */
  otherHref?: string;
  /** Anchor links (#next) only work on the landing page; elsewhere they point back to it. */
  homePath?: string;
};

export default function SiteFooter({ lang, otherHref, homePath = "" }: Props) {
  const t = dictionaries[lang];
  const other: Locale = lang === "de" ? "en" : "de";
  return (
    <footer className="bg-ink text-fog">
      <div className={`${wrap} flex flex-col gap-14 pt-14 pb-10 md:pt-[72px]`}>
        <PopularTopics lang={lang} />
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 flex flex-col gap-4 text-paper md:col-span-1">
            <Wordmark dark />
            <p className="max-w-[340px] text-sm leading-relaxed text-fog">{t.footer.tagline}</p>
            {/* BL-121 (PO 2026-11-06): a plain link to our Instagram profile; new tab, no embed, nothing loaded from Instagram. */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.footer.instagram}
              title={t.footer.instagram}
              className="-ml-2 grid size-10 place-items-center rounded-full text-fog hover:text-paper focus-visible:outline-2 focus-visible:outline-paper"
            >
              <Instagram className="size-5" />
            </a>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <span className="eyebrow text-[11px] text-[#8A877F]">{t.footer.configurators}</span>
            {E46_LIVE ? <a href={e46Url(lang)} className="text-paper hover:opacity-80">E46BUILD</a> : <span>{t.footer.e46Soon}</span>}
            {/* BL-081: replaces the "[Next model] — soon" placeholder; names no car. */}
            <a href={`${homePath}#next`} className="text-paper hover:opacity-80">
              {t.footer.next[0]}
              <span className="text-accent-dark">{t.footer.next[1]}</span>
            </a>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <span className="eyebrow text-[11px] text-[#8A877F]">{t.footer.studio}</span>
            <Link href={`/${lang}/blog`} className="hover:text-paper">{t.nav.blog}</Link>
            {/* BL-086 (PO 2026-10-27): the shop sits with the studio links, not under Legal; only once launched. */}
            {SHOP_LAUNCHED && <Link href={`/${lang}/shop`} className="hover:text-paper">{t.nav.shop}</Link>}
            {/* BL-108: the About page (/en/about, /de/ueber-uns), no longer the configurators section. */}
            <Link href={aboutPath(lang)} className="hover:text-paper">{t.footer.about}</Link>
            <a href={`${homePath}#suggest`} className="hover:text-paper">{t.nav.suggest}</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-paper">{CONTACT_EMAIL}</a>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <span className="eyebrow text-[11px] text-[#8A877F]">{t.footer.legal}</span>
            <Link href={`/${lang}/impressum`} className="hover:text-paper">{t.footer.impressum}</Link>
            <Link href={`/${lang}/datenschutz`} className="hover:text-paper">{t.footer.privacy}</Link>
            {/* BL-084: the shop's legal pages are linked only once the shop is launched (lib/shop-flag.ts); „Vertrag widerrufen"
                must stay reachable from every page (§ 356a BGB). */}
            {SHOP_LAUNCHED && (
              <>
                <Link href={`/${lang}/agb`} className="hover:text-paper">AGB</Link>
                <Link href={`/${lang}/widerrufsbelehrung`} className="hover:text-paper">Widerrufsbelehrung</Link>
                <Link href={`/${lang}/versand-zahlung`} className="hover:text-paper">{lang === "de" ? "Versand & Zahlung" : "Shipping & payment"}</Link>
                <Link href={`/${lang}/vertrag-widerrufen`} className="hover:text-paper">Vertrag widerrufen</Link>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-ink-3 pt-6 text-xs text-[#8A877F] md:flex-row">
          <span>© {new Date().getFullYear()} zauberlabs. {t.footer.disclaimer}</span>
          <Link href={otherHref ?? `/${other}`} hrefLang={other} className="font-mono tracking-[0.1em] hover:text-paper">
            ZAUBERLABS.DE · {other.toUpperCase()}
          </Link>
        </div>
      </div>
    </footer>
  );
}

const heading = "eyebrow text-[11px] text-[#8A877F]";
const groupList = "flex flex-col gap-2 text-[13px] leading-snug";

/**
 * BL-106 (PO 2026-11-03) — "Popular topics" above the footer rows: every published blog article of the language, grouped by
 * topic (lib/footer-topics.ts), and E46BUILD's topic pages (lib/e46-topics.ts). Plain links in the server HTML. Blog links stay
 * in the tab; E46BUILD links open a new tab with the referrer (BL-056) and are followed (no ?start=/?section=, so no nofollow).
 */
function PopularTopics({ lang }: { lang: Locale }) {
  const t = dictionaries[lang];
  const blog = footerBlogTopics(getBlog(), lang);
  const e46 = (path: string) => localizeE46Href(`${e46Url("en").replace(/\/+$/, "")}${path}`, lang);
  const newTab = <span className="sr-only"> {t.blog.opensNewTab}</span>;
  return (
    <section aria-labelledby="footer-topics" className="flex flex-col gap-10 border-b border-ink-3 pb-12">
      <div className="flex flex-col gap-6">
        <h2 id="footer-topics" className={heading}>{t.footer.topics}</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {blog.map((g) => (
            <div key={g.key} className="flex flex-col gap-3">
              <h3 className="text-sm text-paper">{g.label}</h3>
              <ul className={groupList}>
                {g.posts.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/${lang}/blog/${p.slug}`} className="hover:text-paper">{p.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {E46_LIVE && (
        <div className="flex flex-col gap-6">
          <h2 className={heading}>
            <a href={e46Url(lang)} target="_blank" rel="noopener" className="hover:text-paper">E46BUILD{newTab}</a>
          </h2>
          {/* PO 2026-11-03: two columns on phones (the labels are short), four from md. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-x-8">
            {E46_TOPIC_GROUPS.map((g) => (
              <div key={g.key} className="flex flex-col gap-3">
                <h3 className="text-sm text-paper">{g.label[lang]}</h3>
                <ul className={groupList}>
                  {g.pages.map((p) => (
                    <li key={p.en.path}>
                      <a href={e46(p.en.path)} target="_blank" rel="noopener" className="hover:text-paper">{p[lang].label}{newTab}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
