import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { dictionaries } from "../lib/i18n";
import { SITE_OG_IMAGE } from "../lib/blog-og";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");

describe("share preview (T-286)", () => {
  test("the default share image: new file, 1200×630 JPEG, ≤ 300 KB, made by the hash-checked script", async () => {
    assert.equal(SITE_OG_IMAGE, "/images/og-zauberlabs-v2.jpg");
    const file = path.join(process.cwd(), "public", SITE_OG_IMAGE);
    const meta = await sharp(file).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height], ["jpeg", 1200, 630]);
    assert.ok(fs.statSync(file).size <= 300 * 1024);
    assert.match(read("scripts", "make-og-image.mjs"), /1a2f039bae6edba91bd2290a1db0778199504eaadd9e33569987d2432d50051e[\s\S]*fit: "contain"/);
  });
  test("alt texts and share descriptions as the PO decided; the SEO description is unchanged", () => {
    assert.equal(dictionaries.en.hero.ogAlt, "AI image of a BMW E46 M3 Touring — a dream build BMW never sold.");
    assert.equal(dictionaries.de.hero.ogAlt, "KI-Bild eines BMW E46 M3 Touring – ein Traum-Build, den BMW nie verkauft hat.");
    assert.equal(dictionaries.en.meta.ogTitle, "zauberlabs — See what your car could be.");
    assert.equal(dictionaries.de.meta.ogTitle, "zauberlabs — Sieh, was dein Auto sein könnte.");
    assert.equal(dictionaries.en.meta.ogDescription, "And buy only what fits. Configurators for youngtimers.");
    assert.equal(dictionaries.de.meta.ogDescription, "Und kauf nur, was passt. Konfiguratoren für Youngtimer.");
    assert.equal(dictionaries.de.meta.title, "zauberlabs — Konfiguratoren für die Autos, die das Werk vergessen hat", "browser title unchanged");
    assert.match(dictionaries.en.meta.description, /^Independent car configurators for modern classics\./, "SEO description unchanged");
    const layout = read("app", "[lang]", "layout.tsx");
    assert.match(layout, /title: t\.meta\.title,\n    description: t\.meta\.description,/, "browser title and meta description");
    assert.match(layout, /openGraph: \{ title: t\.meta\.ogTitle, description: t\.meta\.ogDescription, images: \[\{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt:/);
  });
  test("the About pages get the share image and alt too, with their own title and description", () => {
    const about = read("components", "AboutPage.tsx");
    assert.match(about, /title: ABOUT_TITLE\[only\], description: ABOUT_DESCRIPTION\[only\]/);
    assert.match(about, /images: \[\{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: dictionaries\[only\]\.hero\.ogAlt \}\]/);
  });
});
