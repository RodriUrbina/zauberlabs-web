import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Figure from "../components/blog/Figure";
import { createBlog } from "../lib/blog";

/**
 * Image guard (BL-024 part C): every image an article uses, and every file under public/images and
 * public/blog, must exist and be at most 400 KB. WebP (or SVG for drawings) is preferred; other formats
 * are reported as a diagnostic, not a failure.
 */
const MAX_BYTES = 400 * 1024;
const PUBLIC = path.join(process.cwd(), "public");
const IMAGE_EXT = /\.(avif|webp|png|jpe?g|gif|svg)$/i;

function listImages(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? listImages(p) : IMAGE_EXT.test(d.name) ? [p] : [];
  });
}

/** Local image paths referenced by an article: hero.src, <Figure src="…">, Markdown ![](…). */
function referencedImages(body: string, heroSrc: string | null): string[] {
  const out = new Set<string>();
  if (heroSrc) out.add(heroSrc);
  for (const m of body.matchAll(/<Figure\b[^>]*\bsrc=["']([^"']+)["']/g)) out.add(m[1]);
  for (const m of body.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)) out.add(m[1]);
  return [...out].filter((s) => s.startsWith("/"));
}

describe("image guard", () => {
  const blog = createBlog({ includeDrafts: true, includeScheduled: true });

  for (const slug of blog.slugs()) {
    for (const lang of ["en", "de"] as const) {
      const r = blog.getPost(slug, lang);
      if (!r || r.fallback) continue;
      test(`${slug}/${lang}: referenced images exist and are ≤ 400 KB`, (t) => {
        for (const rel of referencedImages(r.post.body, r.post.meta.hero.src)) {
          const file = path.join(PUBLIC, rel);
          assert.ok(fs.existsSync(file), `${rel} is referenced but missing under public/`);
          const size = fs.statSync(file).size;
          assert.ok(size <= MAX_BYTES, `${rel} is ${Math.round(size / 1024)} KB (max 400 KB)`);
          if (!/\.(webp|svg|avif)$/i.test(rel)) t.diagnostic(`${rel}: ${path.extname(rel).slice(1)} — WebP preferred for photos`);
        }
      });
    }
  }

  test("every file under public/images and public/blog is ≤ 400 KB", (t) => {
    const files = [...listImages(path.join(PUBLIC, "images")), ...listImages(path.join(PUBLIC, "blog"))];
    assert.ok(files.length > 0);
    const over = files.filter((f) => fs.statSync(f).size > MAX_BYTES).map((f) => `${path.relative(PUBLIC, f)} (${Math.round(fs.statSync(f).size / 1024)} KB)`);
    assert.deepEqual(over, [], "images over 400 KB");
    const nonPreferred = files.filter((f) => !/\.(webp|svg|avif)$/i.test(f)).length;
    if (nonPreferred) t.diagnostic(`${nonPreferred} of ${files.length} images are not WebP/SVG/AVIF (allowed; WebP preferred for photos)`);
  });

  test("the Eisenach map is a self-contained SVG with no external references", () => {
    const svg = fs.readFileSync(path.join(PUBLIC, "images", "map-germany-eisenach.svg"), "utf8");
    assert.ok(svg.includes("<title") && svg.includes("Eisenach"));
    assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(svg), "no external URLs");
    assert.ok(!/<image|<script|xlink:href|@import/.test(svg), "no embedded images, scripts or imports");
  });
});

describe("Figure rendering (BL-024 part C)", () => {
  const html = (props: Record<string, unknown>) => renderToStaticMarkup(createElement(Figure, props as never));

  test("landscape: caption and credit line render; orientation attribute set", () => {
    const h = html({ src: "/images/coupe.jpg", alt: "E46 Coupé", caption: "A caption.", credit: "Zauberlabs", width: 1600, height: 900 });
    assert.ok(h.includes('data-orientation="landscape"'));
    assert.ok(h.includes("A caption.") && h.includes("Zauberlabs"));
    assert.ok(h.includes('width="1600"') && h.includes('height="900"'));
    assert.ok(h.includes("max-h-[75vh]") && h.includes("max-w-full"), "fills the column, never taller than the viewport");
  });

  test("portrait: capped height, centred", () => {
    const h = html({ src: "/blog/x/portrait.webp", alt: "Portrait", width: 900, height: 1600 });
    assert.ok(h.includes('data-orientation="portrait"'));
    assert.ok(h.includes("mx-auto"));
    assert.ok(!h.includes("<figcaption"), "no caption element when neither caption nor credit is given");
  });

  test("credit without caption, and caption without credit", () => {
    assert.ok(html({ src: "/a.svg", alt: "a", credit: "Own drawing" }).includes("Own drawing"));
    assert.ok(html({ src: "/a.svg", alt: "a", caption: "Only a caption" }).includes("Only a caption"));
  });

  test("the map renders through Figure with an SVG source", () => {
    const h = html({ src: "/images/map-germany-eisenach.svg", alt: "Map of Germany with Eisenach marked", caption: "Eisenach, Thuringia.", credit: "Zauberlabs, own drawing" });
    assert.ok(h.includes('src="/images/map-germany-eisenach.svg"'));
  });
});
