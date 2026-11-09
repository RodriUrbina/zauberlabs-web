import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Title from "../components/Title";

// BL-111 (PO 2026-11-04): the title code. Bold sans lead + one italic serif accent half, always orange (accent on light,
// accent-dark on dark); every two-part title goes through components/Title.tsx.
const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
const html = (props: Parameters<typeof Title>[0]) => renderToStaticMarkup(createElement(Title, props));
const files = (dir: string): string[] =>
  fs.readdirSync(path.join(process.cwd(), dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : /\.tsx$/.test(e.name) ? [path.join(dir, e.name)] : []));

describe("title code (BL-111)", () => {
  test("lead + accent: the accent in the italic serif, orange on light, the lighter orange on dark", () => {
    assert.equal(
      html({ lead: "What’s next? ", accent: "You decide.", className: "x" }),
      '<h2 class="x">What’s next? <span class="accent-serif text-accent">You decide.</span></h2>',
    );
    assert.equal(
      html({ as: "h1", tone: "dark", lead: "See what your ", accent: "E46 can become.", tail: "", className: "y" }),
      '<h1 class="y">See what your <span class="accent-serif text-accent-dark">E46 can become.</span></h1>',
    );
    assert.equal(
      html({ as: "h3", tone: "dark", lead: "Füge ", accent: "deins", tail: " hinzu.", className: "z" }),
      '<h3 class="z">Füge <span class="accent-serif text-accent-dark">deins</span> hinzu.</h3>',
    );
    assert.match(html({ lead: "Was kommt als Nächstes? ", accent: "Du entscheidest.", keepAccentTogether: true, className: "x" }), /<span class="accent-serif text-accent whitespace-nowrap">Du entscheidest\.<\/span>/, "BL-107");
  });

  test("eyebrow: grey mono caps above the title, as its sibling (the page's layout stays)", () => {
    assert.equal(html({ eyebrow: "From the blog", lead: "What fits, ", accent: "and why.", className: "x" }), '<p class="eyebrow text-muted">From the blog</p><h2 class="x">What fits, <span class="accent-serif text-accent">and why.</span></h2>');
    assert.match(html({ eyebrow: "E", eyebrowClassName: "text-[11px] text-e46", lead: "a", accent: "b", className: "x" }), /^<p class="eyebrow text-\[11px\] text-e46">E<\/p>/);
  });

  test("no hand-made accent spans left: every two-part title uses <Title>", () => {
    const all = [...files("app"), ...files("components")];
    const hand = all.filter((f) => !f.endsWith(path.join("components", "Title.tsx")) && read(f).includes("accent-serif"));
    assert.deepEqual(hand, []);
    const users = all.filter((f) => /<Title\b/.test(read(f))).map((f) => f.split(path.sep).join("/")).sort();
    assert.deepEqual(users, [
      "app/[lang]/blog/[slug]/page.tsx",
      "app/[lang]/links/page.tsx",
      "app/[lang]/page.tsx",
      "app/[lang]/shop/page.tsx",
      "components/AboutPage.tsx",
      "components/HomeHero.tsx",
      "components/blog/BlogListing.tsx",
      "components/blog/ConfiguratorCta.tsx",
      "components/shop/ShopNotice.tsx",
    ]);
    const page = read("app", "[lang]", "page.tsx");
    assert.equal(page.match(/<Title\b/g)?.length, 4, "closer look, What's next, Add yours, From the blog");
    assert.match(page, /tone="dark"\s+eyebrow=\{t\.suggest\.eyebrow\}/, "Add yours sits on the dark card");
    assert.match(read("components", "HomeHero.tsx"), /<Title\s+as="h1"\s+tone="dark"\s+lead=\{t\.title\[0\]\}\s+accent=\{t\.title\[1\]\}\s+tail=\{t\.title\[2\]\}/);
    assert.equal(html({ as: "h1", tone: "dark", lead: "Was aus deinem ", accent: "E46 werden kann.", breakBeforeAccent: true, keepAccentTogether: true, className: "h" }), '<h1 class="h">Was aus deinem <br/><span class="accent-serif text-accent-dark whitespace-nowrap">E46 werden kann.</span></h1>', "BL-113");
  });

  test("written down in the README with the component name, an EN and a DE example and both tokens", () => {
    const r = read("README.md");
    const sec = r.slice(r.indexOf("## Title code"), r.indexOf("## Environment variables"));
    for (const s of ["components/Title.tsx", "--color-accent", "--color-accent-dark", 'accent="You decide."', 'lead="Über "']) assert.ok(sec.includes(s), s);
  });
});
