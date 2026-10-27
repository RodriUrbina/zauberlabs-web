/**
 * BL-084 — web images for the fan shop (/shop) from the PO's nine decal designs (e46 docs/GTM/, 1536×1024 PNG, AI renders).
 * Four designs have a black background and five a white one (the plan assumed all black), so the background that touches the
 * picture's edge is made transparent with a flood fill from the edges: near-black (< 28) for dark corners, near-white (> 232)
 * for light corners. The fill stops at the sticker's own outline, so the white die-cut border stays. Output: 1200×800 WebP
 * with alpha. Each source is checked against its SHA-256, so the output is reproducible.
 * These are web previews only, not print files (plan § 2.1: print files need their own prep).
 *
 *   node scripts/make-shop-images.mjs [path to e46 docs/GTM]   (default: ../e46/docs/GTM)
 */
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const DIR = path.resolve(process.argv[2] ?? path.join(process.cwd(), "..", "e46", "docs", "GTM"));
const OUT = path.join(process.cwd(), "public", "shop");

/** source file → [output id, SHA-256 of the source] */
const SOURCES = {
  "decal Sedan.png": ["sedan-silver", "50e422b683603ccef766c2976a41cb6f022c581b972c3c78114657cfe8d490a7"],
  "decal Sedan red.png": ["sedan-red", "d8820930150cae88018e64844ba12bc85a33c2b30ff1519fd940c5b627d8c024"],
  "decal Sedan no M.png": ["sedan-red-no-m", "b98b9444141d30e3ae8eeb0f23be294b72463cd948931582af43fca86dae2a59"],
  "decal touring.png": ["touring-blue-stripes", "54db71529b7d3592c6fb58466479ff605b3f23803c732fe1d0f4c61e23addd5e"],
  "decal touring no lines.png": ["touring-blue-no-stripes", "f7be50ac3644bc6ce71056272cafa2ab4d8dc83970cd0a1ab12644d2c51762b6"],
  "decal Coupe.png": ["coupe-blue", "2ac945cf0f1f91c28301dd01a6cd3a0f87f9c425b47c58a4387777121f9ab73a"],
  "decal convertible Grey.png": ["convertible-grey", "770240d1f704b8f0955c4887d00ec740e55c0eef88df5983247d880c73781d39"],
  "decal convertible black.png": ["convertible-black", "0471a6eda7e422d4013351d2556355106ad655e55329c1798d25907f4ae237d9"],
  "decal M3.png": ["m3-yellow", "efc8f000c9c1d9415596915dbfa6e1df90994298938eba8781cede61d14a7f8d"],
};

/** Flood-fills from every edge pixel through pixels that match the corner background, and clears their alpha. */
function clearBackground(data, w, h) {
  const lum = (i) => (data[i] + data[i + 1] + data[i + 2]) / 3;
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4].map(lum);
  const dark = corners.reduce((a, b) => a + b, 0) / 4 < 128;
  const isBg = (i) => (dark ? data[i] < 28 && data[i + 1] < 28 && data[i + 2] < 28 : data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 232);
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  let cleared = 0;
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!isBg(p * 4)) continue;
    data[p * 4 + 3] = 0;
    cleared++;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
  return { dark, cleared: cleared / (w * h) };
}

fs.mkdirSync(OUT, { recursive: true });
for (const [file, [id, sha]] of Object.entries(SOURCES)) {
  const buf = fs.readFileSync(path.join(DIR, file));
  const got = createHash("sha256").update(buf).digest("hex");
  if (got !== sha) throw new Error(`${file}: SHA-256 ${got} is not the recorded ${sha}; check the source before rebuilding.`);
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 1536 || info.height !== 1024) throw new Error(`${file} is ${info.width}×${info.height}, expected 1536×1024`);
  const r = clearBackground(data, info.width, info.height);
  const out = path.join(OUT, `${id}.webp`);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(1200, 800, { kernel: "lanczos3" })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toFile(out);
  console.log(`✓ ${id}.webp  (${r.dark ? "black" : "white"} background, ${(r.cleared * 100).toFixed(1)} % cleared, ${fs.statSync(out).size} bytes)`);
}
