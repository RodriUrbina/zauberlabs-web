import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { dictionaries, LOCALES } from "../lib/i18n";
import { SITE_OG_IMAGE } from "../lib/blog-og";

const pub = (p: string) => path.join(process.cwd(), "public", p);

describe("home page (BL-053)", () => {
  test("garage card: the M3 Touring image (BL-053.1), no second video on the page", () => {
    assert.ok(fs.existsSync(pub("/images/e46-m3-touring-garage.webp")));
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    assert.ok(!page.includes("<video"), "the loop plays in the hero only");
    assert.match(dictionaries.en.garage.e46CardAlt, /never sold/);
  });
  test("garage: five bodies in both languages, in order, each image present", () => {
    for (const lang of LOCALES) {
      const bodies = dictionaries[lang].garage.bodies;
      assert.deepEqual(bodies.map((b) => b.img), ["/images/sedan.jpg", "/images/touring.jpg", "/images/coupe.jpg", "/images/convertible.jpg", "/images/compact.jpg"]);
      for (const b of bodies) assert.ok(fs.existsSync(pub(b.img)), b.img);
    }
  });
  test("hero copy: three-part headline with the accent word in the middle, no brand capital", () => {
    assert.deepEqual(dictionaries.en.hero.title[1], "magic");
    assert.deepEqual(dictionaries.de.hero.title[1], "Zauber");
    for (const lang of LOCALES) {
      const d = dictionaries[lang];
      assert.ok(!JSON.stringify([d.hero, d.principles, d.garage]).includes("Zauberlabs"), lang);
    }
  });
  test("link-preview image exists and is a JPEG (1200×630, BL-053)", () => {
    const buf = fs.readFileSync(pub(SITE_OG_IMAGE));
    assert.equal(buf.readUInt16BE(0), 0xffd8);
    assert.ok(!fs.existsSync(pub("/images/hero.jpg")), "the old hero.jpg is gone");
  });
});
