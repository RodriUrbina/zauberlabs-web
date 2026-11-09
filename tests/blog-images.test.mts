import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import SIZES from "../lib/blog-image-sizes.json";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");

describe("blog images are never cropped (BL-127)", () => {
  test("the article hero shows the whole picture at its natural ratio; cards contain it in their box; no cover anywhere in the blog", () => {
    const hero = read("components", "blog", "HeroImage.tsx");
    assert.match(hero, /width=\{size\[0\]\} height=\{size\[1\]\}[^>]*className="mx-auto block h-auto max-h-\[75vh\] w-auto max-w-full"/);
    assert.match(hero, /fit === "contain"[\s\S]*className="object-contain"/);
    assert.match(read("components", "blog", "PostCard.tsx"), /<HeroImage hero=\{hero\} lang=\{lang\} fit="contain"/);
    assert.match(read("app", "[lang]", "blog", "[slug]", "page.tsx"), /<HeroImage hero=\{m\.hero\} lang=\{lang\} priority \/>/, "the article uses the natural fit (default)");
    const blogFiles = ["components/blog/HeroImage.tsx", "components/blog/Figure.tsx", "components/blog/PostCard.tsx", "components/blog/BlogListing.tsx", "components/blog/PrevNext.tsx", "app/[lang]/blog/[slug]/page.tsx"];
    for (const f of blogFiles) assert.ok(!/object-cover|object-\[/.test(read(f)), `${f}: no crop`);
    assert.match(read("components", "blog", "Figure.tsx"), /className="mx-auto block h-auto max-h-\[75vh\] w-auto max-w-full"/, "inline figures already whole");
  });
  test("lib/blog-image-sizes.json has every article hero with its real size (run scripts/blog-image-sizes.mjs after changing one)", async () => {
    const dir = path.join(process.cwd(), "content", "blog");
    const heroes = new Set<string>();
    for (const slug of fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory())) {
      for (const f of fs.readdirSync(path.join(dir, slug)).filter((f) => f.endsWith(".mdx"))) {
        const m = /^hero:\s*\n(?:[ \t]+.*\n)*?[ \t]+src:\s*"?([^"\s#]+)"?/m.exec(read("content", "blog", slug, f));
        if (m && m[1] !== "null") heroes.add(m[1]);
      }
    }
    assert.deepEqual(Object.keys(SIZES).sort(), [...heroes].sort());
    for (const [src, [w, h]] of Object.entries(SIZES as Record<string, number[]>)) {
      const meta = await sharp(path.join(process.cwd(), "public", src)).metadata();
      assert.deepEqual([meta.width, meta.height], [w, h], src);
    }
  });
});
