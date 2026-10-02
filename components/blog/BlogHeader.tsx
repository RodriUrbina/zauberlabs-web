import Link from "next/link";
import { dictionaries, E46_LIVE, E46_URL, type Locale } from "@/lib/i18n";
import { Arrow, Wordmark } from "@/components/Icons";

const wrap = "mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20";

/** Compact header for blog pages. The language switch keeps the reader on the same page. */
export default function BlogHeader({ lang, otherHref }: { lang: Locale; otherHref: string }) {
  const t = dictionaries[lang];
  const other: Locale = lang === "de" ? "en" : "de";
  return (
    <header className="border-b border-[#D8D3CA]">
      <div className={`${wrap} flex h-16 items-center justify-between md:h-[84px]`}>
        <div className="flex items-center gap-4 md:gap-6">
          <Link href={`/${lang}`} aria-label="Zauberlabs">
            <Wordmark />
          </Link>
          <span aria-hidden="true" className="hidden h-5 w-px bg-line sm:block" />
          <Link href={`/${lang}/blog`} className="eyebrow hidden text-muted hover:text-ink sm:block">
            {t.nav.blog}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs tracking-[0.08em] text-muted">
            {lang === "en" ? <span className="text-ink">EN</span> : <Link href={otherHref} hrefLang="en" className="px-1 py-3 hover:text-ink">EN</Link>}
            {" / "}
            {lang === "de" ? <span className="text-ink">DE</span> : <Link href={otherHref} hrefLang="de" className="px-1 py-3 hover:text-ink">DE</Link>}
          </div>
          {E46_LIVE ? (
            <a href={E46_URL} className="hidden h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-black sm:flex">
              {t.nav.open} <Arrow />
            </a>
          ) : (
            <span className="hidden h-11 items-center rounded-full border border-line px-5 text-sm font-semibold text-muted sm:flex">{t.nav.comingSoon}</span>
          )}
        </div>
      </div>
      <span className="sr-only">{other}</span>
    </header>
  );
}
