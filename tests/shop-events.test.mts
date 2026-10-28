import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { totalBucket, trackShop } from "../lib/shop-analytics";
import { completeOrderOnce, ORDER_TRACKED_KEY, resetOrderOnceForTests } from "../components/shop/OrderCompleted";
import { withoutSessionId } from "../lib/internal-mode-client";
import { AVAILABLE } from "../lib/shop-products";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
type Sent = { name: string; props: Record<string, string | number> };
const recorder = () => {
  const sent: Sent[] = [];
  return { sent, send: (name: string, props: Record<string, string | number>) => void sent.push({ name, props }) };
};
const setCookie = (c: string) => Object.defineProperty(globalThis, "document", { value: { cookie: c }, configurable: true });

describe("shop analytics events (BL-097)", () => {
  beforeEach(() => {
    setCookie("");
    resetOrderOnceForTests();
  });

  test("event names and exact property sets", () => {
    const r = recorder();
    trackShop({ name: "shop_add_to_cart", props: { design: "m3-yellow", lang: "de" } }, r.send);
    trackShop({ name: "shop_checkout_start", props: { items: 3, total_bucket: totalBucket(1290), lang: "en" } }, r.send);
    trackShop({ name: "shop_order_completed", props: { lang: "de" } }, r.send);
    assert.deepEqual(r.sent, [
      { name: "shop_add_to_cart", props: { design: "m3-yellow", lang: "de" } },
      { name: "shop_checkout_start", props: { items: 3, total_bucket: "10-20", lang: "en" } },
      { name: "shop_order_completed", props: { lang: "de" } },
    ]);
    for (const e of r.sent) assert.ok(Object.keys(e.props).every((k) => ["design", "lang", "items", "total_bucket"].includes(k)), JSON.stringify(e));
  });

  test("price bands (cart total before shipping): edges", () => {
    assert.equal(totalBucket(0), "<10");
    assert.equal(totalBucket(490), "<10");
    assert.equal(totalBucket(999), "<10");
    assert.equal(totalBucket(1000), "10-20");
    assert.equal(totalBucket(1999), "10-20");
    assert.equal(totalBucket(2000), "20-50");
    assert.equal(totalBucket(4999), "20-50");
    assert.equal(totalBucket(5000), "50+");
    assert.equal(totalBucket(16900), "50+");
  });

  test("internal devices (zl_internal=1) send nothing", () => {
    setCookie("a=1; zl_internal=1");
    const r = recorder();
    assert.equal(trackShop({ name: "shop_add_to_cart", props: { design: "sedan-red", lang: "de" } }, r.send), false);
    assert.equal(completeOrderOnce("de", "cs_test_1", null, r.send), false);
    assert.equal(r.sent.length, 0);
  });

  test("order completed: once per session id across reloads; the id is only the storage key, never in the event", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const r = recorder();
    assert.equal(completeOrderOnce("en", "cs_test_abc", storage, r.send), true);
    resetOrderOnceForTests(); // a reload
    assert.equal(completeOrderOnce("en", "cs_test_abc", storage, r.send), false);
    assert.ok(store.has(ORDER_TRACKED_KEY("cs_test_abc")));
    assert.deepEqual(r.sent, [{ name: "shop_order_completed", props: { lang: "en" } }]);
    assert.ok(!JSON.stringify(r.sent).includes("cs_test"));
  });

  test("order completed: storage throws → still at most once per page load", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const r = recorder();
    assert.equal(completeOrderOnce("de", "cs_test_x", broken, r.send), true);
    assert.equal(completeOrderOnce("de", "cs_test_x", broken, r.send), false);
    assert.equal(r.sent.length, 1);
  });

  test("wiring: card button and 'add all' fire per design, drawer +/- does not; checkout fires before /api/checkout; success page uses the guard", () => {
    const shop = read("components", "shop", "ShopClient.tsx");
    assert.match(shop, /onClick=\{\(\) => addToCart\(p\.id\)\}/, "card button");
    assert.match(shop, /for \(const p of AVAILABLE\) trackShop\(\{ name: "shop_add_to_cart"/, "add all: one event per design");
    assert.match(shop, /aria-label=\{`\$\{t\.cart\.more\}[^`]*`\} onClick=\{\(\) => add\(p\.id\)\}/, "drawer + uses add() without tracking");
    assert.ok(shop.indexOf('name: "shop_checkout_start"') < shop.indexOf('fetch("/api/checkout"'), "checkout_start before the API call");
    assert.match(read("app", "[lang]", "shop", "success", "page.tsx"), /<OrderCompleted lang=\{lang\} \/>/);
    assert.match(read("lib", "shop-checkout.ts"), /success_url: `\$\{origin\}\/\$\{lang\}\/shop\/success\?session_id=\{CHECKOUT_SESSION_ID\}`/);
    assert.equal(AVAILABLE.length, 4);
  });

  test("the Stripe session id never reaches Vercel Web Analytics page views", () => {
    assert.equal(withoutSessionId("https://www.zauberlabs.de/de/shop/success?session_id=cs_live_123"), "https://www.zauberlabs.de/de/shop/success");
    assert.equal(withoutSessionId("https://www.zauberlabs.de/de/shop?x=1&session_id=cs_1"), "https://www.zauberlabs.de/de/shop?x=1");
    assert.equal(withoutSessionId("https://www.zauberlabs.de/de"), "https://www.zauberlabs.de/de");
    assert.match(read("components", "SiteAnalytics.tsx"), /if \(isInternal\(\)\) return null;\s*return \{ \.\.\.event, url: withoutSessionId\(event\.url\) \};/);
  });

  test("Datenschutz Abschnitt 5 names the shop events and their only contents", () => {
    const ds = read("app", "[lang]", "datenschutz", "page.tsx");
    assert.match(ds, /Ebenso zählen wir im Fan-Shop[\s\S]*nur das Motiv, die Anzahl der Sticker, eine Preisspanne und die\s+Sprache der Seite[\s\S]*Bestell- oder\s+Zahlungsnummern sind nicht dabei\./);
  });
});
