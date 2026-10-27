import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopShell from "@/components/shop/ShopShell";
import ShopClient from "@/components/shop/ShopClient";
import { dictionaries, isLocale, type Locale } from "@/lib/i18n";
import { shopCopy } from "@/lib/shop-copy";
import { SHOP_LAUNCHED } from "@/lib/shop-flag";
import { requireShopOpen } from "@/lib/shop-gate";

/**
 * BL-084 — the fan shop (plan: e46 docs/plans/fan-shop.md § 5). Hidden until launch: 404 on production except on the PO's
 * devices, noindex, not in the sitemap, no link from the nav or footer (lib/shop-flag.ts).
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: shopCopy[lang].metaTitle, robots: { index: SHOP_LAUNCHED, follow: SHOP_LAUNCHED } };
}

export default async function ShopPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  await requireShopOpen();
  const t = shopCopy[lang];
  const other: Locale = lang === "de" ? "en" : "de";
  return (
    <ShopShell lang={lang} otherHref={`/${other}/shop`}>
      <div className="flex max-w-[760px] flex-col gap-4">
        <p className="eyebrow text-muted">{t.eyebrow}</p>
        <h1 className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]">
          {t.title[0]}
          <span className="accent-serif text-accent">{t.title[1]}</span>
        </h1>
        <p className="text-lg text-body">{t.sub}</p>
      </div>
      <div className="mt-10 md:mt-14">
        <ShopClient lang={lang} shippingHref={`/${lang}/versand-zahlung`} />
      </div>
      <p className="eyebrow mt-10 text-[11px] leading-relaxed text-muted">{t.facts}</p>
      <p className="mt-3 text-xs text-muted">{dictionaries[lang].footer.disclaimer}</p>
    </ShopShell>
  );
}
