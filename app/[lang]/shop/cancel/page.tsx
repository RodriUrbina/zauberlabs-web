import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopNotice from "@/components/shop/ShopNotice";
import ShopShell from "@/components/shop/ShopShell";
import { isLocale, type Locale } from "@/lib/i18n";
import { shopCopy } from "@/lib/shop-copy";
import { requireShopOpen } from "@/lib/shop-gate";

/** BL-084 — where Stripe Checkout returns when the buyer cancels (the cart stays). Hidden like the shop. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ShopCancelPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  await requireShopOpen();
  const t = shopCopy[lang].cancel;
  const other: Locale = lang === "de" ? "en" : "de";
  return (
    <ShopShell lang={lang} otherHref={`/${other}/shop`}>
      <ShopNotice lang={lang} title={t.title} body={t.body} back={t.back} />
    </ShopShell>
  );
}
