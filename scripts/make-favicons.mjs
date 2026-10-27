/**
 * BL-088 (PO 2026-10-27) — the site's favicons from the CURRENT logo's mark: the four-point Spark of the header wordmark
 * (components/Icons.tsx `Spark`), in the logo's accent colour (app/globals.css `--color-accent`). The wordmark itself is
 * unreadable at 16 px, so the icons show the Spark only. Both values are read from those files, so the icons follow the
 * logo if it ever changes; re-run this script then.
 *
 *   node scripts/make-favicons.mjs
 *
 * Writes (Next.js app/ metadata file conventions, picked up automatically for every page):
 * - app/icon.svg        the Spark in the accent; in a dark browser theme it switches to `--color-accent-dark` (contrast on a
 *                       dark tab bar ≈ 6.5:1 instead of ≈ 3.2:1)
 * - app/favicon.ico     16 × 16 and 32 × 32 PNG frames, accent on transparent
 * - app/apple-icon.png  180 × 180, accent Spark on a solid paper background (iOS ignores transparency)
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const icons = fs.readFileSync(path.join(root, "components", "Icons.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

const spark = /export function Spark[\s\S]*?<path d="([^"]+)"/.exec(icons)?.[1];
const token = (name) => new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1];
const accent = token("accent");
const accentDark = token("accent-dark");
const paper = token("paper");
if (!spark || !accent || !accentDark || !paper) throw new Error("Spark path or colour tokens not found; check Icons.tsx / globals.css");

// The Spark spans 2–22 of its 24-unit box; the favicons use the same box, so the mark keeps the logo's proportions.
const svg = (fill, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${extra}<path fill="${fill}" d="${spark}"/></svg>`;

// 1. app/icon.svg — light/dark aware.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><style>path{fill:${accent}}@media (prefers-color-scheme:dark){path{fill:${accentDark}}}</style><path d="${spark}"/></svg>\n`;
fs.writeFileSync(path.join(root, "app", "icon.svg"), iconSvg);

// 2. app/favicon.ico — PNG frames in an ICO container (sharp cannot write ICO; the container is a 6-byte header plus one
//    16-byte directory entry per frame).
const png = (size) => sharp(Buffer.from(svg(accent)), { density: 72 * (size / 24) * 4 }).resize(size, size).png().toBuffer();
const frames = [await png(16), await png(32)];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(frames.length, 4);
let offset = 6 + 16 * frames.length;
const entries = frames.map((buf, i) => {
  const size = [16, 32][i];
  const e = Buffer.alloc(16);
  e.writeUInt8(size, 0); // width
  e.writeUInt8(size, 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // colour planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += buf.length;
  return e;
});
fs.writeFileSync(path.join(root, "app", "favicon.ico"), Buffer.concat([header, ...entries, ...frames]));

// 3. app/apple-icon.png — 180 × 180, Spark at about 62 % on paper.
const apple = svg(accent, `<rect x="-6" y="-6" width="36" height="36" fill="${paper}"/>`).replace('viewBox="0 0 24 24"', 'viewBox="-4 -4 32 32"');
await sharp(Buffer.from(apple), { density: 72 * (180 / 32) * 2 }).resize(180, 180).flatten({ background: paper }).png().toFile(path.join(root, "app", "apple-icon.png"));

console.log(`✓ app/icon.svg, app/favicon.ico (16+32), app/apple-icon.png (180) — Spark ${spark.slice(0, 18)}…, accent ${accent} / dark ${accentDark}, paper ${paper}`);
