/**
 * BL-124 (PO 2026-11-09) — converts the PO's own infotainment picture (a 1448×1086 close-up of the E46 centre stack: BMW
 * Business CD radio, automatic climate panel, vents, gear knob) to the WebP the home page's "Take a closer look" panel shows
 * for Infotainment. The panel's stage is 3:2 on every screen, so the picture is cropped once to 3:2 at full width (1448×965),
 * the window centred on the radio + climate band (source rows ≈ 300–710), so both stay fully in frame on desktop and phones.
 * Nothing else: no retouching, no text; next/image serves the smaller widths (see `sizes` in components/CloserLook.tsx).
 * The input's SHA-256 is checked, so the output is reproducible; provenance is in public/images/README.md.
 *
 *   node scripts/make-closer-look-infotainment.mjs [path to the PNG]
 *   (default: ../e46/docs/images/e46_infotainment/27400dc4-a991-4e27-90f4-6ece999332d3.png)
 *
 * Writes public/images/closer-look/e46-infotainment-centre-stack.webp (1448×965).
 */
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve(process.argv[2] ?? path.join(process.cwd(), "..", "e46", "docs", "images", "e46_infotainment", "27400dc4-a991-4e27-90f4-6ece999332d3.png"));
const SHA256 = "2c607a44c54b7aab7e62663da62d8f821e88044a90ea016d39253d6032eeec55";
const OUT = path.join(process.cwd(), "public", "images", "closer-look", "e46-infotainment-centre-stack.webp");

// 3:2 window at full width, centred on the radio + climate band.
const CROP = { left: 0, top: 25, width: 1448, height: 965 };

const buf = fs.readFileSync(SRC);
const got = createHash("sha256").update(buf).digest("hex");
if (got !== SHA256) throw new Error(`${SRC}: SHA-256 ${got} is not the recorded ${SHA256}; check the source before rebuilding.`);
const meta = await sharp(buf).metadata();
if (meta.width !== 1448 || meta.height !== 1086) throw new Error(`source is ${meta.width}×${meta.height}, expected 1448×1086`);

await sharp(buf).extract(CROP).webp({ quality: 88, effort: 6 }).toFile(OUT);
console.log(`✓ ${path.relative(process.cwd(), OUT)}: ${CROP.width}×${CROP.height}, ${fs.statSync(OUT).size} bytes`);
