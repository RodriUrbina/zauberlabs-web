import { AVAILABLE, PRICES, SHIPPING, availableById, type ProductId, type ShipCountry } from "./shop-products";

/** A cart as the browser keeps it: product id → quantity. */
export type Cart = Partial<Record<ProductId, number>>;

/** BL-099 (PO 2026-10-29): at most 2 of each design per order. */
export const MAX_PER_PRODUCT = 2;

/** Keeps only products on sale with a whole quantity, clamped to 1–MAX_PER_PRODUCT; anything else is dropped (never trust the browser). */
export function cleanCart(input: unknown): Cart {
  const out: Cart = {};
  if (!input || typeof input !== "object") return out;
  for (const [id, qty] of Object.entries(input as Record<string, unknown>)) {
    if (!availableById(id) || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) continue;
    out[id as ProductId] = Math.min(qty, MAX_PER_PRODUCT);
  }
  return out;
}

export const itemCount = (cart: Cart) => Object.values(cart).reduce((n, q) => n + (q ?? 0), 0);

/**
 * How the cart is priced (plan § 4.2; BL-085 PO 2026-10-27): each complete set of all available designs (4) costs €16.90;
 * of the rest, every 3 stickers (any designs) cost €12.90 and the remaining 1–2 cost €4.90 each. This is always the
 * cheapest split.
 * `groups` says which stickers are in which priced group, so the Stripe lines (and the PO's packing list) name them.
 */
export type PricedGroup = { kind: "all" | "three" | "single"; amount: number; items: ProductId[] };

export function priceCart(cart: Cart): { groups: PricedGroup[]; subtotal: number; count: number } {
  const left: Record<string, number> = { ...cart } as Record<string, number>;
  const groups: PricedGroup[] = [];
  const sets = Math.min(...AVAILABLE.map((p) => left[p.id] ?? 0));
  for (let i = 0; i < sets; i++) {
    groups.push({ kind: "all", amount: PRICES.all, items: AVAILABLE.map((p) => p.id) });
    for (const p of AVAILABLE) left[p.id] -= 1;
  }
  // The rest in catalogue order, so the same cart always gives the same groups.
  const rest: ProductId[] = AVAILABLE.flatMap((p) => Array.from({ length: left[p.id] ?? 0 }, () => p.id));
  for (let i = 0; i + 3 <= rest.length; i += 3) groups.push({ kind: "three", amount: PRICES.three, items: rest.slice(i, i + 3) });
  for (const id of rest.slice(rest.length - (rest.length % 3))) groups.push({ kind: "single", amount: PRICES.single, items: [id] });
  return { groups, subtotal: groups.reduce((s, g) => s + g.amount, 0), count: itemCount(cart) };
}

/** Shipping for a goods subtotal (cents) to a country: Germany €1.90, free from €15; other EU countries €6.90. */
export function shippingFor(subtotal: number, country: ShipCountry): number {
  if (country === "DE") return subtotal >= SHIPPING.deFreeFrom ? 0 : SHIPPING.de;
  return SHIPPING.eu;
}

/** "1290" → "12,90 €" (de) / "€12.90" (en). */
export function formatEuro(cents: number, lang: "de" | "en"): string {
  return new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
