import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createBlog, readingMinutes, shouldShowDrafts, tagSlug } from "../lib/blog";
import { parseFrontMatter } from "../lib/blog-schema";

// ─── fixtures ────────────────────────────────────────────────────────────────

const base = {
  title: "Alpha",
  description: "Alpha description.",
  date: "2026-01-01",
  tags: ["E46", "Headlights"],
  hero: { src: "/blog/alpha/hero.jpg", alt: "alt", credit: "Zauberlabs", licence: "own photo" },
  sources: [{ label: "Catalogue", path: "docs/research/x.md", confidence: "HIGH" }],
  configurator: { tag: "E46" },
};

function write(dir: string, slug: string, lang: string, fm: Record<string, unknown>, body = "Body text.") {
  const folder = path.join(dir, slug);
  fs.mkdirSync(folder, { recursive: true });
  const yaml = Object.entries(fm)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  fs.writeFileSync(path.join(folder, `${lang}.mdx`), `---\n${yaml}\n---\n\n${body}\n`);
}

function fixtureDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zl-blog-"));
  write(dir, "alpha", "en", base);
  write(dir, "beta", "en", { ...base, title: "Beta EN", date: "2026-02-01", tags: ["E46", "Bumpers"] });
  write(dir, "beta", "de", { ...base, title: "Beta DE", date: "2026-02-01", updated: "2026-02-10", tags: ["E46", "Stoßstangen"] });
  write(dir, "gamma", "en", { ...base, title: "Gamma draft", date: "2026-03-01", draft: true });
  return dir;
}

// ─── schema ──────────────────────────────────────────────────────────────────

describe("front matter schema", () => {
  test("accepts the Builder form and applies defaults", () => {
    const fm = parseFrontMatter(base, "x");
    assert.equal(fm.author, "Zauberlabs");
    assert.equal(fm.draft, false);
    assert.equal(fm.sources[0].id, "S1");
    assert.equal(fm.sources[0].label, "Catalogue");
    assert.equal(fm.configurator.tag, "E46");
  });

  test("accepts the Writer form (string configurator, title/type/note, n/a, null hero, cta)", () => {
    const fm = parseFrontMatter(
      {
        ...base,
        lang: "en",
        slug: "alpha",
        card: "BL-015",
        configurator: "E46",
        cta: { label: "Try it", href: "https://e46.zauberlabs.de/x" },
        hero: { src: null, alt: "alt", credit: null, licence: null, placeholder: "brief" },
        evidenceRoot: "e46build master docs/research/",
        sources: [
          { id: "S1", title: "BMW EBA", type: "BMW-authored", path: "t029/x.txt", confidence: "HIGH", note: "n" },
          { id: "S2", title: "Synthesis", path: "t029/f.md", confidence: "n/a" },
        ],
      },
      "x"
    );
    assert.equal(fm.configurator.tag, "E46");
    assert.equal(fm.configurator.url, "https://e46.zauberlabs.de/x");
    assert.equal(fm.ctaLabel, "Try it");
    assert.equal(fm.hero.src, null);
    assert.equal(fm.sources[1].confidence, "NA");
    assert.equal(fm.sources[0].label, "BMW EBA");
  });

  test("normalises YAML Date objects to YYYY-MM-DD", () => {
    const fm = parseFrontMatter({ ...base, date: new Date("2026-05-06T00:00:00Z") }, "x");
    assert.equal(fm.date, "2026-05-06");
  });

  for (const [name, patch] of [
    ["no sources", { sources: [] }],
    ["bad confidence", { sources: [{ label: "x", path: "p", confidence: "SURE" }] }],
    ["tags without the configurator tag", { tags: ["Headlights"] }],
    ["hero image without credit", { hero: { src: "/x.jpg", alt: "a" } }],
    ["unknown field", { banana: 1 }],
    ["updated before date", { updated: "2025-01-01" }],
    ["description too long", { description: "x".repeat(321) }],
    ["duplicate source ids", { sources: [{ id: "S1", label: "a", path: "p", confidence: "HIGH" }, { id: "S1", label: "b", path: "p", confidence: "LOW" }] }],
  ] as const) {
    test(`rejects ${name}`, () => {
      assert.throws(() => parseFrontMatter({ ...base, ...patch }, "file.mdx"), /Invalid front matter in file\.mdx/);
    });
  }
});

// ─── loader ──────────────────────────────────────────────────────────────────

