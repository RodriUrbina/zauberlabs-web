import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { heroFocus } from "../components/blog/HeroImage";
import { getBlog } from "../lib/blog";

const POSITION = /^(100|[1-9]?\d)% (100|[1-9]?\d)%$/;

describe("blog hero focal point (BL-101)", () => {
  test("without hero.position the image gets no extra props (centred object-cover, exactly as before)", () => {
    assert.deepEqual(heroFocus({}), {});
    assert.deepEqual(heroFocus({ position: undefined }), {});
    const src = fs.readFileSync(path.join(process.cwd(), "components", "blog", "HeroImage.tsx"), "utf8");
    assert.match(src, /className="object-cover" \{\.\.\.heroFocus\(hero\)\} \/>/, "the only change to the image element");
  });
  test("with hero.position only object-position is set", () => {
    assert.deepEqual(heroFocus({ position: "50% 10%" }), { style: { objectPosition: "50% 10%" } });
  });
  test("only the M front bumper article sets it (both languages); every other article's hero has no position", () => {
    const blog = getBlog();
    for (const lang of ["en", "de"] as const) {
      for (const r of blog.listPosts(lang)) {
        const pos = r.post.meta.hero.position;
        if (r.post.slug === "e46-genuine-m-front-bumper") assert.equal(pos, "50% 10%", lang);
        else assert.equal(pos, undefined, `${lang} ${r.post.slug}`);
      }
    }
  });
  test("the schema accepts 'X% Y%' (0–100) only", () => {
    for (const ok of ["50% 10%", "0% 0%", "100% 100%"]) assert.ok(POSITION.test(ok), ok);
    for (const bad of ["top", "50%", "50% 10", "150% 0%", "50% 10% 0%"]) assert.ok(!POSITION.test(bad), bad);
    const schema = fs.readFileSync(path.join(process.cwd(), "lib", "blog-schema.ts"), "utf8");
    assert.ok(schema.includes(String.raw`position: z.string().regex(/^(100|[1-9]?\d)% (100|[1-9]?\d)%$/`), "same pattern in the schema");
  });
});
