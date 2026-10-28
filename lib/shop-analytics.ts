import { track } from "@vercel/analytics";
import { hasInternalMarker } from "./internal-mode-client";

/**
 * BL-097 (PO 2026-10-28) — three Vercel Web Analytics custom events for the fan shop, like configurator_click (BL-050).
 * Properties are exactly these, nothing else (Datenschutz Abschnitt 5): no personal data, no order or payment ids, no
 * country, no exact amount (a price band only, so an event cannot be matched to one Stripe order).
 * - shop_add_to_cart     { design, lang }               each "add to cart" action (card button, or each design of "add all")
 * - shop_checkout_start  { items, total_bucket, lang }  "Continue to payment" pressed, before /api/checkout is called
 * - shop_order_completed { lang }                       once on the success page (components/shop/OrderCompleted.tsx)
 * Devices in internal mode (zl_internal=1) are skipped here, and SiteAnalytics' beforeSend drops them again.
 */
export type ShopEvent =
  | { name: "shop_add_to_cart"; props: { design: string; lang: "de" | "en" } }
  | { name: "shop_checkout_start"; props: { items: number; total_bucket: TotalBucket; lang: "de" | "en" } }
  | { name: "shop_order_completed"; props: { lang: "de" | "en" } };

export type TotalBucket = "<10" | "10-20" | "20-50" | "50+";

/** The cart total before shipping (cents) as a band in euro: < 10 · 10–19.99 · 20–49.99 · 50 and up. */
export function totalBucket(cents: number): TotalBucket {
  if (cents < 1000) return "<10";
  if (cents < 2000) return "10-20";
  if (cents < 5000) return "20-50";
  return "50+";
}

const isInternal = () => typeof document !== "undefined" && hasInternalMarker(document.cookie);

/** Sends one shop event unless this device is in internal mode. `send` is replaceable for tests. */
export function trackShop(e: ShopEvent, send: (name: string, props: Record<string, string | number>) => void = track): boolean {
  if (isInternal()) return false;
  send(e.name, e.props);
  return true;
}
