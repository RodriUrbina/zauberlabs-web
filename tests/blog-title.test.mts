import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { splitTitle, TITLE_ACCENTS } from "../lib/blog-title";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");

describe("article h1 in the title code (BL-126)", () => {
  test("a colon: the lead keeps the colon, the accent is the rest", () => {
    assert.deepEqual(splitTitle("One cover for every Sedan and Touring: the genuine E46 M front bumper"), { lead: "One cover for every Sedan and Touring: ", accent: "the genuine E46 M front bumper" });
    assert.deepEqual(splitTitle("Sechs Felgen, drei Familien: So unterscheidest du die Werksfelgen des E46"), { lead: "Sechs Felgen, drei Familien: ", accent: "So unterscheidest du die Werksfelgen des E46" });
  });
  test("two colons: split at the first", () => {
    assert.deepEqual(splitTitle("The BMW factory: Eisenach: 1928 to 1992"), { lead: "The BMW factory: ", accent: "Eisenach: 1928 to 1992" });
  });
  test("German quotes: a colon inside „…“ is not the split point", () => {
    assert.deepEqual(splitTitle("„Achtung: Nachbau“ steht nie im Titel: so erkennst du eine Kopie"), { lead: "„Achtung: Nachbau“ steht nie im Titel: ", accent: "so erkennst du eine Kopie" });
    assert.deepEqual(splitTitle("Was „M-Technik“ heißt: BMWs eigene Namen"), { lead: "Was „M-Technik“ heißt: ", accent: "BMWs eigene Namen" });
  });
  test("no colon: a question first, else the last comma or dash, else the last three words", () => {
    assert.deepEqual(splitTitle("Genuine or replica? How to read an E46 wheel listing"), { lead: "Genuine or replica? ", accent: "How to read an E46 wheel listing" });
    assert.deepEqual(splitTitle("The wheel that fits an E46, unless the E46 is American"), { lead: "The wheel that fits an E46, ", accent: "unless the E46 is American" });
    assert.deepEqual(splitTitle("Same car — different lights"), { lead: "Same car — ", accent: "different lights" });
    assert.deepEqual(splitTitle("Four genuine E46 wheels cost in 2026"), { lead: "Four genuine E46 wheels ", accent: "cost in 2026" }, "rule 4");
    assert.deepEqual(splitTitle("Short title"), { lead: "", accent: "Short title" });
  });
  test("the PO's hand-picked split wins over rule 4 (wheels-cost article, EN + DE); each override matches a real title", () => {
    assert.deepEqual(splitTitle("What four genuine E46 wheels really cost in 2026"), { lead: "What four genuine E46 wheels ", accent: "really cost in 2026" });
    assert.deepEqual(splitTitle("Was vier originale E46-Felgen 2026 wirklich kosten"), { lead: "Was vier originale E46-Felgen ", accent: "2026 wirklich kosten" });
    const titles = ["en", "de"].map((l) => /^title:\s*"?(.+?)"?$/m.exec(read("content", "blog", "e46-four-genuine-wheels-cost", `${l}.mdx`))?.[1]);
    assert.deepEqual(Object.keys(TITLE_ACCENTS).sort(), titles.sort(), "the overrides are exactly this article's titles");
  });
  test("every article title splits into a lead and a non-empty accent that read as the whole title", () => {
    const dir = path.join(process.cwd(), "content", "blog");
    for (const slug of fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory())) {
      for (const f of fs.readdirSync(path.join(dir, slug)).filter((f) => f.endsWith(".mdx"))) {
        const raw = /^title:\s*(.+)$/m.exec(read("content", "blog", slug, f))?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
        if (!raw) continue;
        const { lead, accent } = splitTitle(raw);
        assert.ok(accent.length > 0, `${slug}/${f}`);
        assert.equal(`${lead}${accent}`.replace(/\s+/g, " "), raw.replace(/\s+/g, " "), `${slug}/${f}`);
      }
    }
  });
  test("only the visible h1 changes: the page renders <Title as=\"h1\"> from splitTitle; metadata keeps the plain title", () => {
    const page = read("app", "[lang]", "blog", "[slug]", "page.tsx");
    assert.match(page, /<Title as="h1" \{\.\.\.splitTitle\(m\.title\)\}/);
    assert.ok(!/<h1[^>]*>\{m\.title\}<\/h1>/.test(page), "no plain h1 left");
    assert.ok(!/splitTitle/.test(read("lib", "blog-og.ts")) && !/splitTitle/.test(read("app", "sitemap.ts")), "og and sitemap untouched");
  });
});
