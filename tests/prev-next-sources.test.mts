import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBlog, CONTENT_DIR, SOURCES_SLUG, sourceAnchor, sourcesPath } from "../lib/blog";
import Cite from "../components/blog/Cite";
import SourcesLine from "../components/blog/SourcesLine";

const base = { description: "d", tags: ["E46"], hero: { src: "/blog/x/hero.jpg", alt: "alt", credit: "zauberlabs", licence: "own photo" }, sources: [{ label: "Catalogue", path: "x.md", confidence: "HIGH" }], configurator: { tag: "E46" } };
function write(dir: string, slug: string, lang: string, fm: Record<string, unknown>) {
  fs.mkdirSync(path.join(dir, slug), { recursive: true });
  const yaml = Object.entries({ ...base, ...fm }).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n");
  fs.writeFileSync(path.join(dir, slug, `${lang}.mdx`), `---\n${yaml}\n---\n\nBody.\n`);
}

describe("previous / next (BL-054)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zl-adj-"));
  write(dir, "a", "en", { title: "A", date: "2026-01-01" });
  write(dir, "b", "en", { title: "B", date: "2026-02-01" });
  write(dir, "b", "de", { title: "B DE", date: "2026-02-01" });
  write(dir, "c", "de", { title: "C DE only", date: "2026-02-15" }); // German only: an EN fallback page
  write(dir, "d", "en", { title: "D draft", date: "2026-03-01", draft: true });
  write(dir, "e", "en", { title: "E", date: "2026-03-10" });
  write(dir, "f", "en", { title: "F scheduled", date: "2026-04-01", publishAt: "2099-01-01" });
  const blog = createBlog({ dir, includeDrafts: false, includeScheduled: false });
  const slugs = (r: ReturnType<typeof blog.adjacent>) => [r.previous?.post.slug ?? null, r.next?.post.slug ?? null];

  test("older = previous, newer = next, same language only; drafts and scheduled are skipped", () => {
    assert.deepEqual(slugs(blog.adjacent("a", "en")), [null, "b"]);
    assert.deepEqual(slugs(blog.adjacent("b", "en")), ["a", "e"]); // skips the German-only c
    assert.deepEqual(slugs(blog.adjacent("e", "en")), ["b", null]); // skips draft d and scheduled f
    assert.deepEqual(slugs(blog.adjacent("b", "de")), [null, "c"]);
  });
  test("a fallback page is placed by its date among the language's own articles", () => {
    assert.deepEqual(slugs(blog.adjacent("c", "en")), ["b", "e"]);
  });
  test("unknown slug → nothing", () => {
    assert.deepEqual(slugs(blog.adjacent("nope", "en")), [null, null]);
  });
});

describe("sources page (BL-055)", () => {
  test("lists exactly the blog index's articles: no drafts, no scheduled ones on the live site", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zl-src-"));
    write(dir, "live", "en", { title: "Live", date: "2026-01-01" });
    write(dir, "draft", "en", { title: "Draft", date: "2026-01-02", draft: true });
    write(dir, "later", "en", { title: "Later", date: "2026-01-03", publishAt: "2099-01-01" });
    const live = createBlog({ dir, includeDrafts: false, includeScheduled: false });
    const slugs = (b: ReturnType<typeof createBlog>) => b.sourcesEntries("en").map((r) => r.post.slug);
    assert.deepEqual(slugs(live), ["live"]);
    assert.deepEqual(slugs(live), live.listPosts("en").map((r) => r.post.slug));
    // Previews show everything, like the index does there.
    const preview = createBlog({ dir, includeDrafts: true, includeScheduled: true });
    assert.deepEqual(slugs(preview).sort(), ["draft", "later", "live"]);
  });
  test("no article may use the reserved slug 'sources'", () => {
    assert.ok(!fs.existsSync(path.join(CONTENT_DIR, SOURCES_SLUG)));
  });
  test("cite numbers link to the article's entries on the sources page", () => {
    const href = `${sourcesPath("de")}#${sourceAnchor("some-article")}`;
    const html = renderToStaticMarkup(createElement(Cite, { groups: [{ ids: ["S4"], level: "HIGH" }], lang: "de", href }));
    assert.ok(html.includes('href="/de/blog/sources#some-article-s4"'), html);
  });
  test("the article line counts sources per grade and links to the article's section", () => {
    const sources = [
      { id: "S1", label: "a", path: "p", confidence: "HIGH" },
      { id: "S2", label: "b", path: "p", confidence: "HIGH" },
      { id: "S3", label: "c", path: "p", confidence: "LOW" },
    ] as Parameters<typeof SourcesLine>[0]["sources"];
    const html = renderToStaticMarkup(createElement(SourcesLine, { lang: "en", slug: "some-article", sources }));
    assert.ok(html.includes("3 sources"));
    assert.ok(html.includes('href="/en/blog/sources#some-article"'));
    assert.ok(!html.includes("Medium"), "grades with no source are not shown");
  });
});

describe("brand lowercase (PO 2026-10-19)", () => {
  test("the byline is 'zauberlabs' whatever the front matter says", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zl-brand-"));
    write(dir, "x", "en", { title: "X", date: "2026-01-01", author: "Zauberlabs" });
    write(dir, "y", "en", { title: "Y", date: "2026-01-02" });
    write(dir, "z", "en", { title: "Z", date: "2026-01-03", author: "Jane Doe" });
    const blog = createBlog({ dir, includeDrafts: false, includeScheduled: false });
    assert.equal(blog.getPost("x", "en")?.post.meta.author, "zauberlabs");
    assert.equal(blog.getPost("y", "en")?.post.meta.author, "zauberlabs");
    assert.equal(blog.getPost("z", "en")?.post.meta.author, "Jane Doe");
  });
});
