import type Stripe from "stripe";
import type { Locale } from "./i18n";
import { priceCart, shippingFor, type Cart, type PricedGroup } from "./shop-pricing";
import { productById, type ShipCountry } from "./shop-products";

/**
 * BL-084/BL-089 — the Stripe Checkout Session for a cleaned cart, built without calling Stripe (app/api/checkout sends it), so
 * the exact line items can be tested and shown. Prices, bundles and shipping come from lib/shop-products.ts, never from the
 * browser. Shipping-address collection is limited to the chosen country, so the shipping price always fits.
 */

/** "Limousine Japanrot" — BL-089: the BMW colour name where a design has one (it is printed on the receipt), else the variant. */
export const stickerLabel = (id: string, lang: Locale) => {
  const p = productById(id)!;
  return p.colour ? `${p.name[lang]} ${p.colour[lang]}` : `${p.name[lang]} (${p.variant[lang]})`;
};

export const groupName = (g: PricedGroup, lang: Locale) => {
  const names = g.items.map((id) => stickerLabel(id, lang)).join(", ");
  if (g.kind === "all") return lang === "de" ? `Sticker-Set: alle ${g.items.length} Motive (${names})` : `Sticker set: all ${g.items.length} designs (${names})`;
  if (g.kind === "three") return `${lang === "de" ? "3 Sticker" : "3 stickers"}: ${names}`;
  return `Sticker: ${names}`;
};

export function sessionParams(cart: Cart, lang: Locale, country: ShipCountry, origin: string): Stripe.Checkout.SessionCreateParams {
  const { groups, subtotal } = priceCart(cart);
  // Identical lines (e.g. two single red sedans) become one line with a quantity.
  const lines = new Map<string, { name: string; amount: number; quantity: number }>();
  for (const g of groups) {
    const name = groupName(g, lang);
    const k = `${name}|${g.amount}`;
    const line = lines.get(k);
    if (line) line.quantity += 1;
    else lines.set(k, { name, amount: g.amount, quantity: 1 });
  }
  const shipping = shippingFor(subtotal, country);
  return {
    mode: "payment",
    submit_type: "pay", // § 312j BGB: the final button must clearly mean "pay"
    locale: lang,
    line_items: [...lines.values()].map((l) => ({
      quantity: l.quantity,
      price_data: { currency: "eur", unit_amount: l.amount, product_data: { name: l.name } },
    })),
    shipping_address_collection: { allowed_countries: [country] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shipping, currency: "eur" },
          display_name:
            country === "DE"
              ? lang === "de" ? "Deutsche Post, Brief" : "Deutsche Post, letter"
              : lang === "de" ? "DHL Päckchen (EU)" : "DHL small parcel (EU)",
        },
      },
    ],
    // The packing list for the PO, next to the order in the Stripe dashboard (ids and quantities only).
    metadata: { cart: Object.entries(cart).map(([id, q]) => `${id}:${q}`).join(","), country },
    success_url: `${origin}/${lang}/shop/success`,
    cancel_url: `${origin}/${lang}/shop/cancel`,
  };
}
