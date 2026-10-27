import { hasInternalMarker } from "./internal-mode-client";

/**
 * BL-084 — THE SHOP SWITCH (PO 2026-10-27: "hidden until launch"). One flag controls everything that changes at launch:
 * - off (default): /shop, its success/cancel pages and the prepared legal pages answer 404 on production, except on devices with
 *   the zl_internal marker (the PO's own; BL-039); local and preview builds show them. The checkout route refuses the same
 *   requests. No nav/footer link to the shop, the shop is noindex and not in the sitemap, and the prepared Datenschutz section,
 *   the Impressum change and the footer's shop/legal links do not render anywhere.
 * - on: set SHOP_LAUNCHED=1 on Vercel (server-side env, read at request/build time).
 */
export const SHOP_LAUNCHED = (process.env.SHOP_LAUNCHED ?? "0") === "1";

/** Production on Vercel; local builds and previews are not. */
const isProduction = () => process.env.VERCEL_ENV === "production";

/** Whether the shop pages and the checkout are open for a request with this Cookie header. */
export function shopOpenFor(cookieHeader: string | null | undefined, launched = SHOP_LAUNCHED, production = isProduction()): boolean {
  return launched || !production || hasInternalMarker(cookieHeader ?? "");
}

/**
 * Guard against taking real money before launch: while the shop is not launched, a live secret key is refused, so only
 * Stripe TEST mode can create sessions. Returns the key to use, or null.
 */
export function usableStripeKey(key: string | null | undefined, launched = SHOP_LAUNCHED): string | null {
  if (!key) return null;
  if (!launched && /^(sk|rk)_live_/.test(key)) return null; // secret or restricted live key
  return key;
}
