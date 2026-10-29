"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Arrow } from "@/components/Icons";
import type { Locale } from "@/lib/i18n";
import { countryName, shopCopy } from "@/lib/shop-copy";
import { cleanCart, formatEuro, itemCount, MAX_PER_PRODUCT, priceCart, shippingFor, type Cart } from "@/lib/shop-pricing";
import { trackShop, totalBucket } from "@/lib/shop-analytics";
import { AVAILABLE, GPSR, PRICES, SHIP_COUNTRIES, isShipCountry, productById, type ProductId, type ShipCountry } from "@/lib/shop-products";

/**
 * BL-084 — the shop's interactive part: product grid, bundle cards, the sticky cart bar and its drawer, and the hand-off to
 * Stripe Checkout (app/api/checkout). The cart lives in this browser's localStorage only (key below; described in the
 * prepared Datenschutz section) and every access is wrapped in try/catch, so the shop still works when storage is blocked.
 */
const CART_KEY = "zl_shop_cart";
const COUNTRY_KEY = "zl_shop_country";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked or full: the cart then lasts as long as the page
  }
}
/** BL-084: the success page empties the cart. */
export function clearShopCart() {
  try {
    window.localStorage.removeItem(CART_KEY);
  } catch {}
}

export default function ShopClient({ lang, shippingHref }: { lang: Locale; shippingHref: string | null }) {
  const t = shopCopy[lang];
  const [cart, setCart] = useState<Cart>({});
  const [country, setCountry] = useState<ShipCountry>("DE");
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<ProductId | null>(null);
  const [state, setState] = useState<"idle" | "paying" | "error">("idle");

  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // BL-085.1: a saved cart may hold a design that is no longer on sale; it is dropped here (and saved back), with a short
    // note, so the checkout never receives it.
    const saved = load<Record<string, unknown>>(CART_KEY, {});
    const clean = cleanCart(saved);
    setCart(clean);
    // BL-099: an old cart with more than 2 of a design is clamped to 2 and saved back (no note: nothing was removed).
    if (JSON.stringify(saved) !== JSON.stringify(clean)) save(CART_KEY, clean);
    if (saved && typeof saved === "object" && Object.keys(saved).length !== Object.keys(clean).length) setRemoved(true);
    const c = load(COUNTRY_KEY, "DE");
    if (typeof c === "string" && isShipCountry(c)) setCountry(c);
  }, []);

  const update = (next: Cart) => {
    const clean = cleanCart(next);
    setCart(clean);
    save(CART_KEY, clean);
  };
  /** BL-099: true when this design is at the per-order maximum (2). */
  const atMax = (id: ProductId) => (cart[id] ?? 0) >= MAX_PER_PRODUCT;
  /** Adds one of a design unless it is at the maximum; returns whether something was added. */
  const add = (id: ProductId) => {
    if (atMax(id)) return false;
    update({ ...cart, [id]: (cart[id] ?? 0) + 1 });
    return true;
  };
  const setQty = (id: ProductId, q: number) => update({ ...cart, [id]: q });
  const remove = (id: ProductId) => update({ ...cart, [id]: 0 });
  /** BL-099: "add all" adds only designs below the maximum; disabled when every design is at it. */
  const belowMax = AVAILABLE.filter((p) => !atMax(p.id));
  const addAll = () => {
    if (belowMax.length === 0) return;
    update({ ...cart, ...Object.fromEntries(belowMax.map((p) => [p.id, (cart[p.id] ?? 0) + 1])) } as Cart);
    // BL-097: one add-to-cart event per design actually added (there is no "set" product).
    for (const p of belowMax) trackShop({ name: "shop_add_to_cart", props: { design: p.id, lang } });
  };
  /** BL-097: an add-to-cart ACTION (the card button) is tracked, only when something was added; drawer +/− are not tracked. */
  const addToCart = (id: ProductId) => {
    if (add(id)) trackShop({ name: "shop_add_to_cart", props: { design: id, lang } });
  };

  const priced = useMemo(() => priceCart(cart), [cart]);
  const shipping = shippingFor(priced.subtotal, country);
  const count = itemCount(cart);
  const euro = (c: number) => formatEuro(c, lang);

  const pay = async () => {
    setState("paying");
    // BL-097: before /api/checkout is called; item count and a price band only (no exact total, no country, no ids).
    trackShop({ name: "shop_checkout_start", props: { items: count, total_bucket: totalBucket(priced.subtotal), lang } });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, country, cart }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || typeof json.url !== "string") throw new Error();
      window.location.assign(json.url);
    } catch {
      setState("error");
    }
  };

  // The drawer: Escape closes it; the page behind does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const vat = shippingHref ? (
    <Link href={shippingHref} className="underline decoration-line underline-offset-2 hover:text-ink">{t.vatNote}</Link>
  ) : (
    <span>{t.vatNote}</span>
  );

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AVAILABLE.map((p) => {
          const inCart = cart[p.id] ?? 0;
          const showDetails = details === p.id;
          return (
            <li key={p.id} className="flex flex-col overflow-hidden rounded-[22px] bg-ink-2 text-paper">
              <div className="relative aspect-[3/2]">
                <Image src={p.image} alt={`E46 ${p.name[lang]} – Sticker, ${p.variant[lang]}`} fill sizes="(min-width: 1440px) 320px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-contain p-3" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5 pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight">
                    {p.name[lang]} <span className="font-normal text-fog">· {p.variant[lang]}</span>
                  </h2>
                  <span className="shrink-0 font-semibold">{euro(PRICES.single)}</span>
                </div>
                {/* BL-089: the BMW colour name (lib/shop-products.ts COLOURS). */}
                {p.colour && <p className="-mt-2 text-sm text-fog">{p.colour[lang]}</p>}
                <p className="text-xs text-[#A9A6A0] [&_a]:decoration-[#4A4A52] [&_a:hover]:text-paper">{vat}</p>
                <div className="mt-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(p.id)}
                    disabled={atMax(p.id)}
                    aria-disabled={atMax(p.id)}
                    className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-paper px-4 text-[15px] font-semibold text-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-paper"
                  >
                    + {t.add}
                    {inCart > 0 && <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-paper">{inCart}</span>}
                  </button>
                  <button
                    type="button"
                    aria-expanded={showDetails}
                    aria-controls={`gpsr-${p.id}`}
                    onClick={() => setDetails(showDetails ? null : p.id)}
                    className="h-11 cursor-pointer rounded-full border border-[#3A3A40] px-4 text-sm font-semibold hover:border-fog"
                  >
                    {t.details}
                  </button>
                </div>
                {atMax(p.id) && <p className="-mt-1 text-xs text-fog">{t.cart.max}</p>}
                {/* GPSR product information (plan § 3 #8) */}
                <dl id={`gpsr-${p.id}`} hidden={!showDetails} className="flex flex-col gap-2 border-t border-ink-3 pt-3 text-[13px] leading-snug text-fog">
                  {p.colour && <div><dt className="eyebrow text-[10px] text-[#8A877F]">{t.gpsr.colour}</dt><dd>{p.colour[lang]}</dd></div>}
                  <div><dt className="eyebrow text-[10px] text-[#8A877F]">{t.gpsr.material}</dt><dd>{GPSR.material[lang]}{p.size ? `, ${t.size(p.size.w.toLocaleString(lang), p.size.h.toLocaleString(lang))}` : ""}. {GPSR.printed[lang]}</dd></div>
                  <div><dt className="eyebrow text-[10px] text-[#8A877F]">{t.gpsr.manufacturer}</dt><dd>{GPSR.manufacturer.name}, {GPSR.manufacturer.address}, {GPSR.manufacturer.email}</dd></div>
                  <div><dt className="eyebrow text-[10px] text-[#8A877F]">{t.gpsr.sku}</dt><dd className="font-mono">{p.sku}</dd></div>
                  <div><dt className="eyebrow text-[10px] text-[#8A877F]">{t.gpsr.care}</dt><dd>{GPSR.care[lang]}</dd></div>
                </dl>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Bundle row */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-[22px] border border-line bg-paper p-6">
          <div>
            <p className="text-xl font-extrabold tracking-tight">{t.bundles.three[0]} · {euro(PRICES.three)}</p>
            <p className="mt-1 text-sm text-body">{t.bundles.three[1]}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-ink p-6 text-paper">
          <div>
            <p className="text-xl font-extrabold tracking-tight">{t.bundles.all[0]} · {euro(PRICES.all)}</p>
            <p className="mt-1 text-sm text-fog">{t.bundles.all[1]}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={addAll}
              disabled={belowMax.length === 0}
              aria-disabled={belowMax.length === 0}
              className="h-11 cursor-pointer rounded-full bg-paper px-5 text-[15px] font-semibold text-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-paper"
            >
              + {t.bundles.addAll}
            </button>
            {belowMax.length === 0 && <span className="text-xs text-fog">{t.cart.max}</span>}
          </div>
        </div>
      </div>

      {/* Sticky cart bar */}
      {count > 0 && !open && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mx-auto flex h-14 w-full max-w-[560px] cursor-pointer items-center justify-between gap-3 rounded-full bg-ink px-6 text-[15px] font-semibold text-paper shadow-[0_6px_24px_rgba(14,14,16,0.28)] ring-1 ring-white/20"
          >
            <span>{t.cart.stickers(count)} · {euro(priced.subtotal)}</span>
            <span className="flex items-center gap-2">{t.cart.checkout} <Arrow className="size-[18px]" /></span>
          </button>
        </div>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-[560px] flex-col gap-5 overflow-y-auto rounded-t-[24px] bg-paper p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[24px]"
          >
            <div className="flex items-center justify-between">
              <h2 id="cart-title" className="text-2xl font-extrabold tracking-tight">{t.cart.title}</h2>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-sm font-semibold underline underline-offset-2">{t.cart.close}</button>
            </div>
            {removed && <p role="status" className="text-sm text-muted">{t.cart.removed}</p>}
            {count === 0 ? (
              <p className="text-body">{t.cart.empty}</p>
            ) : (
              <>
                <ul className="flex flex-col divide-y divide-line">
                  {AVAILABLE.filter((p) => cart[p.id]).map((p) => (
                    <li key={p.id} className="flex gap-3 py-3">
                      <span className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-lg bg-ink-2">
                        <Image src={p.image} alt="" fill sizes="72px" className="object-contain p-0.5" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <span className="text-sm">
                          <span className="block font-semibold">{p.name[lang]}</span>
                          <span className="block text-muted">{p.variant[lang]}</span>
                        </span>
                        {/* BL-099: stepper (44 px targets on phones; − at 1 removes the line) and a labelled remove, like Crate & Barrel;
                            + greyed at the maximum (Warby Parker) with our hint. */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1">
                            <button type="button" aria-label={`${t.cart.less}: ${p.name[lang]}, ${p.variant[lang]}`} onClick={() => setQty(p.id, (cart[p.id] ?? 1) - 1)} className="size-11 cursor-pointer rounded-full border border-line text-lg sm:size-9">−</button>
                            <span className="w-7 text-center font-mono text-sm" aria-live="polite">{cart[p.id]}</span>
                            <button
                              type="button"
                              aria-label={`${t.cart.more}: ${p.name[lang]}, ${p.variant[lang]}`}
                              onClick={() => add(p.id)}
                              disabled={atMax(p.id)}
                              aria-disabled={atMax(p.id)}
                              className="size-11 cursor-pointer rounded-full border border-line text-lg disabled:cursor-not-allowed disabled:opacity-35 sm:size-9"
                            >
                              +
                            </button>
                          </span>
                          <button type="button" aria-label={`${t.cart.remove}: ${p.name[lang]}, ${p.variant[lang]}`} onClick={() => remove(p.id)} className="min-h-11 cursor-pointer px-1 text-sm font-semibold text-muted underline underline-offset-2 hover:text-ink sm:min-h-9">
                            {t.cart.remove}
                          </button>
                        </div>
                        {atMax(p.id) && <p className="text-xs text-muted">{t.cart.max}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="flex flex-col gap-1.5 text-sm">
                  {priced.groups.map((g, i) => (
                    <div key={i} className="flex justify-between gap-3 text-muted">
                      <dt className="min-w-0">{t.cart.groups[g.kind]}{g.kind !== "all" && `: ${g.items.map((id) => `${productById(id)!.name[lang]} ${productById(id)!.variant[lang]}`).join(" · ")}`}</dt>
                      <dd>{euro(g.amount)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3 border-t border-line pt-2"><dt>{t.cart.subtotal}</dt><dd>{euro(priced.subtotal)}</dd></div>
                  <div className="flex justify-between gap-3"><dt>{t.cart.shipping}</dt><dd>{shipping === 0 ? t.cart.free : euro(shipping)}</dd></div>
                  <div className="flex justify-between gap-3 text-base font-bold"><dt>{t.cart.total}</dt><dd>{euro(priced.subtotal + shipping)}</dd></div>
                </dl>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  {t.cart.country}
                  <select
                    value={country}
                    onChange={(e) => {
                      if (!isShipCountry(e.target.value)) return;
                      setCountry(e.target.value);
                      save(COUNTRY_KEY, e.target.value);
                    }}
                    className="h-11 rounded-xl border border-line bg-white px-3 font-normal"
                  >
                    {[...SHIP_COUNTRIES].sort((a, b) => (a === "DE" ? -1 : b === "DE" ? 1 : countryName(a, lang).localeCompare(countryName(b, lang), lang))).map((c) => (
                      <option key={c} value={c}>{countryName(c, lang)}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={pay}
                  disabled={state === "paying"}
                  className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink text-base font-semibold text-paper hover:bg-black disabled:cursor-wait disabled:opacity-70"
                >
                  {state === "paying" ? t.cart.paying : <>{t.cart.pay} <Arrow className="size-[18px]" /></>}
                </button>
                {state === "error" && <p role="alert" className="text-sm text-accent">{t.cart.error}</p>}
                <p className="text-xs text-muted">{t.cart.note}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
