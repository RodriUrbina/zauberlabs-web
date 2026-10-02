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

  test("leading colon after the grade is stripped (Editor review, 7 marks)", () => {
    assert.deepEqual(parseCite("S1, HIGH: both mirrors, Europe and USA"), [{ ids: ["S1"], level: "HIGH", qualifier: "both mirrors, Europe and USA" }]);
    assert.deepEqual(parseCite("S1, MEDIUM: one mirror, US part page; Europe by analogy"), [{ ids: ["S1"], level: "MEDIUM", qualifier: "one mirror, US part page; Europe by analogy" }]);
  });

  test("compound grades: lower grade on the chip, full wording kept (Editor review, 5 marks)", () => {
    assert.deepEqual(parseCite("S3, LOW–MEDIUM: inspection guides and forum reports"), [{ ids: ["S3"], level: "LOW", qualifier: "LOW–MEDIUM: inspection guides and forum reports" }]);
    assert.deepEqual(parseCite("S2, MEDIUM-HIGH for the family"), [{ ids: ["S2"], level: "MEDIUM", qualifier: "MEDIUM-HIGH for the family" }]);
    assert.deepEqual(parseCite("S2, HIGH/MEDIUM for the rows"), [{ ids: ["S2"], level: "MEDIUM", qualifier: "HIGH/MEDIUM for the rows" }]);
  });

  // The 13 marks the Editor listed on PR #5 (BL-010, BL-021, BL-011, BL-015). A ";"-segment without a source id
  // is a caveat on the preceding chip and must never disappear.
  const realMarks: [string, { ids: string[]; level?: "HIGH" | "MEDIUM" | "LOW"; qualifier?: string }[]][] = [
    ['S1, HIGH for the xenon dependency; MEDIUM for the date; S2, MEDIUM for "Coupé and Convertible only"', [
      { ids: ["S1"], level: "HIGH", qualifier: "for the xenon dependency; MEDIUM for the date" },
      { ids: ["S2"], level: "MEDIUM", qualifier: 'for "Coupé and Convertible only"' },
    ]],
    ["S3, MEDIUM for the requirement; LOW–MEDIUM for the inspection outcome", [{ ids: ["S3"], level: "MEDIUM", qualifier: "for the requirement; LOW–MEDIUM for the inspection outcome" }]],
    ["S1, HIGH that it exists; contents not established", [{ ids: ["S1"], level: "HIGH", qualifier: "that it exists; contents not established" }]],
    ["S1, HIGH for the listing; S3, HIGH for the amber rule; bulb type NOT ESTABLISHED", [
      { ids: ["S1"], level: "HIGH", qualifier: "for the listing" },
      { ids: ["S3"], level: "HIGH", qualifier: "for the amber rule; bulb type NOT ESTABLISHED" },
    ]],
    ["S1, MEDIUM: one mirror's month views; absence of dates on both", [{ ids: ["S1"], level: "MEDIUM", qualifier: "one mirror's month views; absence of dates on both" }]],
    ["S1, HIGH for what the rows show; the maker itself NOT ESTABLISHED", [{ ids: ["S1"], level: "HIGH", qualifier: "for what the rows show; the maker itself NOT ESTABLISHED" }]],
    ["S2, numbers HIGH for Europe; date MEDIUM; S3, HIGH that bi-xenon was new for model year 2002", [
      { ids: ["S2"], level: "HIGH", qualifier: "numbers HIGH for Europe; date MEDIUM" },
      { ids: ["S3"], level: "HIGH", qualifier: "that bi-xenon was new for model year 2002" },
    ]],
    ["S1, Europe numbers HIGH; dates MEDIUM; the March 2003 month HIGH via the bumper evidence", [{ ids: ["S1"], level: "HIGH", qualifier: "Europe numbers HIGH; dates MEDIUM; the March 2003 month HIGH via the bumper evidence" }]],
    ["S1, MEDIUM: one mirror, US part page; Europe by analogy", [{ ids: ["S1"], level: "MEDIUM", qualifier: "one mirror, US part page; Europe by analogy" }]],
    ["S1, cut-over month HIGH; dates on rows MEDIUM", [{ ids: ["S1"], level: "HIGH", qualifier: "cut-over month HIGH; dates on rows MEDIUM" }]],
    ["S3, MEDIUM; absence in one mirror is not proof of absence", [{ ids: ["S3"], level: "MEDIUM", qualifier: "absence in one mirror is not proof of absence" }]],
    ["S1, HIGH that both phrases are in the document; the meaning of the cover-page phrase is MEDIUM at best", [{ ids: ["S1"], level: "HIGH", qualifier: "that both phrases are in the document; the meaning of the cover-page phrase is MEDIUM at best" }]],
    ["S1, HIGH for the scope statement; the month itself MEDIUM because of the conflict", [{ ids: ["S1"], level: "HIGH", qualifier: "for the scope statement; the month itself MEDIUM because of the conflict" }]],
  ];

  for (const [mark, expected] of realMarks) {
    test(`real mark keeps every caveat: [${mark.slice(0, 48)}…]`, () => {
      assert.deepEqual(parseCite(mark), expected);
      // nothing from the mark is lost: every word of the mark (minus ids and separators) is in a chip's id/level/qualifier
      const kept = expected.map((g) => [g.ids.join(" "), g.level ?? "", g.qualifier ?? ""].join(" ")).join(" ");
      for (const word of mark.replace(/[;:,"]/g, " ").split(/\s+/).filter(Boolean)) {
        assert.ok(kept.includes(word), `"${word}" lost from [${mark}]`);
      }
    });
  }

  test("caveats survive MDX compilation (rendered page text)", async () => {
    const src = realMarks.map(([m], i) => `Claim ${i}. [${m}]`).join("\n\n") + "\n";
    const out = String(await compile(src, { remarkPlugins: [remarkCite], outputFormat: "function-body" }));
    const unescape = (s: string) => JSON.parse(`"${s}"`) as string; // compiled JS string literals are escaped
    const payloads = [...out.matchAll(/groups:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => unescape(m[1]));
    const all = payloads.join("\n");
    for (const needle of ["date MEDIUM", "bulb type NOT ESTABLISHED", "the month itself MEDIUM because of the conflict", "contents not established", "absence of dates on both", "LOW–MEDIUM for the inspection outcome", "the maker itself NOT ESTABLISHED"]) {
      assert.ok(all.includes(needle), `caveat "${needle}" missing from compiled output`);
    }
    assert.equal(payloads.length, realMarks.length, "one <Cite> per mark");
  });

  test("turns marks into <Cite> and leaves links, code and other brackets alone", async () => {
    const src = "Claim one. [S1, HIGH] See [a link](https://x.y) and `[S9]` and [not a mark] and [no id, MEDIUM].\n\n```\n[S2]\n```\n";
    const out = String(await compile(src, { remarkPlugins: [remarkCite], outputFormat: "function-body" }));
    assert.equal((out.match(/_components\.Cite|Cite,/g) ?? []).length >= 1, true);
    assert.ok(/S1/.test(out) && /HIGH/.test(out), "cite payload carries id and level");
    assert.ok(out.includes("not a mark"));
    assert.ok(out.includes("[no id, MEDIUM]"), "a mark without any source id stays plain text");
    assert.ok(out.includes("[S9]"), "inline code untouched");
    assert.ok(out.includes("[S2]"), "code block untouched");
  });
});
