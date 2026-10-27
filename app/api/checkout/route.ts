import Stripe from "stripe";
import { isLocale, type Locale } from "@/lib/i18n";
import { shopOpenFor, usableStripeKey } from "@/lib/shop-flag";
import { sessionParams } from "@/lib/shop-checkout";
import { cleanCart, priceCart } from "@/lib/shop-pricing";
import { availableById, isShipCountry, productById } from "@/lib/shop-products";

/**
 * BL-084 — starts a Stripe Checkout Session for the fan-shop cart (plan § 5). The browser sends only product ids, quantities,
 * the language and the shipping country; the session (prices, bundles, shipping, line-item names) is built by
 * lib/shop-checkout.ts from lib/shop-products.ts, never taken from the browser. Nothing is stored on our side: the order lives in Stripe (the dashboard is the order list in phase 1).
 *
 * Closed (404) while the shop is not launched, except for the PO's devices and local/preview builds (lib/shop-flag.ts).
 * Before launch only a TEST key is accepted (a live key is refused). The key comes from the STRIPE_SECRET_KEY env var and is
 * never logged.
 */
export const dynamic = "force-dynamic";

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
  // BL-085: designs that are not on sale are refused outright (not silently dropped), so a stale cart cannot buy them.
  if (body?.cart && typeof body.cart === "object" && Object.keys(body.cart).some((id) => productById(id) && !availableById(id))) {
    return Response.json({ error: "A design in the cart is not available" }, { status: 400 });
  }
  const cart = cleanCart(body?.cart);
  if (priceCart(cart).count === 0) return Response.json({ error: "The cart is empty" }, { status: 400 });

  const stripe = new Stripe(key);
  try {
    const session = await stripe.checkout.sessions.create(sessionParams(cart, lang, country, new URL(req.url).origin));
    if (!session.url) throw new Error("Stripe returned no session URL");
    return Response.json({ url: session.url });
  } catch (err) {
    // Stripe error messages never contain the key; log only what failed.
    console.error("checkout: Stripe session failed:", err instanceof Error ? err.message : "unknown error");
    return Response.json({ error: "Checkout is not available" }, { status: 502 });
  }
}
