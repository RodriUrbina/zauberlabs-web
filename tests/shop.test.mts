import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { cleanCart, priceCart, shippingFor } from "../lib/shop-pricing";
import { AVAILABLE, PRODUCTS, SHIP_COUNTRIES } from "../lib/shop-products";
import { SHOP_LAUNCHED, shopOpenFor, usableStripeKey } from "../lib/shop-flag";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
const all4 = Object.fromEntries(AVAILABLE.map((p) => [p.id, 1]));

describe("fan shop (BL-084)", () => {
  test("nine products in the catalogue, four on sale at launch (PO 2026-10-27); unique ids and SKUs, images, both languages", () => {
    assert.equal(PRODUCTS.length, 9);
    assert.deepEqual(AVAILABLE.map((p) => p.id).sort(), ["convertible-black", "m3-yellow", "sedan-red", "touring-blue-stripes"]);
    for (const p of AVAILABLE) assert.ok(p.size && p.size.h === 2.5 && p.size.w >= 5 && p.size.w <= 5.5, `${p.id} has its printed size`);
    assert.equal(new Set(PRODUCTS.map((p) => p.id)).size, 9);
    assert.equal(new Set(PRODUCTS.map((p) => p.sku)).size, 9);
    const readme = read("public", "images", "README.md");
    for (const p of PRODUCTS) {
      assert.ok(fs.existsSync(path.join(process.cwd(), "public", p.image)), p.image);
      assert.ok(readme.includes(p.image.slice(1)), `${p.image} listed in public/images/README.md`);
      assert.ok(p.name.de && p.name.en && p.variant.de && p.variant.en, p.id);
    }
  });

  test("prices: €4.90 each, €12.90 any 3, €16.90 all 4, always the cheapest split", () => {
    assert.equal(priceCart({ "sedan-red": 1 }).subtotal, 490);
    assert.equal(priceCart({ "sedan-red": 2 }).subtotal, 980);
    assert.equal(priceCart({ "sedan-red": 1, "m3-yellow": 1, "convertible-black": 1 }).subtotal, 1290);
    assert.equal(priceCart({ "sedan-red": 3 }).subtotal, 1290, "any 3, also three of one design");
    assert.equal(priceCart({ "sedan-red": 4 }).subtotal, 1290 + 490, "four of one design are not the all-4 set");
    assert.equal(priceCart(all4).subtotal, 1690);
    assert.equal(priceCart({ ...all4, "m3-yellow": 2 }).subtotal, 1690 + 490);
    assert.equal(priceCart({ ...all4, "m3-yellow": 4 }).subtotal, 1690 + 1290);
    assert.equal(priceCart({ "sedan-red": 2, "m3-yellow": 2, "convertible-black": 2, "touring-blue-stripes": 2 }).subtotal, 2 * 1690);
    const g = priceCart({ "sedan-red": 2, "m3-yellow": 1, "convertible-black": 1 }).groups;
    assert.deepEqual(g.map((x) => x.kind), ["three", "single"]);
    assert.equal(g.flatMap((x) => x.items).length, 4, "every sticker is in exactly one group (the packing list)");
    assert.equal(priceCart({ "sedan-silver": 1, "coupe-blue": 1 } as never).subtotal, 0, "designs not on sale are never priced");
  });

  test("shipping: Germany €1.90, free from €15; other EU €6.90; no US", () => {
    assert.equal(shippingFor(490, "DE"), 190);
    assert.equal(shippingFor(1290, "DE"), 190);
    assert.equal(shippingFor(1500, "DE"), 0);
    assert.equal(shippingFor(2990, "DE"), 0);
    assert.equal(shippingFor(2990, "FR"), 690);
    assert.equal(SHIP_COUNTRIES.length, 27, "Germany + the 26 other EU member states");
    assert.ok(!(SHIP_COUNTRIES as readonly string[]).includes("US"));
  });

  test("the browser's cart is cleaned: unknown ids, bad quantities and prices are dropped", () => {
    assert.deepEqual(cleanCart({ "sedan-red": 2, nope: 1, "m3-yellow": -1, "convertible-black": 1.5, price: 1, "sedan-silver": 1 }), { "sedan-red": 2 });
    assert.deepEqual(cleanCart({ "sedan-red": 999 }), { "sedan-red": 20 });
    assert.deepEqual(cleanCart("x"), {});
  });

  test("hidden until launch: closed on production except for internal devices; open locally and on previews", () => {
    assert.equal(SHOP_LAUNCHED, false, "the flag is off by default");
    assert.equal(shopOpenFor("", false, true), false);
    assert.equal(shopOpenFor("zl_vid=abc", false, true), false);
    assert.equal(shopOpenFor("a=1; zl_internal=1", false, true), true);
    assert.equal(shopOpenFor("", false, false), true, "local and preview");
    assert.equal(shopOpenFor("", true, true), true, "launched");
  });

  test("a live Stripe key is refused before launch; test keys work", () => {
    assert.equal(usableStripeKey("sk_live_abc", false), null);
    assert.equal(usableStripeKey("rk_live_abc", false), null);
    assert.equal(usableStripeKey("sk_test_abc", false), "sk_test_abc");
    assert.equal(usableStripeKey("sk_live_abc", true), "sk_live_abc");
    assert.equal(usableStripeKey(undefined, false), null);
  });

  test("checkout route: 404 for the public on production, 503 without a usable key, 400 for a bad country, before any Stripe call", async () => {
    const { POST } = await import("../app/api/checkout/route");
    const env = { ...process.env };
    const call = (cookie: string, body: unknown) =>
      POST(new Request("https://www.zauberlabs.de/api/checkout", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body) }));
    const cart = { "sedan-red": 1 };
    try {
      process.env.VERCEL_ENV = "production";
      delete process.env.STRIPE_SECRET_KEY;
      assert.equal((await call("", { lang: "de", country: "DE", cart })).status, 404);
      assert.equal((await call("zl_internal=1", { lang: "de", country: "DE", cart })).status, 503, "no key");
      process.env.STRIPE_SECRET_KEY = "sk_live_not_a_real_key";
      assert.equal((await call("zl_internal=1", { lang: "de", country: "DE", cart })).status, 503, "live key refused");
      process.env.STRIPE_SECRET_KEY = "sk_test_not_a_real_key";
      assert.equal((await call("zl_internal=1", { lang: "de", country: "US", cart })).status, 400, "no US");
      assert.equal((await call("zl_internal=1", { lang: "de", country: "DE", cart: {} })).status, 400, "empty cart");
      assert.equal((await call("zl_internal=1", { lang: "de", country: "DE", cart: { "sedan-red": 1, "coupe-blue": 1 } })).status, 400, "a design not on sale is refused");
    } finally {
      process.env = env;
    }
    const src = read("app", "api", "checkout", "route.ts");
    assert.ok(src.indexOf("shopOpenFor(") < src.indexOf("usableStripeKey("), "the gate comes first");
    assert.match(src, /submit_type: "pay"/);
    assert.match(src, /allowed_countries: \[country\]/);
    assert.ok(!/console\.\w+\([^)]*[(,]\s*(key|process\.env\.STRIPE_SECRET_KEY)\s*[,)]/.test(src), "the key is never logged");
  });

  test("withdrawal route: closed like the shop; validates; 503 without BREVO_API_KEY; sends the confirmation to the customer with a copy to us", async () => {
    const { POST } = await import("../app/api/withdrawal/route");
    const env = { ...process.env };
    const realFetch = globalThis.fetch;
    const sent: { url: string; headers: Record<string, string>; body: Record<string, unknown> }[] = [];
    const call = (cookie: string, body: unknown) => POST(new Request("https://www.zauberlabs.de/api/withdrawal", { method: "POST", headers: { cookie }, body: JSON.stringify(body) }));
    const valid = { name: "Erika Muster", email: "erika@example.org", order: "1234-5678", orderedAt: "2026-10-27", items: "M3 Gelb" };
    try {
      process.env.VERCEL_ENV = "production";
      delete process.env.BREVO_API_KEY;
      assert.equal((await call("", valid)).status, 404);
      assert.equal((await call("zl_internal=1", { name: "A" })).status, 400);
      assert.equal((await call("zl_internal=1", { ...valid, email: "nope" })).status, 400);
      assert.equal((await call("zl_internal=1", valid)).status, 503, "no key: no fake success");
      process.env.BREVO_API_KEY = "test-key-not-real";
      globalThis.fetch = (async (url: string, init: RequestInit) => {
        sent.push({ url: String(url), headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
        return new Response("{}", { status: 201 });
      }) as typeof fetch;
      const res = await call("zl_internal=1", valid);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.match(json.receivedAtText, /\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}:\d{2} Uhr/);
      assert.equal(sent.length, 1);
      assert.equal(sent[0].url, "https://api.brevo.com/v3/smtp/email");
      assert.equal(sent[0].headers["api-key"], "test-key-not-real");
      assert.deepEqual(sent[0].body.to, [{ email: "erika@example.org", name: "Erika Muster" }]);
      assert.deepEqual(sent[0].body.bcc, [{ email: "hello@zauberlabs.de" }]);
      const text = String(sent[0].body.textContent);
      for (const part of ["§ 356a BGB", "Eingegangen am:", "Erika Muster", "1234-5678", "Bestellt am: 27.10.2026", "M3 Gelb"]) assert.ok(text.includes(part), part);
      assert.equal((await call("zl_internal=1", { ...valid, website: "spam" })).status, 200, "honeypot answers ok");
      assert.equal(sent.length, 1, "...but sends nothing");
      globalThis.fetch = (async () => new Response("{}", { status: 400 })) as typeof fetch;
      assert.equal((await call("zl_internal=1", valid)).status, 502, "Brevo refused: the form shows our address instead");
    } finally {
      process.env = env;
      globalThis.fetch = realFetch;
    }
  });

  test("with the flag off nothing links to or indexes the shop, and the prepared legal texts do not render", () => {
    for (const p of [["app", "[lang]", "shop", "page.tsx"], ["app", "[lang]", "shop", "success", "page.tsx"], ["app", "[lang]", "shop", "cancel", "page.tsx"],
      ["app", "[lang]", "agb", "page.tsx"], ["app", "[lang]", "widerrufsbelehrung", "page.tsx"], ["app", "[lang]", "versand-zahlung", "page.tsx"], ["app", "[lang]", "vertrag-widerrufen", "page.tsx"]]) {
      assert.match(read(...p), /await requireShopOpen\(\)/, p.join("/"));
    }
    assert.match(read("app", "[lang]", "shop", "page.tsx"), /robots: \{ index: SHOP_LAUNCHED, follow: SHOP_LAUNCHED \}/);
    assert.match(read("app", "sitemap.ts"), /SHOP_LAUNCHED \? \[page\("\/shop"/);
    const footer = read("components", "SiteFooter.tsx");
    assert.match(footer, /\{SHOP_LAUNCHED && \(\s*<>\s*<Link href=\{`\/\$\{lang\}\/shop`\}/);
    assert.ok(!/\/shop/.test(read("app", "[lang]", "page.tsx")), "no shop link on the home page");
    const ds = read("app", "[lang]", "datenschutz", "page.tsx");
    assert.match(ds, /\{SHOP_LAUNCHED && \(\s*<>\s*<h2>15\. Bestellungen und Zahlungen/);
    assert.match(ds, /localStorage[\s\S]*zl_shop_cart/, "the cart in browser storage is disclosed");
    const imp = read("app", "[lang]", "impressum", "page.tsx");
    assert.match(imp, /\{SHOP_LAUNCHED \? \(\s*<>\s*Kaufverträge über Teile/, "the shop sentence is flag-only");
    assert.match(imp, /nicht bereit und nicht verpflichtet/, "VSBG wording, always");
    assert.match(read("components", "LegalPage.tsx"), /\{SHOP_LAUNCHED && isLocale\(lang\) && <SiteFooter/, "Vertrag widerrufen reachable from the legal pages too");
    for (const p of [["app", "[lang]", "agb", "page.tsx"], ["app", "[lang]", "widerrufsbelehrung", "page.tsx"], ["app", "[lang]", "versand-zahlung", "page.tsx"], ["app", "[lang]", "datenschutz", "page.tsx"]]) {
      assert.ok(!/\[(zu bestätigen|to confirm|X\]|Datum|launch date)/.test(read(...p)), `${p.join("/")}: no open placeholders`);
    }
  });
});
