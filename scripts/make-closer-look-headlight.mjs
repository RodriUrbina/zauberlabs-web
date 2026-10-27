/**
 * BL-083.2 (PO 2026-10-27: "a zoomed image of the headlight, the way it was in the mock-up") — builds the "Headlights" picture
 * of the home page's "Take a closer look" panel: a 3:2 crop of E46BUILD's head-on front stage (HEADLIGHT_FRONT_VIEW,
 * e46build apps/web/public/images/headlights/e46-headlight-stage-front.webp, 1254×1254, an AI illustration by the PO; D-011)
 * on the car's right-hand headlight pair (left in the picture), with the fender, the grille's edge and the bumper around it,
 * the headlight centred vertically. The part stays on the car (PO rule 2026-10-27). No scaling: the crop keeps the source's
 * pixels (540×360), the browser scales it to the stage.
 * The input is read from e46build's master branch with `git show` and checked against its SHA-256, so the output is
 * reproducible.
 *
 *   node scripts/make-closer-look-headlight.mjs [path to the e46build checkout]   (default: ../e46/e46build)
 *
 * Writes public/images/closer-look/e46-headlight-stage-front-closeup.webp (540×360).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const REPO = path.resolve(process.argv[2] ?? path.join(process.cwd(), "..", "e46", "e46build"));
const INPUT = { path: "apps/web/public/images/headlights/e46-headlight-stage-front.webp", sha256: "cd2b8b54da6587a0a92a464739ea3004635ac22996613ebeb3d02eb0350f2d82" };
const OUT = path.join(process.cwd(), "public", "images", "closer-look", "e46-headlight-stage-front-closeup.webp");

// Crop box in source pixels (3:2): the headlight unit spans about x 60–390, y 490–590 of the 1254×1254 stage.
const BOX = { left: 10, top: 360, width: 540, height: 360 };

const buf = execFileSync("git", ["-C", REPO, "show", `master:${INPUT.path}`], { maxBuffer: 64 * 1024 * 1024 });
const got = createHash("sha256").update(buf).digest("hex");
if (got !== INPUT.sha256) throw new Error(`${INPUT.path}: SHA-256 ${got} is not the recorded ${INPUT.sha256}; check the source before rebuilding.`);
const meta = await sharp(buf).metadata();
if (meta.width !== 1254 || meta.height !== 1254) throw new Error(`front stage is ${meta.width}×${meta.height}, expected 1254×1254`);

await sharp(buf).extract(BOX).webp({ quality: 88 }).toFile(OUT);
console.log(`✓ ${path.relative(process.cwd(), OUT)}: ${BOX.width}×${BOX.height} px from (${BOX.left}, ${BOX.top}) of the 1254×1254 front stage`);
