import Link from "next/link";
import { CONTACT_EMAIL, dictionaries, E46_LIVE, E46_URL, type Locale } from "@/lib/i18n";
import { Wordmark } from "./Icons";

const wrap = "mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20";

type Props = {
  lang: Locale;
  /** Where the language switch goes; defaults to the other language's home page. */
  otherHref?: string;
  /** Anchor links (#principles, #suggest) only work on the landing page; elsewhere they point back to it. */
  homePath?: string;
};

export default function SiteFooter({ lang, otherHref, homePath = "" }: Props) {
  const t = dictionaries[lang];
  const other: Locale = lang === "de" ? "en" : "de";
  return (
    <footer className="bg-ink text-fog">
      <div className={`${wrap} flex flex-col gap-14 pt-14 pb-10 md:pt-[72px]`}>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 flex flex-col gap-4 text-paper md:col-span-1">
            <Wordmark dark />
            <p className="max-w-[340px] text-sm leading-relaxed text-fog">{t.footer.tagline}</p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <span className="eyebrow text-[11px] text-[#8A877F]">{t.footer.configurators}</span>
            {E46_LIVE ? <a href={E46_URL} className="text-paper hover:opacity-80">E46BUILD</a> : <span>{t.footer.e46Soon}</span>}
            <span>{t.footer.next}</span>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <span className="eyebrow text-[11px] text-[#8A877F]">{t.footer.studio}</span>
            <Link href={`/${lang}/blog`} className="hover:text-paper">{t.nav.blog}</Link>
            <a href={`${homePath}#principles`} className="hover:text-paper">{t.footer.about}</a>
            <a href={`${homePath}#suggest`} className="hover:text-paper">{t.nav.suggest}</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-paper">{CONTACT_EMAIL}</a>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <span className="eyebrow text-[11px] text-[#8A877F]">{t.footer.legal}</span>
            <Link href={`/${lang}/impressum`} className="hover:text-paper">{t.footer.impressum}</Link>
            <Link href={`/${lang}/datenschutz`} className="hover:text-paper">{t.footer.privacy}</Link>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-ink-3 pt-6 text-xs text-[#8A877F] md:flex-row">
          <span>© {new Date().getFullYear()} Zauberlabs. {t.footer.disclaimer}</span>
          <Link href={otherHref ?? `/${other}`} hrefLang={other} className="font-mono tracking-[0.1em] hover:text-paper">
            ZAUBERLABS.DE · {other.toUpperCase()}
          </Link>
        </div>
      </div>
    </footer>
  );
}
