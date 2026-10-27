import Stripe from "stripe";
import { isLocale, type Locale } from "@/lib/i18n";
import { shopOpenFor, usableStripeKey } from "@/lib/shop-flag";
import { cleanCart, priceCart, shippingFor, type PricedGroup } from "@/lib/shop-pricing";
import { isShipCountry, productById } from "@/lib/shop-products";

/**
 * BL-084 — starts a Stripe Checkout Session for the fan-shop cart (plan § 5). The browser sends only product ids, quantities,
 * the language and the shipping country; prices, bundles and shipping are computed here from lib/shop-products.ts, never
 * taken from the browser. Shipping-address collection is limited to the chosen country, so the shipping price always fits.
 * Nothing is stored on our side: the order lives in Stripe (the dashboard is the order list in phase 1).
 *
 * Closed (404) while the shop is not launched, except for the PO's devices and local/preview builds (lib/shop-flag.ts).
 * Before launch only a TEST key is accepted (a live key is refused). The key comes from the STRIPE_SECRET_KEY env var and is
 * never logged.
 */
export const dynamic = "force-dynamic";

const groupName = (g: PricedGroup, lang: Locale) => {
  const label = (id: string) => {
    const p = productById(id)!;
    return `${p.name[lang]} (${p.variant[lang]})`;
  };
  if (g.kind === "all") return lang === "de" ? "Sticker-Set: alle 9 Motive" : "Sticker set: all 9 designs";
  if (g.kind === "three") return `${lang === "de" ? "3 Sticker" : "3 stickers"}: ${g.items.map(label).join(", ")}`;
  return `Sticker: ${label(g.items[0])}`;
};

export async function POST(req: Request) {
  if (!shopOpenFor(req.headers.get("cookie"))) return Response.json({ error: "Not found" }, { status: 404 });

  const key = usableStripeKey(process.env.STRIPE_SECRET_KEY);
  if (!key) {
    console.error("checkout: no usable Stripe key (missing, or a live key before launch)");
    return Response.json({ error: "Checkout is not available" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { lang?: unknown; country?: unknown; cart?: unknown } | null;
  const lang: Locale = typeof body?.lang === "string" && isLocale(body.lang) ? body.lang : "de";
  const country = typeof body?.country === "string" ? body.country.toUpperCase() : "";
  if (!isShipCountry(country)) return Response.json({ error: "We ship to Germany and the EU only" }, { status: 400 });
  const cart = cleanCart(body?.cart);
  const { groups, subtotal, count } = priceCart(cart);
  if (count === 0) return Response.json({ error: "The cart is empty" }, { status: 400 });

  // Identical lines (e.g. two single Silver sedans) become one line with a quantity.
  const lines = new Map<string, { name: string; amount: number; quantity: number }>();
  for (const g of groups) {
    const name = groupName(g, lang);
    const k = `${name}|${g.amount}`;
    const line = lines.get(k);
    if (line) line.quantity += 1;
    else lines.set(k, { name, amount: g.amount, quantity: 1 });
  }

  const shipping = shippingFor(subtotal, country);
  const origin = new URL(req.url).origin;
  const stripe = new Stripe(key);
  try {
    const session = await stripe.checkout.sessions.create({
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
    });
    if (!session.url) throw new Error("Stripe returned no session URL");
    return Response.json({ url: session.url });
  } catch (err) {
    // Stripe error messages never contain the key; log only what failed.
    console.error("checkout: Stripe session failed:", err instanceof Error ? err.message : "unknown error");
    return Response.json({ error: "Checkout is not available" }, { status: 502 });
  }
}
