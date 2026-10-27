import Link from "next/link";
import { Wordmark } from "@/components/Icons";
import SiteFooter from "@/components/SiteFooter";
import type { Locale } from "@/lib/i18n";

const wrap = "mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20";

/** BL-084 — the frame of the shop pages: a slim header (logo, back to zauberlabs) and the site footer. */
export default function ShopShell({ lang, otherHref, children }: { lang: Locale; otherHref: string; children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-[#D8D3CA]">
        <div className={`${wrap} flex h-16 items-center justify-between`}>
          <Link href={`/${lang}`} aria-label="zauberlabs">
            <Wordmark />
          </Link>
          <Link href={`/${lang}`} className="text-sm font-semibold hover:opacity-70">
            {lang === "de" ? "← Zurück zu zauberlabs" : "← Back to zauberlabs"}
          </Link>
        </div>
      </header>
      <main className={`${wrap} pt-12 pb-32 md:pt-20`}>{children}</main>
      <SiteFooter lang={lang} otherHref={otherHref} homePath={`/${lang}`} />
    </>
  );
}
