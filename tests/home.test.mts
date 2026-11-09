import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { dictionaries, E46_SECTIONS, e46SectionUrl, e46StartUrl, LOCALES } from "../lib/i18n";
import { SITE_OG_IMAGE } from "../lib/blog-og";

const pub = (p: string) => path.join(process.cwd(), "public", p);

describe("home page (BL-053)", () => {
  test("body buttons use the agreed E46BUILD start values, same in EN and DE (BL-064)", () => {
    for (const lang of LOCALES) {
      assert.deepEqual(dictionaries[lang].garage.bodies.map((b) => b.start), ["sedan", "touring", "coupe", "convertible", "compact", "m3"]);
    }
    assert.equal(e46StartUrl("coupe", "en"), "https://e46.zauberlabs.de/?start=coupe");
    const hero = fs.readFileSync(path.join(process.cwd(), "components", "HomeHero.tsx"), "utf8");
    assert.match(hero, /href=\{e46StartUrl\(b\.start, lang\)\}\s+rel="nofollow"/, "start links carry rel=nofollow");
    assert.ok(!/e46StartUrl[\s\S]{0,200}target=/.test(hero), "start links stay in the same tab");
  });
  test("the block under the garage panel is gone, EN and DE: heading, body tiles, value chips, button; the hero body pills stay (BL-114)", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    assert.ok(!/garage\.(bodies|configure|startLabel|values|open)|e46StartUrl/.test(page), "nothing of the block left on the page");
    const garage = page.slice(page.indexOf('<section id="garage"'), page.indexOf("</section>"));
    assert.ok(garage.trimEnd().endsWith("</div>") && garage.includes("<CloserLook "), "the panel is the section's last block");
    for (const lang of LOCALES) {
      const g = dictionaries[lang].garage as Record<string, unknown>;
      for (const k of ["startLabel", "configure", "values", "open"]) assert.ok(!(k in g), `${lang} ${k}`);
      for (const b of dictionaries[lang].garage.bodies) assert.deepEqual(Object.keys(b), ["name", "start"], `${lang} ${b.name}`);
    }
    assert.match(fs.readFileSync(path.join(process.cwd(), "components", "HomeHero.tsx"), "utf8"), /d\.garage\.bodies\.map/);
  });
  test("Take a closer look has the side text opposite its title, same slot and style as What's next (BL-115)", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    assert.match(page, /<p className="max-w-\[400px\] text-base leading-relaxed text-body">\{t\.garage\.body\}<\/p>/);
    assert.match(page, /<p className="max-w-\[400px\] text-base leading-relaxed text-body">\{t\.next\.body\}<\/p>/, "the same style as What's next");
    assert.equal(dictionaries.en.garage.body, "Tap a part, then “Try it on your E46” to start configuring your car from there.");
    assert.equal(dictionaries.de.garage.body, "Tippe auf ein Teil, dann auf „Probier es an deinem E46 aus“, um dein Auto ab dort zu konfigurieren.");
    assert.ok(dictionaries.en.garage.body.includes(`“${dictionaries.en.garage.cta}”`) && dictionaries.de.garage.body.includes(`„${dictionaries.de.garage.cta}“`), "names the panel button as it reads");
  });
  test("phone sticky bar reuses the hero CTA copy and watches the hero button, the What's next block and the footer (BL-079, BL-081)", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    assert.match(page, /<StickyStartBar href=\{e46Url\(lang\)\} label=\{t\.hero\.cta\} \/>/);
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
  test("hero copy: three-part headline with the accent word in the middle, no brand capital", () => {
    assert.deepEqual(dictionaries.en.hero.title, ["See what your ", "E46 can become.", ""], "BL-110");
    assert.deepEqual(dictionaries.de.hero.title, ["Was aus deinem ", "E46 werden kann.", ""], "BL-113");
    // BL-113: German on exactly two lines, the break after "deinem"; English as it was
    assert.match(fs.readFileSync(path.join(process.cwd(), "components", "HomeHero.tsx"), "utf8"), /breakBeforeAccent=\{lang === "de"\}\s*keepAccentTogether=\{lang === "de"\}/);
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
  test("closer look (BL-083, BL-124): six categories in the same order in EN and DE, each picture present and listed with its source", () => {
    const readme = fs.readFileSync(pub("/images/README.md"), "utf8");
    for (const lang of LOCALES) {
      const cats = dictionaries[lang].garage.cats;
      assert.deepEqual(cats.map((c) => c.key), ["headlights", "wheels", "bumpers", "seats", "steering", "infotainment"], lang);
      for (const c of cats) {
        assert.ok(fs.existsSync(pub(c.img)), c.img);
        assert.ok(readme.includes(`\`${c.img.replace("/images/", "")}\``), `${c.img} in public/images/README.md`);
        assert.ok(c.alt && c.line && c.label, `${lang} ${c.key} has label, line and alt`);
      }
    }
    // Editor fact-check: wheels and seats use ONE stage picture for every body, so those lines never say "your car".
    for (const c of dictionaries.en.garage.cats.filter((c) => ["wheels", "seats"].includes(c.key))) assert.ok(!/your (car|interior|cockpit)/.test(c.line), c.line);
    // PO 2026-10-27: every picture shows the part mounted on the car (E46BUILD's stage pictures, or the steering composite).
    const onCar: Record<string, string> = {
      headlights: "/images/closer-look/e46-headlight-look-bi-xenon-late-hires.webp", // the PO's high-res render, on the car (BL-083.3)
      bumpers: "/images/closer-look/e46-bumper-look-front-sedan-touring-m-package.webp", // bumper look, on the car
      wheels: "/images/closer-look/e46-wheel-stage-side.webp", // WHEEL_STAGE_SRC
      seats: "/images/closer-look/e46-seat-stage-interior-leather.webp", // SEAT_STAGE_SRC, leather since T-247.1 (BL-112)
      steering: "/images/closer-look/e46-steering-stage-cockpit-m3.webp", // empty cockpit + M3 cut-out (BL-112)
      infotainment: "/images/closer-look/e46-infotainment-stage-cockpit.webp", // cockpit + STANDARD cut-out, step 05 look (BL-124)
    };
    for (const lang of LOCALES) for (const c of dictionaries[lang].garage.cats) assert.equal(c.img, onCar[c.key], `${lang} ${c.key}`);
    assert.deepEqual(fs.readdirSync(pub("/images/closer-look")).sort(), Object.values(onCar).map((p) => path.basename(p)).sort(), "no part-only pictures left");
    const steeringScript = fs.readFileSync(path.join(process.cwd(), "scripts", "make-closer-look-steering.mjs"), "utf8");
    assert.match(steeringScript, /747 \/ 1672[\s\S]*413 \/ 1200[\s\S]*0\.98/, "T-170 geometry");
    assert.match(steeringScript, /e46-steering-cutout-standard\.webp", sha256: "737b02be233f22b820f1184c97e95fad3dd07b732074271de921fd71b6e792fc"[\s\S]*out: "e46-infotainment-stage-cockpit\.webp"/, "BL-124: the standard wheel for Infotainment");
    // BL-083.3: the headlight is the PO's 1536×1024 render, converted by a hash-checked script; phones get a smaller width.
    assert.match(fs.readFileSync(path.join(process.cwd(), "scripts", "make-closer-look-headlight.mjs"), "utf8"), /a814f65de7d61d74bd38f9e657d06145ec5fbc83c930a48bf4dadc1bf8581a51/);
    assert.match(fs.readFileSync(path.join(process.cwd(), "components", "CloserLook.tsx"), "utf8"), /sizes="[^"]*calc\(100vw - 72px\)"/);
    assert.equal(dictionaries.de.garage.title.join(""), "Sieh genauer hin.");
    assert.equal(dictionaries.de.garage.cta, "Probier es an deinem E46 aus");
  });
  test("closer look: the CTA opens E46BUILD at the chosen tab's section (T-179), nofollow, same tab (configurator_click, no new data); tabs are accessible", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    const cl = fs.readFileSync(path.join(process.cwd(), "components", "CloserLook.tsx"), "utf8");
    assert.match(page, /<CloserLook [^>]*hrefs=\{E46_LIVE \? t\.garage\.cats\.map\(\(c\) => e46SectionUrl\(c\.key, lang\)\) : null\}/);
    assert.match(cl, /href=\{hrefs\[on\]\}\s+rel="nofollow"/);
    // BL-083.1: every tab key is a T-179 section value (e46build start-body.ts START_SECTIONS), same in EN and DE.
    assert.deepEqual([...E46_SECTIONS].sort(), ["bumpers", "headlights", "infotainment", "seats", "steering", "wheels"]);
    for (const lang of LOCALES) for (const c of dictionaries[lang].garage.cats) assert.ok((E46_SECTIONS as readonly string[]).includes(c.key), `${lang} ${c.key}`);
    assert.equal(e46SectionUrl("steering", "en"), "https://e46.zauberlabs.de/?section=steering");
    assert.ok(!/target=|track\(/.test(cl), "same tab, no extra tracking call");
    assert.match(cl, /role="tablist"/);
    assert.match(cl, /role="tab"/);
    assert.match(cl, /aria-selected=\{i === on\}/);
    assert.match(cl, /role="tabpanel"/);
  });
  test("BL-100, BL-124: closer-look tabs in E46BUILD's order (Headlights, Wheels, Bumpers, Seats, Steering wheels, Infotainment); each tab links to its own section", async () => {
    const { e46SectionUrl } = await import("../lib/i18n");
    for (const lang of LOCALES) {
      const cats = dictionaries[lang].garage.cats;
      assert.deepEqual(cats.map((c) => c.key), ["headlights", "wheels", "bumpers", "seats", "steering", "infotainment"], lang);
      for (const c of cats) assert.equal(new URL(e46SectionUrl(c.key, lang)).searchParams.get("section"), c.key, `${lang} ${c.key}`);
    }
    assert.deepEqual(dictionaries.de.garage.cats.map((c) => c.label), ["Scheinwerfer", "Felgen", "Stoßstangen", "Sitze", "Lenkräder", "Infotainment"]);
    assert.equal(e46SectionUrl("infotainment", "de"), "https://e46.zauberlabs.de/de?section=infotainment", "E46BUILD T-278 startSlug");
    assert.match(fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8"), /hrefs=\{E46_LIVE \? t\.garage\.cats\.map\(\(c\) => e46SectionUrl\(c\.key, lang\)\) : null\}/, "hrefs built per key, so they follow the order");
  });
});


describe("What's next title (BL-107)", () => {
  test("the accent wraps as a whole, never between its words", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "page.tsx"), "utf8");
    assert.match(page, /<Title eyebrow=\{t\.next\.eyebrow\} lead=\{t\.next\.title\[0\]\} accent=\{t\.next\.title\[1\]\} keepAccentTogether /, "BL-111: the title code keeps it together");
    assert.deepEqual(dictionaries.de.next.title, ["Was kommt als Nächstes? ", "Du entscheidest."]);
    assert.deepEqual(dictionaries.en.next.title, ["What’s next? ", "You decide."]);
    assert.equal(dictionaries.de.next.body, "Tippe auf ein Auto und stimm ab. Das beliebteste bekommt den nächsten Konfigurator.", "BL-107 part 2");
  });
});

