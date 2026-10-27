import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { dictionaries, e46StartUrl, LOCALES } from "../lib/i18n";
import { SITE_OG_IMAGE } from "../lib/blog-og";

const pub = (p: string) => path.join(process.cwd(), "public", p);

describe("home page (BL-053)", () => {
  test("body buttons use the agreed E46BUILD start values, same in EN and DE (BL-064)", () => {
    for (const lang of LOCALES) {
      assert.deepEqual(dictionaries[lang].garage.bodies.map((b) => b.start), ["sedan", "touring", "coupe", "convertible", "compact", "m3"]);
    }
    assert.equal(e46StartUrl("coupe"), "https://e46.zauberlabs.de/?start=coupe");
    const hero = fs.readFileSync(path.join(process.cwd(), "components", "HomeHero.tsx"), "utf8");
    assert.match(hero, /href=\{e46StartUrl\(b\.start\)\}\s+rel="nofollow"/, "start links carry rel=nofollow");
    assert.ok(!/e46StartUrl[\s\S]{0,200}target=/.test(hero), "start links stay in the same tab");
  });
  test("garage tiles link to E46BUILD with the body pre-chosen, nofollow, same tab, with an accessible name (BL-079)", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    assert.match(page, /href=\{e46StartUrl\(b\.start\)\}\s+rel="nofollow"/);
    assert.match(page, /aria-label=\{t\.garage\.configure\(b\.name\)\}/);
    assert.ok(!/e46StartUrl[\s\S]{0,300}target=/.test(page), "tile links stay in the same tab");
    assert.equal(dictionaries.en.garage.configure("Sedan"), "Configure the Sedan");
    assert.equal(dictionaries.de.garage.configure("Limousine"), "Limousine konfigurieren");
  });
  test("phone sticky bar reuses the hero CTA copy and watches the hero button, the What's next block and the footer (BL-079, BL-081)", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    assert.match(page, /<StickyStartBar href=\{E46_URL\} label=\{t\.hero\.cta\} \/>/);
    assert.equal(dictionaries.de.hero.cta, "Starte mit deinem E46");
    const bar = fs.readFileSync(path.join(process.cwd(), "components", "StickyStartBar.tsx"), "utf8");
    assert.match(bar, /sm:hidden/, "phones only");
    assert.match(bar, /safe-area-inset-bottom/);
    assert.match(bar, /\[data-sticky-cta-hide\], footer/);
    assert.match(fs.readFileSync(path.join(process.cwd(), "components", "HomeHero.tsx"), "utf8"), /data-hero-cta/);
    assert.match(page, /id="next" data-sticky-cta-hide/);
  });
  test("the hero shows the M3 Touring photo, the garage does not repeat it, no video anywhere on the page, alt says never sold (BL-081, BL-083)", () => {
    assert.ok(fs.existsSync(pub("/images/e46-m3-touring-hero.webp")));
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    assert.ok(!/m3-touring/.test(page), "the garage section does not show the M3 Touring photo again");
    const hero = fs.readFileSync(path.join(process.cwd(), "components", "HomeHero.tsx"), "utf8");
    assert.ok(!page.includes("<video") && !hero.includes("<video"), "no loop on the home page");
    assert.match(hero, /alt=\{d\.garage\.e46CardAlt\}/);
    assert.match(dictionaries.en.garage.e46CardAlt, /never sold/);
    assert.match(dictionaries.de.garage.e46CardAlt, /nie verkauft/);
  });
  test("trimmed page (BL-081): only hero, garage, What's next, blog teaser; nav and footer point at sections that exist", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    const footer = fs.readFileSync(path.join(process.cwd(), "components", "SiteFooter.tsx"), "utf8");
    const ids = [...page.matchAll(/id="([a-z]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ["garage", "next", "suggest", "blog"]);
    const anchors = [...(page + footer).matchAll(/href=\{?[`"](?:\$\{homePath\})?#([a-z]+)/g)].map((m) => m[1]);
    for (const a of anchors) assert.ok(ids.includes(a), `#${a} exists`);
    assert.ok(!/ticker|t\.how|principles/.test(page), "ticker, how it works and principles are gone");
    assert.deepEqual(dictionaries.en.footer.next, ["Next: you decide", " → vote"]);
    assert.deepEqual(dictionaries.de.footer.next, ["Als Nächstes: du entscheidest", " → abstimmen"]);
    assert.match(page, /export const revalidate = 300/, "the blog teaser follows the publish schedule");
    assert.match(page, /getBlog\(\)\.listPosts\(lang\)/, "same visibility rules as /blog");
  });
  test("garage: five bodies plus the M3 in both languages, in order, each image present", () => {
    for (const lang of LOCALES) {
      const bodies = dictionaries[lang].garage.bodies;
      assert.deepEqual(bodies.map((b) => b.img), ["/images/sedan.jpg", "/images/touring.jpg", "/images/coupe.jpg", "/images/convertible.jpg", "/images/compact.jpg", "/images/m3.jpg"]);
      for (const b of bodies) assert.ok(fs.existsSync(pub(b.img)), b.img);
    }
  });
  test("hero copy: three-part headline with the accent word in the middle, no brand capital", () => {
    assert.deepEqual(dictionaries.en.hero.title, ["See what your ", "E46 could be.", ""]);
    assert.deepEqual(dictionaries.de.hero.title, ["Sieh, was dein ", "E46 sein kann.", ""]);
    for (const lang of LOCALES) {
      const d = dictionaries[lang];
      assert.ok(!JSON.stringify([d.hero, d.next, d.vote, d.garage, d.teaser, d.footer]).includes("Zauberlabs"), lang);
    }
  });
  test("link-preview image exists and is a JPEG (1200×630, BL-053)", () => {
    const buf = fs.readFileSync(pub(SITE_OG_IMAGE));
    assert.equal(buf.readUInt16BE(0), 0xffd8);
    assert.ok(!fs.existsSync(pub("/images/hero.jpg")), "the old hero.jpg is gone");
  });
  test("closer look (BL-083): five categories in the same order in EN and DE, each picture present and listed with its source", () => {
    const readme = fs.readFileSync(pub("/images/README.md"), "utf8");
    for (const lang of LOCALES) {
      const cats = dictionaries[lang].garage.cats;
      assert.deepEqual(cats.map((c) => c.key), ["headlights", "bumpers", "wheels", "seats", "steering"], lang);
      for (const c of cats) {
        assert.ok(fs.existsSync(pub(c.img)), c.img);
        assert.ok(readme.includes(`\`${c.img.replace("/images/", "")}\``), `${c.img} in public/images/README.md`);
        assert.ok(c.alt && c.line && c.label, `${lang} ${c.key} has label, line and alt`);
      }
    }
    // Editor fact-check: wheels, seats and steering use ONE stage picture for every body, so those lines never say "your car".
    for (const c of dictionaries.en.garage.cats.filter((c) => ["wheels", "seats", "steering"].includes(c.key))) assert.ok(!/your (car|interior|cockpit)/.test(c.line), c.line);
    assert.equal(dictionaries.de.garage.title.join(""), "Sieh genauer hin.");
    assert.equal(dictionaries.de.garage.cta, "Probier es an deinem E46 aus");
  });
  test("closer look: the CTA opens E46BUILD's start page in the same tab (configurator_click, no new data); tabs are accessible", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    const cl = fs.readFileSync(path.join(process.cwd(), "components", "CloserLook.tsx"), "utf8");
    assert.match(page, /<CloserLook [^>]*href=\{E46_LIVE \? E46_URL : null\}/);
    assert.ok(!/target=|track\(/.test(cl), "same tab, no extra tracking call");
    assert.match(cl, /role="tablist"/);
    assert.match(cl, /role="tab"/);
    assert.match(cl, /aria-selected=\{i === on\}/);
    assert.match(cl, /role="tabpanel"/);
  });
});
