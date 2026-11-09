/**
 * BL-127 (PO 2026-11-09: no blog image may appear cropped) — writes lib/blog-image-sizes.json: the pixel size of every hero
 * image the articles name (front matter `hero.src`), so the article hero can show the whole picture at its natural ratio
 * with the space reserved. Pages are rendered on the server at run time too, where public/ is not readable, hence a file.
 * tests/blog-images.test.mts fails when a hero is missing from it or its size changed: then run `node scripts/blog-image-sizes.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const dir = path.join(root, "content", "blog");
const srcs = new Set();
for (const slug of fs.readdirSync(dir)) {
  const d = path.join(dir, slug);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d).filter((f) => f.endsWith(".mdx"))) {
    const m = /^hero:\s*\n(?:[ \t]+.*\n)*?[ \t]+src:\s*"?([^"\s#]+)"?/m.exec(fs.readFileSync(path.join(d, f), "utf8"));
    if (m && m[1] !== "null") srcs.add(m[1]);
  }
}
const out = {};
for (const src of [...srcs].sort()) {
  const { width, height } = await sharp(path.join(root, "public", src)).metadata();
  out[src] = [width, height];
}
fs.writeFileSync(path.join(root, "lib", "blog-image-sizes.json"), `${JSON.stringify(out, null, 2)}\n`);
console.log(`✓ lib/blog-image-sizes.json: ${Object.keys(out).length} hero images`);
