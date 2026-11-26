import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { AVAILABLE } from "../lib/shop-products";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");

describe("start page: the shop in the body (BL-151)", () => {
  test("one shop section after 'Take a closer look', only when the shop is launched", () => {
    const page = read("app", "[lang]", "page.tsx");
    assert.match(page, /\{SHOP_LAUNCHED && \(\s*<section id="shop"[^>]*>\s*<HomeShopTeaser lang=\{lang\} \/>/);
    assert.ok(page.indexOf('<section id="garage"') < page.indexOf('<section id="shop"') && page.indexOf('<section id="shop"') < page.indexOf('<section id="next"'));
  });
  test("the card uses the shop's own words and its stickers on sale; it links to /<lang>/shop; no new tracking", () => {
    const card = read("components", "HomeShopTeaser.tsx");
    for (const k of ["s.eyebrow", "s.title[0]", "s.title[1]", "s.sub", "s.price", "s.vatNote", "t.nav.shop"]) assert.ok(card.includes(k), k);
    assert.match(card, /AVAILABLE\.map/);
    assert.equal(AVAILABLE.length, 4);
    assert.match(card, /href=\{`\/\$\{lang\}\/shop`\}/);
    assert.ok(!/track\(|sendStat|data-click-place/.test(card), "no new event or place");
  });
});
