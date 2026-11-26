import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { articleHeadTitles } from "../lib/blog-seo";
import { parseFrontMatter } from "../lib/blog-schema";
import { shopCopy } from "../lib/shop-copy";
import matter from "gray-matter";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");

describe("article seoTitle (BL-149)", () => {
  test("unset: exactly as before (tab = title + suffix, share title = title)", () => {
    assert.deepEqual(articleHeadTitles({ title: "Six wheels, three families" }), { document: "Six wheels, three families — zauberlabs", social: "Six wheels, three families" });
  });
  test("set: tab and share titles use it; the suffix is added once, never twice", () => {
    assert.deepEqual(articleHeadTitles({ title: "Long visible title", seoTitle: "E46 wheels by style" }), { document: "E46 wheels by style — zauberlabs", social: "E46 wheels by style" });
    assert.deepEqual(articleHeadTitles({ title: "x", seoTitle: "E46 wheels — zauberlabs" }), { document: "E46 wheels — zauberlabs", social: "E46 wheels — zauberlabs" });
  });
  test("the schema accepts an optional seoTitle and keeps it; without one nothing changes", () => {
    const base = matter(read("content", "blog", "telling-e46-wheels-apart", "en.mdx")).data;
    const withSeo = parseFrontMatter({ ...base, seoTitle: "Short search title" }, "x.mdx");
    assert.equal(withSeo.seoTitle, "Short search title");
    assert.equal(parseFrontMatter(base, "y.mdx").seoTitle, undefined);
  });
  test("only the <head> uses it: the page's title tag, og:title and twitter:title; h1, JSON-LD and breadcrumb keep `title`", () => {
    const page = read("app", "[lang]", "blog", "[slug]", "page.tsx");
    assert.match(page, /const head = articleHeadTitles\(m\);[\s\S]*title: head\.document,[\s\S]*type: "article",\s*title: head\.social,[\s\S]*twitter: \{ card: "summary_large_image", title: head\.social,/);
    assert.match(page, /<Title as="h1" \{\.\.\.splitTitle\(m\.title\)\}/);
    assert.match(page, /headline: m\.title,/);
    for (const f of [["lib", "blog-feed.ts"], ["app", "sitemap.ts"]]) if (fs.existsSync(path.join(process.cwd(), ...f))) assert.ok(!read(...f).includes("seoTitle"), f.join("/"));
  });
});

describe("shop page meta (BL-149)", () => {
  test("own title and the Writer's description, EN + DE; og: follows", () => {
    assert.equal(shopCopy.en.metaTitle, "E46 stickers — zauberlabs shop");
    assert.equal(shopCopy.de.metaTitle, "E46-Sticker — zauberlabs Shop");
    assert.equal(shopCopy.en.metaDescription, "E46 stickers: a Sedan, Touring, Convertible and M3 in BMW colours, die-cut glossy vinyl, about 5 × 2.5 cm, printed in Germany. €4.90 each.");
    assert.equal(shopCopy.de.metaDescription, "E46-Sticker: Limousine, Touring, Cabrio und M3 in BMW-Farben, konturgeschnittenes Vinyl, glänzend, ca. 5 × 2,5 cm, gedruckt in Deutschland. 4,90 € pro Stück.");
    const page = read("app", "[lang]", "shop", "page.tsx");
    assert.match(page, /title: t\.metaTitle,\s*description: t\.metaDescription,\s*openGraph: \{ title: t\.metaTitle, description: t\.metaDescription,/);
  });
});
