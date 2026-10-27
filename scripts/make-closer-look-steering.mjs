/**
 * BL-083 (PO 2026-10-27: "steering wheel must be mounted in the cockpit, not by itself") — builds the "Steering wheels"
 * picture of the home page's "Take a closer look" panel: E46BUILD's empty cockpit stage with E46BUILD's M Sport cut-out laid
 * on it, at the exact position and size E46BUILD's configurator uses (T-170 overlay geometry,
 * e46build apps/web/src/lib/steering-stage.ts):
 *   - rim centre = the steering column's hub, (747, 355) px on the 1672×941 cockpit (STEERING_STAGE_RIM.x / .y × 1672)
 *   - rim outer diameter = 413/1200 of the cockpit's width (STEERING_STAGE_RIM.diameter) = 575.45 px
 *   - the rim fills 0.98 of the square cut-out's side (STEERING_CUTOUT_RIM_FILL) → cut-out side 587.2 px, top-left (453.4, 61.4)
 * Both inputs are read from e46build's master branch with `git show` and checked against the SHA-256 below, so the
 * output is reproducible. Both are AI renders by the PO (provenance: e46build docs/research/d002-stage-images and
 * docs/research/t125-steering-cutouts).
 *
 *   node scripts/make-closer-look-steering.mjs [path to the e46build checkout]   (default: ../e46/e46build)
 *
 * Writes public/images/closer-look/e46-steering-stage-cockpit-m-sport.webp (1672×941).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const REPO = path.resolve(process.argv[2] ?? path.join(process.cwd(), "..", "e46", "e46build"));
const INPUTS = {
  cockpit: { path: "apps/web/public/images/steering/e46-steering-stage-cockpit.webp", sha256: "49dd75052c14109488fa8cb359882b8769ce78da731f71f389f652b0eb95e731" },
  cutout: { path: "apps/web/public/images/steering/e46-steering-cutout-m-sport.webp", sha256: "d640cfcf98c195ccd6ebcfee8c90f5e4db365cb5d49f7061a56e5d335107144f" },
};
const OUT = path.join(process.cwd(), "public", "images", "closer-look", "e46-steering-stage-cockpit-m-sport.webp");

// T-170 geometry, in cockpit pixels (see the header).
const W = 1672;
const RIM = { x: (747 / 1672) * W, y: (355 / 1672) * W, diameter: (413 / 1200) * W };
const RIM_FILL = 0.98;

function read({ path: p, sha256 }) {
  const buf = execFileSync("git", ["-C", REPO, "show", `master:${p}`], { maxBuffer: 64 * 1024 * 1024 });
  const got = createHash("sha256").update(buf).digest("hex");
  if (got !== sha256) throw new Error(`${p}: SHA-256 ${got} is not the recorded ${sha256}; check the source before rebuilding.`);
  return buf;
}

const cockpit = read(INPUTS.cockpit);
const meta = await sharp(cockpit).metadata();
if (meta.width !== W || meta.height !== 941) throw new Error(`cockpit is ${meta.width}×${meta.height}, expected 1672×941`);

const side = Math.round(RIM.diameter / RIM_FILL);
const left = Math.round(RIM.x - side / 2);
const top = Math.round(RIM.y - side / 2);
const cutout = await sharp(read(INPUTS.cutout)).resize(side, side, { kernel: "lanczos3" }).toBuffer();

await sharp(cockpit).composite([{ input: cutout, left, top }]).webp({ quality: 82 }).toFile(OUT);
console.log(`✓ ${path.relative(process.cwd(), OUT)}: cut-out ${side}×${side} px at (${left}, ${top}) on the ${W}×941 cockpit`);
