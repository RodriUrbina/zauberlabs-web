import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// BL-105: German pages open the German E46BUILD (/de, /de?start=, /de?section=); English pages keep their URLs.
// E46_LIVE is read at import time.
process.env.NEXT_PUBLIC_E46_LIVE = "1";
const { e46Url, e46StartUrl, e46SectionUrl, localizeE46Href, E46_URL } = await import("../lib/i18n");
const { configuratorFor, configuratorHosts, isStartLink } = await import("../lib/configurator-click");
const { default: ConfiguratorCta, ConfiguratorLink } = await import("../components/blog/ConfiguratorCta");
const { mdxComponents } = await import("../components/blog/mdx-components");
const { default: StickyStartBar } = await import("../components/StickyStartBar");

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
const e46Hrefs = (html: string) => [...html.matchAll(/href="(https:\/\/e46\.zauberlabs\.de[^"]*)"/g)].map((m) => m[1].replaceAll("&amp;", "&"));
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each component takes its own props
const render = (c: React.ComponentType<any>, props: object) => renderToStaticMarkup(createElement(c, props));
const A = (lang: "en" | "de") => mdxComponents(lang).a as (p: { href: string; children: string }) => React.ReactElement;

describe("German E46BUILD links (BL-105)", () => {
  test("URL builders: de → /de, /de?start=, /de?section=; en exactly as before", () => {
    assert.equal(E46_URL, "https://e46.zauberlabs.de");
    assert.equal(e46Url("de"), "https://e46.zauberlabs.de/de");
    assert.equal(e46StartUrl("touring", "de"), "https://e46.zauberlabs.de/de?start=touring");
    assert.equal(e46SectionUrl("steering", "de"), "https://e46.zauberlabs.de/de?section=steering");
    assert.equal(e46Url("en"), "https://e46.zauberlabs.de");
    assert.equal(e46StartUrl("touring", "en"), "https://e46.zauberlabs.de/?start=touring");
    assert.equal(e46SectionUrl("steering", "en"), "https://e46.zauberlabs.de/?section=steering");
  });

  test("NEXT_PUBLIC_E46_URL stays the base; /de is appended (trailing slash tolerated)", () => {
    const src = read("lib", "i18n.ts");
    assert.match(src, /export const E46_URL = process\.env\.NEXT_PUBLIC_E46_URL \?\? "https:\/\/e46\.zauberlabs\.de";/);
    assert.match(src, /export const e46Url = \(lang: Locale\) => \(lang === "de" \? `\$\{E46_URL\.replace\(\/\\\/\+\$\/, ""\)\}\/de` : E46_URL\);/);
  });

  test("home and blog components build their E46BUILD links with the page language (next/link and next/image don't render here; the local build is grepped)", () => {
    const hero = read("components", "HomeHero.tsx");
    assert.match(hero, /href=\{e46Url\(lang\)\}/);
    assert.match(hero, /href=\{e46StartUrl\(b\.start, lang\)\}\s+rel="nofollow"/);
    assert.match(read("components", "SiteFooter.tsx"), /<a href=\{e46Url\(lang\)\}[^>]*>E46BUILD<\/a>/);
    assert.match(read("components", "blog", "BlogHeader.tsx"), /<a href=\{e46Url\(lang\)\}/);
    assert.match(read("components", "VoteCard.tsx"), /<a href=\{e46Url\(lang\)\}/);
    // CloserLook and the sticky bar take their href from the page, which passes the German one on German pages
    assert.match(read("components", "CloserLook.tsx"), /href=\{hrefs\[on\]\}\s+rel="nofollow"/);
    assert.deepEqual(e46Hrefs(render(StickyStartBar, { href: e46Url("de"), label: "x" })), ["https://e46.zauberlabs.de/de"]);
  });

  test("home page: every E46BUILD link is built with the page language", () => {
    const page = read("app", "[lang]", "page.tsx");
    assert.ok(!page.includes("E46_URL"), "no language-blind link left");
    assert.equal(page.match(/href=\{e46Url\(lang\)\}/g)?.length, 4, "header ×2, blog teaser, sticky bar (the garage button is gone, BL-114)");
    assert.match(read("components", "HomeHero.tsx"), /href=\{e46StartUrl\(b\.start, lang\)\}/, "the body pills (the garage tiles are gone, BL-114)");
    assert.match(page, /e46SectionUrl\(c\.key, lang\)/);
    for (const f of [["components", "HomeHero.tsx"], ["components", "SiteFooter.tsx"], ["components", "VoteCard.tsx"], ["components", "blog", "BlogHeader.tsx"]]) {
      assert.ok(!read(...f).includes("E46_URL"), f.join("/"));
    }
  });

  test("article box and <ConfiguratorLink>: /de on German pages, also for a cta.href written in English", () => {
    for (const url of [undefined, "https://e46.zauberlabs.de"]) {
      assert.deepEqual(e46Hrefs(render(ConfiguratorCta, { lang: "de", tag: "E46", url })), ["https://e46.zauberlabs.de/de"], String(url));
      assert.deepEqual(e46Hrefs(render(ConfiguratorCta, { lang: "en", tag: "E46", url })), ["https://e46.zauberlabs.de"], String(url));
    }
    assert.deepEqual(e46Hrefs(render(ConfiguratorCta, { lang: "de", tag: "E46", url: "https://e46.zauberlabs.de/?section=steering" })), ["https://e46.zauberlabs.de/de?section=steering"]);
    assert.deepEqual(e46Hrefs(render(ConfiguratorLink, { lang: "de", children: "x" })), ["https://e46.zauberlabs.de/de"]);
    assert.deepEqual(e46Hrefs(render(ConfiguratorLink, { lang: "de", href: "https://e46.zauberlabs.de/?start=m3", children: "x" })), ["https://e46.zauberlabs.de/de?start=m3"]);
    assert.deepEqual(e46Hrefs(render(ConfiguratorLink, { lang: "en", children: "x" })), ["https://e46.zauberlabs.de"]);
  });

  test("plain Markdown links are rewritten when a German page renders; the .mdx keeps the English URL", () => {
    const de = (href: string) => e46Hrefs(renderToStaticMarkup(A("de")({ href, children: "E46BUILD" })))[0];
    assert.equal(de("https://e46.zauberlabs.de"), "https://e46.zauberlabs.de/de");
    assert.equal(de("https://e46.zauberlabs.de/"), "https://e46.zauberlabs.de/de");
    assert.equal(de("https://e46.zauberlabs.de/?start=touring"), "https://e46.zauberlabs.de/de?start=touring");
    assert.equal(de("https://e46.zauberlabs.de/?section=wheels#x"), "https://e46.zauberlabs.de/de?section=wheels#x");
    assert.equal(de("https://e46.zauberlabs.de/?start=m3&section=steering"), "https://e46.zauberlabs.de/de?start=m3&section=steering");
    assert.equal(de("https://e46.zauberlabs.de/steering-wheels/multifunction"), "https://e46.zauberlabs.de/de/lenkraeder/multifunktion");
    assert.equal(de("https://e46.zauberlabs.de/steering-wheels/m3-alcantara"), "https://e46.zauberlabs.de/de/lenkraeder/m3-alcantara");
    assert.equal(de("https://e46.zauberlabs.de/build"), "https://e46.zauberlabs.de/de/build", "everything else just gets /de");
    assert.equal(de("https://e46.zauberlabs.de/de?start=sedan"), "https://e46.zauberlabs.de/de?start=sedan", "already German: unchanged");
    assert.equal(localizeE46Href("https://example.com/", "de"), "https://example.com/");
    assert.equal(localizeE46Href("/de/blog", "de"), "/de/blog");
    for (const href of ["https://e46.zauberlabs.de", "https://e46.zauberlabs.de/?start=touring", "https://e46.zauberlabs.de/steering-wheels/multifunction"]) {
      assert.equal(e46Hrefs(renderToStaticMarkup(A("en")({ href, children: "x" })))[0], href, "English pages: byte-identical");
      assert.equal(localizeE46Href(href, "en"), href);
    }
  });

  test("German start links keep nofollow, the new tab and the sr-only text; /de links are counted as e46", () => {
    for (const href of ["https://e46.zauberlabs.de/?start=touring", "https://e46.zauberlabs.de/?section=wheels"]) {
      const html = renderToStaticMarkup(A("de")({ href, children: "E46BUILD" }));
      assert.ok(html.includes('rel="nofollow noopener"') && html.includes('target="_blank"') && html.includes("(öffnet in neuem Tab)"), html);
    }
    const plain = renderToStaticMarkup(A("de")({ href: "https://e46.zauberlabs.de", children: "E46BUILD" }));
    assert.ok(plain.includes('rel="noopener"') && !plain.includes("nofollow"), plain);
    const hosts = configuratorHosts(E46_URL);
    for (const href of [e46Url("de"), e46StartUrl("sedan", "de"), e46SectionUrl("seats", "de"), "https://e46.zauberlabs.de/de/lenkraeder/multifunktion"]) {
      assert.equal(configuratorFor(href, hosts), "e46", href);
    }
    assert.ok(isStartLink(e46StartUrl("sedan", "de")) && isStartLink(e46SectionUrl("seats", "de")) && !isStartLink(e46Url("de")));
  });

  test("README examples point to a real E46BUILD target (no /steering-wheels 404)", () => {
    const readme = read("content", "blog", "README.md");
    assert.ok(!/e46\.zauberlabs\.de\/steering-wheels\b/.test(readme));
    assert.equal(readme.match(/https:\/\/e46\.zauberlabs\.de\/\?section=steering/g)?.length, 2);
  });
});
