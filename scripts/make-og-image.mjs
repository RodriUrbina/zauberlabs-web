/**
 * T-286 (PO 2026-11-10) — the site's default share image (og:image / twitter:image) for WhatsApp & co.: the PO's E46 M3 Touring
 * dream build with the plate blanked (e46build docs/social/instagram/assets/e46-m3-touring-hero-plate-blank.webp, 1774×887,
 * AI image), the WHOLE picture contained in 1200×630 on black (thin bars top and bottom; nothing cut), no text or logo added.
 * Local tools only. The input's SHA-256 is checked, so the output is reproducible. New file name, so share caches refetch it.
 *
 *   node scripts/make-og-image.mjs [path to the webp]   (default: ../e46/e46build/docs/social/instagram/assets/…)
 *
 * Writes public/images/og-zauberlabs-v2.jpg (1200×630 JPEG, ≤ 300 KB).
 */
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve(process.argv[2] ?? path.join(process.cwd(), "..", "e46", "e46build", "docs", "social", "instagram", "assets", "e46-m3-touring-hero-plate-blank.webp"));
const SHA256 = "1a2f039bae6edba91bd2290a1db0778199504eaadd9e33569987d2432d50051e";
const OUT = path.join(process.cwd(), "public", "images", "og-zauberlabs-v2.jpg");

const buf = fs.readFileSync(SRC);
const got = createHash("sha256").update(buf).digest("hex");
if (got !== SHA256) throw new Error(`${SRC}: SHA-256 ${got} is not the recorded ${SHA256}; check the source before rebuilding.`);

await sharp(buf)
  .resize(1200, 630, { fit: "contain", background: { r: 0, g: 0, b: 0 } })
  .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(OUT);
const size = fs.statSync(OUT).size;
if (size > 300 * 1024) throw new Error(`${OUT} is ${size} bytes (> 300 KB)`);
console.log(`✓ ${path.relative(process.cwd(), OUT)}: 1200×630, ${size} bytes`);
