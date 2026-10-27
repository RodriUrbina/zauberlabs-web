import Link from "next/link";
import { Wordmark } from "./Icons";
import SiteFooter from "./SiteFooter";
import { isLocale } from "@/lib/i18n";
import { SHOP_LAUNCHED } from "@/lib/shop-flag";

/** `titleLang`: the language of the title (BL-085: the shop's legal pages have English versions on /en); German by default. */
export default function LegalPage({ lang, title, titleLang = "de", children }: { lang: string; title: string; titleLang?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#D8D3CA]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href={`/${lang}`} aria-label="zauberlabs">
            <Wordmark />
          </Link>
          <Link href={`/${lang}`} className="text-sm font-semibold hover:opacity-70">
            {lang === "de" ? "← Zurück" : "← Back"}
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-14 text-body [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        <h1 lang={titleLang} className="text-[28px] leading-tight font-extrabold tracking-tight break-words text-ink hyphens-auto sm:text-4xl md:text-5xl">{title}</h1>
        {children}
      </main>
      {/* BL-085: with the shop launched, „Vertrag widerrufen" must be reachable from every page (§ 356a Abs. 1 BGB), so the legal
          pages get the site footer too. Without the flag they look as before. */}
      {SHOP_LAUNCHED && isLocale(lang) && <SiteFooter lang={lang} homePath={`/${lang}`} />}
    </div>
  );
}
