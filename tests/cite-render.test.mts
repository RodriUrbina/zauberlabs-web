import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Cite from "../components/blog/Cite";
import { parseCite } from "../lib/remark-cite";

/**
 * Rendered-mark snapshot (BL-023): superscript source numbers only, everything else in the tooltip.
 * Update deliberately with:  UPDATE_SNAPSHOT=1 npm test
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = path.join(here, "__snapshots__", "cite-marks.html");

const MARKS = [
  "S4, HIGH",
  "S9, MEDIUM; S11, MEDIUM for the exact days",
  "S2, S4",
  "S1, HIGH for the scope statement; the month itself MEDIUM because of the conflict",
  "S3, LOW–MEDIUM: inspection guides and forum reports",
  "S5, open item",
  "S1",
  "S1, HIGH for the listing; S3, HIGH for the amber rule; bulb type NOT ESTABLISHED",
];

function render(mark: string, lang: "en" | "de" = "en") {
  return renderToStaticMarkup(createElement(Cite, { groups: parseCite(mark), lang }));
}

describe("Cite rendering (BL-023)", () => {
  test("only the source numbers are visible; grade and qualifier live in the tooltip", () => {
    const html = render("S9, MEDIUM; S11, MEDIUM for the exact days");
    const visible = html.replace(/<[^>]+>/g, "");
    assert.equal(visible, "9,11");
    assert.ok(html.startsWith("<sup class=\"cite\">"));
    assert.ok(html.includes('href="#src-s9"') && html.includes('href="#src-s11"'));
    assert.ok(html.includes('title="S9 · MEDIUM"'));
    assert.ok(html.includes('title="S11 · MEDIUM — for the exact days"'));
    assert.ok(!/MEDIUM(?![^<]*")/.test(visible), "no grade in the visible text");
  });

  test("a group with several ids gives one number per source, deduplicated across groups", () => {
    assert.equal(render("S2, S4").replace(/<[^>]+>/g, ""), "2,4");
    assert.equal(render("S1, HIGH for x; S1, MEDIUM for y").replace(/<[^>]+>/g, ""), "1");
  });

  test("an id-less caveat stays attached to the preceding number's tooltip", () => {
    const html = render("S1, HIGH for the scope statement; the month itself MEDIUM because of the conflict");
    assert.equal(html.replace(/<[^>]+>/g, ""), "1");
    assert.ok(html.includes("the month itself MEDIUM because of the conflict"));
  });

  test("German pages get a German accessible name", () => {
    assert.ok(render("S4, HIGH", "de").includes('aria-label="Quelle 4: S4 · HIGH"'));
    assert.ok(render("S4, HIGH", "en").includes('aria-label="Source 4: S4 · HIGH"'));
  });

  test("snapshot of all rendered marks", () => {
    const actual = MARKS.map((m) => `<!-- [${m}] -->\n${render(m)}`).join("\n\n") + "\n";
    if (process.env.UPDATE_SNAPSHOT === "1" || !fs.existsSync(SNAPSHOT)) {
      fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
      fs.writeFileSync(SNAPSHOT, actual);
    }
    const expected = fs.readFileSync(SNAPSHOT, "utf8");
    assert.equal(actual, expected, "rendered citation marks changed; run UPDATE_SNAPSHOT=1 npm test if intended");
  });
});