describe("closer look pictures (BL-112)", () => {
  test("leather seats and the M3 wheel, both E46BUILD's own, hash-checked; the panel texts unchanged", async () => {
    const { createHash } = await import("node:crypto");
    const sha = (p: string) => createHash("sha256").update(fs.readFileSync(path.join(process.cwd(), "public", p))).digest("hex");
    assert.equal(sha("/images/closer-look/e46-seat-stage-interior-leather.webp"), "5643ea34fbced2cc02b516a3c04e0e1fc43a71e5008f27e5c9e1075f48f4aede", "byte-identical to e46build seats/e46-seat-stage-interior.webp (T-247.1)");
    const script = fs.readFileSync(path.join(process.cwd(), "scripts", "make-closer-look-steering.mjs"), "utf8");
    assert.match(script, /e46-steering-cutout-m3\.webp", sha256: "6502ec23a418962f9629c5fc6645d1ad61bf13a79d9ef16aa396717f1d5b1f01"/);
    assert.match(script, /e46-steering-stage-cockpit\.webp", sha256: "49dd75052c14109488fa8cb359882b8769ce78da731f71f389f652b0eb95e731"/);
    const cats = (lang: "en" | "de") => Object.fromEntries(dictionaries[lang].garage.cats.map((c) => [c.key, c]));
    assert.equal(cats("en").seats.line, "Basic, sport or M3 seats, for your E46.");
    assert.equal(cats("en").steering.line, "Standard, sport, M Sport or M3 steering wheels for your E46.");
    assert.equal(cats("en").steering.alt, "E46 cockpit with an M3 steering wheel");
    assert.equal(cats("de").seats.alt, "E46-Innenraum mit schwarzen Leder-Sportsitzen");
  });
});
