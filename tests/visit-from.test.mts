import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { visitFrom } from "../lib/visit-from";
import { linkHref, e46Href } from "../lib/instagram/links";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
const HOST = "www.zauberlabs.de";

describe("visit_from: visits from our Instagram profile (BL-119)", () => {
  test("?from=instagram on a landing sends { from: 'instagram', page } with the path only", () => {
    assert.deepEqual(visitFrom("?from=instagram", "/de/links", "https://l.instagram.com/", HOST), { from: "instagram", page: "/de/links" });
    assert.deepEqual(visitFrom("?from=instagram&utm_source=x", "/en/blog/telling-e46-wheels-apart/", "", HOST), { from: "instagram", page: "/en/blog/telling-e46-wheels-apart" });
  });
  test("only 'instagram' is recorded; other sources, no source and odd paths send nothing or 'other'", () => {
    for (const q of ["", "?from=facebook", "?from=Instagram", "?utm_source=instagram", "?from=instagram2"]) assert.equal(visitFrom(q, "/de", "", HOST), null, q);
    assert.deepEqual(visitFrom("?from=instagram", "/de/x@y.de", "", HOST), { from: "instagram", page: "other" });
  });
  test("not again when the visitor came from one of our own pages (/links → article), without storing anything", () => {
    assert.equal(visitFrom("?from=instagram", "/de/blog/e46-seats-cost-new", "https://www.zauberlabs.de/de/links?from=instagram", HOST), null);
    assert.deepEqual(visitFrom("?from=instagram", "/de", "not a url", HOST), { from: "instagram", page: "/de" });
    const tracker = read("components", "VisitFromTracker.tsx");
    assert.ok(!/sessionStorage|localStorage|document\.cookie\s*=|indexedDB/.test(tracker + read("lib", "visit-from.ts")), "nothing stored in the browser");
    assert.match(tracker, /if \(hasInternalMarker\(document\.cookie\)\) return;/, "the PO's own devices send nothing");
    assert.match(tracker, /track\(VISIT_FROM_EVENT, visit\)/);
    assert.match(read("app", "[lang]", "layout.tsx"), /<VisitFromTracker \/>/);
  });
  test("every /links target and the bio link carry from=instagram; zauberlabs.de/links goes to /de/links with the query", () => {
    for (const lang of ["en", "de"] as const) {
      for (const link of ["e46build", "vote", "blog/e46-seats-cost-new", undefined] as const) assert.match(linkHref(link, lang).href, /[?&]from=instagram(#|$)/);
      assert.match(e46Href(lang), /\?from=instagram$/);
    }
    assert.match(read("next.config.ts"), /\{ source: "\/links", destination: "\/de\/links", permanent: false \}/);
  });
  test("Datenschutz §5 names the event: origin and page only, nothing stored in the browser", () => {
    const ds = read("app", "[lang]", "datenschutz", "page.tsx").replace(/\s+/g, " ");
    assert.ok(ds.includes("Kommst du über einen Link aus unserem Instagram-Profil (erkennbar am Zusatz „from=instagram“ in der Adresse), übermitteln wir beim Laden der ersten Seite ein Ereignis an Vercel Web Analytics, das nur diese Herkunft und die aufgerufene Seite (ohne Parameter) enthält, zusammen mit denselben Angaben wie bei einem Seitenaufruf; in deinem Browser wird dafür nichts gespeichert."));
  });
});
