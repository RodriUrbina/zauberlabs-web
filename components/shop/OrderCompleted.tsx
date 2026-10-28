"use client";

import { useEffect } from "react";
import { trackShop } from "@/lib/shop-analytics";
import { clearShopCart } from "./ShopClient";

/** Guard key per Stripe session; the session id itself is only used as this local key and never sent anywhere. */
export const ORDER_TRACKED_KEY = (sessionId: string) => `zl_order_tracked:${sessionId}`;

/** Fires at most once per page load, even if sessionStorage is unavailable. */
let firedThisLoad = false;

/**
 * BL-097 — once per order: "shop_order_completed" { lang }. The reload guard lives in sessionStorage, keyed by the Stripe
 * session id from the URL (?session_id=). If storage throws, the event still fires at most once per page load.
 * Returns whether it fired (for tests).
 */
export function completeOrderOnce(lang: "de" | "en", sessionId: string | null, storage: Pick<Storage, "getItem" | "setItem"> | null, send?: Parameters<typeof trackShop>[1]): boolean {
  if (firedThisLoad) return false;
  if (sessionId && storage) {
    try {
      if (storage.getItem(ORDER_TRACKED_KEY(sessionId))) return false;
      storage.setItem(ORDER_TRACKED_KEY(sessionId), "1");
    } catch {
      // storage blocked: fall back to once per page load
    }
  }
  firedThisLoad = true;
  return trackShop({ name: "shop_order_completed", props: { lang } }, send);
}

/** Test hook: forget the per-load flag. */
export const resetOrderOnceForTests = () => {
  firedThisLoad = false;
};

/** BL-084 + BL-097 — on the success page: the order is paid, so the cart is emptied and the completion counted once. */
export default function OrderCompleted({ lang }: { lang: "de" | "en" }) {
  useEffect(() => {
    clearShopCart();
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      storage = null;
    }
    completeOrderOnce(lang, sessionId, storage);
  }, [lang]);
  return null;
}
