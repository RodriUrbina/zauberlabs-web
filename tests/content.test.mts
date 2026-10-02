import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { createBlog } from "../lib/blog";
import remarkCite, { parseCite } from "../lib/remark-cite";

/** The real content folder: every article must validate and its MDX must compile. */
describe("content/blog", () => {
  const blog = createBlog({ includeDrafts: true });

  test("every article validates (drafts included)", () => {
    assert.ok(blog.slugs().length >= 1, "at least the sample fixture exists");
  });

  for (const slug of blog.slugs()) {
    for (const lang of ["en", "de"] as const) {
      const r = blog.getPost(slug, lang);
      if (!r || r.fallback) continue;
      test(`${slug}/${lang}.mdx compiles as MDX`, async () => {
        const out = await compile(r.post.body, { remarkPlugins: [remarkGfm, remarkCite], outputFormat: "function-body" });
        assert.ok(String(out).length > 0);
      });
    }
  }
});

describe("remark-cite", () => {
  test("parses the Writer's mark grammar", () => {
    assert.deepEqual(parseCite("S1"), [{ ids: ["S1"], level: undefined, qualifier: undefined }]);
    assert.deepEqual(parseCite("S1, HIGH"), [{ ids: ["S1"], level: "HIGH", qualifier: undefined }]);
    assert.deepEqual(parseCite("S1, HIGH that the document says so"), [{ ids: ["S1"], level: "HIGH", qualifier: "that the document says so" }]);
    assert.deepEqual(parseCite("S2, S4"), [{ ids: ["S2", "S4"], level: undefined, qualifier: undefined }]);
    assert.deepEqual(parseCite("S2, HIGH for x; S4, LOW for y"), [
      { ids: ["S2"], level: "HIGH", qualifier: "for x" },
      { ids: ["S4"], level: "LOW", qualifier: "for y" },
    ]);
    assert.deepEqual(parseCite("S5, open item"), [{ ids: ["S5"], level: undefined, qualifier: "open item" }]);
  });

  test("turns marks into <Cite> and leaves links, code and other brackets alone", async () => {
    const src = "Claim one. [S1, HIGH] See [a link](https://x.y) and `[S9]` and [not a mark].\n\n```\n[S2]\n```\n";
    const out = String(await compile(src, { remarkPlugins: [remarkCite], outputFormat: "function-body" }));
    assert.equal((out.match(/_components\.Cite|Cite,/g) ?? []).length >= 1, true);
    assert.ok(/S1/.test(out) && /HIGH/.test(out), "cite payload carries id and level");
    assert.ok(out.includes("not a mark"));
    assert.ok(out.includes("[S9]"), "inline code untouched");
    assert.ok(out.includes("[S2]"), "code block untouched");
  });
});
