import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { dictionaries, INSTAGRAM_URL } from "../lib/i18n";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");

describe("footer: Instagram link (BL-121)", () => {
  test("a plain link to our profile, new tab, noopener noreferrer, named in EN and DE", () => {
    assert.equal(INSTAGRAM_URL, "https://www.instagram.com/zauberlabs/", "@zauberlabs (BL-123)");
    const ds = read("app", "[lang]", "datenschutz", "page.tsx");
    assert.ok(ds.includes("Wir betreiben auf Instagram das Profil „zauberlabs“.") && !ds.includes("Profil „zauberlabs.de“"), "Datenschutz names @zauberlabs");
    for (const f of [["README.md"], ["lib", "instagram", "comments.ts"], ["lib", "instagram", "env.ts"], ["lib", "i18n.ts"]]) assert.ok(!/instagram\.com\/zauberlabs\.de|\(zauberlabs\.de\)/.test(read(...f)), f.join("/"));
    assert.equal(dictionaries.en.footer.instagram, "zauberlabs on Instagram");
    assert.equal(dictionaries.de.footer.instagram, "zauberlabs auf Instagram");
    const footer = read("components", "SiteFooter.tsx");
    assert.match(footer, /href=\{INSTAGRAM_URL\}\s+target="_blank"\s+rel="noopener noreferrer"\s+aria-label=\{t\.footer\.instagram\}/);
    assert.match(footer, /<Instagram className="size-5" \/>/);
    assert.match(footer, /text-fog hover:text-paper/, "the footer's text colour and hover");
  });
  test("the glyph is our own inline SVG: no embed, no script, nothing loaded from Instagram", () => {
    const icons = read("components", "Icons.tsx");
    const glyph = icons.slice(icons.indexOf("export function Instagram"), icons.indexOf("export function Wordmark"));
    assert.match(glyph, /<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"/);
    assert.ok(!/href|src=|<image|<use/.test(glyph), "no external reference in the SVG");
    const footer = read("components", "SiteFooter.tsx");
    assert.ok(!/<script|<iframe|instagram\.com\/embed|cdninstagram/.test(footer + icons));
    assert.equal((footer.match(/INSTAGRAM_URL/g) ?? []).length, 2, "imported and used once");
  });
});
