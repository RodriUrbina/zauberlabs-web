import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrderCompleted from "@/components/shop/OrderCompleted";
import ShopNotice from "@/components/shop/ShopNotice";
import ShopShell from "@/components/shop/ShopShell";
import { isLocale, type Locale } from "@/lib/i18n";
import { shopCopy } from "@/lib/shop-copy";
import { requireShopOpen } from "@/lib/shop-gate";

/** BL-084 — where Stripe Checkout returns after a successful payment (the cart is emptied; BL-097: the completion is counted once). Hidden like the shop. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ShopSuccessPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  await requireShopOpen();
  const t = shopCopy[lang].success;
  const other: Locale = lang === "de" ? "en" : "de";
  return (
    <ShopShell lang={lang} otherHref={`/${other}/shop`}>
      <OrderCompleted lang={lang} />
      <ShopNotice lang={lang} title={t.title} body={t.body} back={t.back} />
    </ShopShell>
  );
}
