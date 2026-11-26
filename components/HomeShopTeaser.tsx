import Image from "next/image";
import Link from "next/link";
import { dictionaries, type Locale } from "@/lib/i18n";
import { AVAILABLE } from "@/lib/shop-products";
import { shopCopy } from "@/lib/shop-copy";
import { Arrow } from "@/components/Icons";
import Title from "@/components/Title";

/**
 * BL-151 (PO 2026-11-26) — a visible way into the shop from the start page's body, not only from the header: one card after
 * "Take a closer look", in the shop's own words (its eyebrow, title code, sub line and price line; no new claims) with the
 * stickers on sale. Rendered only when the shop is launched (the page checks SHOP_LAUNCHED, as the nav does).
 */
export default function HomeShopTeaser({ lang }: { lang: Locale }) {
  const s = shopCopy[lang];
  const t = dictionaries[lang];
  return (
    <div className="grid items-center gap-6 rounded-3xl border border-line p-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10 md:p-8">
      <div className="flex flex-col gap-3">
        <Title eyebrow={s.eyebrow} lead={s.title[0]} accent={s.title[1]} className="text-[30px] leading-[1.05] font-extrabold tracking-[-0.03em] md:text-[40px]" />
        <p className="max-w-[460px] text-[15px] leading-relaxed text-body">{s.sub}</p>
        <p className="text-[15px] text-ink">
          <span className="font-semibold">{s.price}</span> <span className="text-muted">· {s.vatNote}</span>
        </p>
      </div>
      <div className="flex flex-col gap-5 md:items-end">
        <ul className="grid grid-cols-4 gap-2 md:gap-3" aria-hidden="true">
          {AVAILABLE.map((p) => (
            <li key={p.id}>
              <Image src={p.image} alt="" width={1200} height={800} sizes="(min-width: 768px) 120px, 22vw" className="block h-auto w-full md:w-[120px]" />
            </li>
          ))}
        </ul>
        <Link href={`/${lang}/shop`} className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-paper hover:bg-black md:self-end">
          {t.nav.shop} <Arrow className="size-[18px]" />
        </Link>
      </div>
    </div>
  );
}
