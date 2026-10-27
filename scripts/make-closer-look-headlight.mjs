/**
 * BL-083.3 (PO 2026-10-27: the Headlights picture "isn't crisp enough") — converts the PO's new high-res AI render of a
 * post-facelift E46 bi-xenon headlight (lit, angel eyes, on the car; 1536×1024 PNG with a C2PA manifest marked
 * trainedAlgorithmicMedia) to the WebP the home page's "Take a closer look" panel shows. Same size (3:2, the stage's own
 * ratio, so nothing is cropped); next/image serves the smaller widths from it (see `sizes` in components/CloserLook.tsx).
 * The input's SHA-256 is checked, so the output is reproducible. Metadata (incl. the C2PA manifest) is not copied;
 * provenance is recorded in public/images/README.md.
 *
 *   node scripts/make-closer-look-headlight.mjs [path to Post_High_Res.png]
 *   (default: ../e46/docs/images/e46_headlights_shape/Post_High_Res.png)
 *
 * Writes public/images/closer-look/e46-headlight-look-bi-xenon-late-hires.webp (1536×1024).
 */
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve(process.argv[2] ?? path.join(process.cwd(), "..", "e46", "docs", "images", "e46_headlights_shape", "Post_High_Res.png"));
const SHA256 = "a814f65de7d61d74bd38f9e657d06145ec5fbc83c930a48bf4dadc1bf8581a51";
const OUT = path.join(process.cwd(), "public", "images", "closer-look", "e46-headlight-look-bi-xenon-late-hires.webp");

const buf = fs.readFileSync(SRC);
const got = createHash("sha256").update(buf).digest("hex");
if (got !== SHA256) throw new Error(`${SRC}: SHA-256 ${got} is not the recorded ${SHA256}; check the source before rebuilding.`);
const meta = await sharp(buf).metadata();
if (meta.width !== 1536 || meta.height !== 1024) throw new Error(`source is ${meta.width}×${meta.height}, expected 1536×1024`);

await sharp(buf).webp({ quality: 88, effort: 6 }).toFile(OUT);
console.log(`✓ ${path.relative(process.cwd(), OUT)}: ${fs.statSync(OUT).size} bytes`);
