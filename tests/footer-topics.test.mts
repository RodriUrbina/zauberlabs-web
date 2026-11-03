import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createBlog } from "../lib/blog";
import { blogTopicOf, footerBlogTopics, BLOG_TOPICS } from "../lib/footer-topics";
import { E46_TOPIC_GROUPS } from "../lib/e46-topics";
import { localizeE46Href } from "../lib/i18n";
import { isStartLink } from "../lib/configurator-click";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
const live = (at: string) => createBlog({ includeDrafts: false, includeScheduled: false, now: () => Date.parse(at) });

describe("footer: popular topics (BL-106)", () => {
  test("an article goes to the group of its first topic tag; buying guides, history and glossary to Buying & history", () => {
    assert.deepEqual(BLOG_TOPICS.map((g) => g.label.en), ["Headlights", "Wheels", "Bumpers", "Seats", "Steering wheels", "Buying & history"]);
    assert.deepEqual(BLOG_TOPICS.map((g) => g.label.de), ["Scheinwerfer", "Felgen", "Stoßstangen", "Sitze", "Lenkräder", "Kauf & Geschichte"]);
    assert.equal(blogTopicOf(["E46", "headlights", "xenon", "buying guide"]), "headlights");
    assert.equal(blogTopicOf(["E46", "M Sport package", "bumpers", "wheels"]), "bumpers", "a tag that names no topic is skipped");
    assert.equal(blogTopicOf(["E46", "Compact", "headlights", "bi-xenon"]), "headlights");
    assert.equal(blogTopicOf(["E46", "steering wheel", "airbag"]), "steering");
    assert.equal(blogTopicOf(["E46", "buying guide", "headlights", "wheels"]), "buying");
    assert.equal(blogTopicOf(["E46", "History", "Eisenach"]), "buying");
    assert.equal(blogTopicOf(["E46", "glossary", "bumpers"]), "buying");
    assert.equal(blogTopicOf(["E46", "Sample"]), "buying");
  });

  test("every published article of the language exactly once; no drafts, nothing scheduled, no other-language fallbacks", () => {
    const blog = live("2026-11-03T12:00:00Z");
    for (const lang of ["en", "de"] as const) {
      const groups = footerBlogTopics(blog, lang);
      const slugs = groups.flatMap((g) => g.posts.map((p) => p.slug));
      const own = blog.listPosts(lang).filter((r) => !r.fallback).map((r) => r.post.slug);
      assert.deepEqual([...slugs].sort(), [...own].sort(), lang);
      assert.equal(new Set(slugs).size, slugs.length, `${lang}: once each`);
      assert.ok(!slugs.some((s) => s.startsWith("sample")), "no draft");
      assert.ok(!slugs.includes("e46-plan-the-whole-job-costs"), "scheduled for 2026-11-09: not yet");
      for (const g of groups) assert.ok(g.posts.length > 0);
    }
    const de = footerBlogTopics(blog, "de").flatMap((g) => g.posts);
    assert.ok(de.some((p) => p.title.startsWith("Halogen, Xenon, Bi-Xenon oder Kurvenlicht?")), "German titles on German pages");
    assert.ok(!de.some((p) => p.slug === "bmw-factory-that-ended-up-in-the-east"), "English-only article not on German pages");
  });

  test("a scheduled article appears by itself once its publish moment has passed", () => {
    const at = (iso: string) => footerBlogTopics(live(iso), "en").flatMap((g) => g.posts.map((p) => p.slug)).includes("e46-plan-the-whole-job-costs");
    assert.equal(at("2026-11-08T12:00:00Z"), false);
    assert.equal(at("2026-11-10T12:00:00Z"), true);
  });

  test("E46BUILD topic pages: EN and DE paths, German pages link the /de counterparts via BL-105's localizeE46Href", () => {
    const pages = E46_TOPIC_GROUPS.flatMap((g) => g.pages);
    assert.equal(pages.length, 28);
    assert.deepEqual(E46_TOPIC_GROUPS.map((g) => g.label.en), ["Body styles", "Packages", "Conversions", "Mod guides"]);
    assert.equal(new Set(pages.map((p) => p.en.path)).size, 28);
    for (const p of pages) {
      const en = `https://e46.zauberlabs.de${p.en.path}`;
      assert.ok(!p.en.path.startsWith("/de"), p.en.path);
      assert.match(p.de.path, /^\/de\//);
      assert.equal(localizeE46Href(en, "de"), `https://e46.zauberlabs.de${p.de.path}`);
      assert.equal(localizeE46Href(en, "en"), en);
      assert.ok(!isStartLink(en) && !isStartLink(localizeE46Href(en, "de")), "topic pages are not state links");
    }
    // BL-105's mappings are still in place, now taken from the list
    assert.equal(localizeE46Href("https://e46.zauberlabs.de/steering-wheels/m3-alcantara", "de"), "https://e46.zauberlabs.de/de/lenkraeder/m3-alcantara");
    assert.equal(localizeE46Href("https://e46.zauberlabs.de/e46-convertible", "de"), "https://e46.zauberlabs.de/de/e46-cabrio");
  });

  test("rendered by the server footer: plain links; blog links same tab, E46BUILD links new tab with referrer and followed", () => {
    const f = read("components", "SiteFooter.tsx");
    assert.match(f, /<PopularTopics lang=\{lang\} \/>\s*<div className="grid grid-cols-2/, "above the existing footer rows");
    assert.ok(!f.includes('"use client"'));
    assert.match(f, /<Link href=\{`\/\$\{lang\}\/blog\/\$\{p\.slug\}`\} className="hover:text-paper">\{p\.title\}<\/Link>/);
    assert.match(f, /<a href=\{e46\(p\.en\.path\)\} target="_blank" rel="noopener" className="hover:text-paper">\{p\[lang\]\.label\}\{newTab\}<\/a>/);
    assert.match(f, /<a href=\{e46Url\(lang\)\} target="_blank" rel="noopener" className="hover:text-paper">E46BUILD\{newTab\}<\/a>/);
    assert.match(f, /const newTab = <span className="sr-only"> \{t\.blog\.opensNewTab\}<\/span>;/);
    const block = f.slice(f.indexOf("function PopularTopics"));
    assert.ok(!block.includes("nofollow") && !block.includes("noreferrer"));
    // PO 2026-11-03: E46BUILD groups two-up on phones, four columns on desktop; article lists stay one column on phones
    assert.match(block, /className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-x-8"/);
    assert.match(block, /className="grid grid-cols-1 gap-x-8 gap-y-8 min-\[480px\]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"/);
  });
});