describe("blog loader", () => {
  const dir = fixtureDir();

  test("lists newest first, includes other-language fallbacks, hides drafts when asked", () => {
    const blog = createBlog({ dir, includeDrafts: false });
    const en = blog.listPosts("en");
    assert.deepEqual(
      en.map((r) => r.post.slug),
      ["beta", "alpha"]
    );
    const de = blog.listPosts("de");
    assert.deepEqual(
      de.map((r) => [r.post.slug, r.post.lang, r.fallback]),
      [
        ["beta", "de", false],
        ["alpha", "en", true],
      ]
    );
  });

  test("shows drafts when includeDrafts is true", () => {
    const blog = createBlog({ dir, includeDrafts: true });
    assert.deepEqual(
      blog.listPosts("en").map((r) => r.post.slug),
      ["gamma", "beta", "alpha"]
    );
  });

  test("resolves an article in the other language with fallback=true and never 404s", () => {
    const blog = createBlog({ dir, includeDrafts: false });
    const r = blog.getPost("alpha", "de");
    assert.ok(r);
    assert.equal(r.fallback, true);
    assert.equal(r.post.lang, "en");
    assert.deepEqual(r.available, ["en"]);
    assert.equal(blog.getPost("nope", "de"), null);
    assert.equal(blog.getPost("gamma", "en"), null, "draft hidden");
  });

  test("tag filter and tag collection", () => {
    const blog = createBlog({ dir, includeDrafts: false });
    assert.deepEqual(
      blog.listPosts("en", { tag: "Bumpers" }).map((r) => r.post.slug),
      ["beta"]
    );
    const tags = blog.listTags("en");
    assert.equal(tags[0].slug, "e46");
    assert.equal(tags[0].count, 2);
    assert.ok(tags.some((t) => t.slug === "headlights"));
    assert.equal(blog.getTag("en", "bumpers")?.name, "Bumpers");
    assert.equal(blog.getTag("en", "unknown"), null);
  });

  test("rejects a front matter lang/slug that contradicts the file", () => {
    const d2 = fs.mkdtempSync(path.join(os.tmpdir(), "zl-blog-"));
    write(d2, "alpha", "en", { ...base, lang: "de" });
    assert.throws(() => createBlog({ dir: d2 }), /says lang "de"/);
  });

  test("sitemap entries: index + tags + articles in existing languages only", () => {
    const blog = createBlog({ dir, includeDrafts: false });
    const urls = blog.sitemapEntries().map((e) => e.url);
    assert.ok(urls.includes("https://www.zauberlabs.de/en/blog"));
    assert.ok(urls.includes("https://www.zauberlabs.de/de/blog"));
    assert.ok(urls.includes("https://www.zauberlabs.de/en/blog/tag/e46"));
    assert.ok(urls.includes("https://www.zauberlabs.de/en/blog/alpha"));
    assert.ok(!urls.includes("https://www.zauberlabs.de/de/blog/alpha"), "fallback pages stay out of the sitemap");
    assert.ok(urls.includes("https://www.zauberlabs.de/de/blog/beta"));
    assert.ok(!urls.some((u) => u.includes("gamma")), "drafts stay out of the sitemap");
    const beta = blog.sitemapEntries().find((e) => e.url.endsWith("/de/blog/beta"))!;
    assert.equal(beta.lastModified.toISOString().slice(0, 10), "2026-02-10");
  });

  test("rss is well-formed, per language, escapes XML, excludes fallbacks and drafts", () => {
    const blog = createBlog({ dir, includeDrafts: false });
    const xml = blog.rss("de", { title: "Zauberlabs Blog", description: "a & b" });
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes("<description>a &amp; b</description>"));
    assert.ok(xml.includes("https://www.zauberlabs.de/de/blog/beta"));
    assert.ok(!xml.includes("/de/blog/alpha"), "english-only article is not in the german feed");
    assert.equal((xml.match(/<item>/g) ?? []).length, 1);
    assert.equal((blog.rss("en", { title: "t", description: "d" }).match(/<item>/g) ?? []).length, 2);
  });
});

// ─── helpers ─────────────────────────────────────────────────────────────────

describe("helpers", () => {
  test("tagSlug", () => {
    assert.equal(tagSlug("Steering wheels"), "steering-wheels");
    assert.equal(tagSlug("Stoßstangen"), "stossstangen");
    assert.equal(tagSlug("Räder & Felgen"), "raeder-felgen");
    assert.equal(tagSlug("  E46 / US  "), "e46-us");
  });
  test("readingMinutes never returns 0", () => {
    assert.equal(readingMinutes("one two"), 1);
    assert.equal(readingMinutes(Array(660).fill("word").join(" ")), 3);
  });
  test("drafts are hidden on production only", () => {
    assert.equal(shouldShowDrafts({ VERCEL_ENV: "production" }), false);
    assert.equal(shouldShowDrafts({ VERCEL_ENV: "preview" }), true);
    assert.equal(shouldShowDrafts({}), true);
    assert.equal(shouldShowDrafts({ VERCEL_ENV: "production", BLOG_SHOW_DRAFTS: "1" }), true);
  });
});
