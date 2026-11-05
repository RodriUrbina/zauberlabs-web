import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CLICK_PLACES, clickFrom, clickPlace, configuratorFor, configuratorHosts } from "../lib/configurator-click";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");

/** A stand-in for a DOM element: its ancestors (itself first), each a tag name and attributes; closest() as in the browser. */
function el(...chain: { tag: string; attrs?: Record<string, string> }[]) {
  return {
    closest(selector: string) {
      const m = /^\[([a-z-]+)\]$/.exec(selector);
      const hit = chain.find((n) => (m ? n.attrs?.[m[1]] !== undefined : n.tag === selector));
      return hit ? { getAttribute: (name: string) => hit.attrs?.[name] ?? null } : null;
    },
  };
}

describe("configurator click event (BL-050)", () => {
  const hosts = configuratorHosts("https://e46.zauberlabs.de");
  test("maps links to the E46 configurator to 'e46', whatever the path or query", () => {
    assert.equal(configuratorFor("https://e46.zauberlabs.de", hosts), "e46");
    assert.equal(configuratorFor("https://e46.zauberlabs.de/build?car=abc", hosts), "e46");
  });
  test("ignores every other link", () => {
    assert.equal(configuratorFor("https://www.zauberlabs.de/de/blog", hosts), null);
    assert.equal(configuratorFor("https://e46.zauberlabs.de.example.com/", hosts), null);
    assert.equal(configuratorFor("mailto:hello@zauberlabs.de", hosts), null);
    assert.equal(configuratorFor("not a url", hosts), null);
  });
  test("a broken configurator URL disables the event instead of failing", () => {
    assert.deepEqual(configuratorHosts("not a url"), {});
  });
});

describe("configurator click: the page and the spot it was clicked on (BL-116)", () => {
  test("an article: blog/<slug>, the same in EN and DE, without query or hash", () => {
    assert.equal(clickFrom("/en/blog/e46-headlights"), "blog/e46-headlights");
    assert.equal(clickFrom("/de/blog/e46-scheinwerfer"), "blog/e46-scheinwerfer");
    assert.equal(clickFrom("/de/blog/e46-scheinwerfer/?utm_source=x#cta"), "blog/e46-scheinwerfer");
    assert.equal(clickFrom("/en/blog/tag/wheels"), "blog/tag/wheels");
    assert.equal(clickFrom("/de/blog"), "blog");
  });
  test("the home page is 'home' in EN and DE; About is 'about' in both; shop and legal pages keep their path", () => {
    for (const p of ["/en", "/de", "/en/", "/de/", "/", "/de#next"]) assert.equal(clickFrom(p), "home", p);
    assert.equal(clickFrom("/en/about"), "about");
    assert.equal(clickFrom("/de/ueber-uns"), "about");
    assert.equal(clickFrom("/de/shop"), "shop");
    assert.equal(clickFrom("/de/datenschutz"), "datenschutz");
  });
  test("anything that is not a plain path of ours becomes 'other'", () => {
    for (const p of ["/en/blog/%C3%BCber", "/en/Blog/X", "/de/a/b/c/d", `/en/${"a".repeat(81)}`, "/en/blog/x@y.de"]) assert.equal(clickFrom(p), "other", p);
  });
  test("the place: the footer in EN and DE (found by its element), the article box, inline links, the home slots", () => {
    assert.equal(clickPlace(el({ tag: "a" }, { tag: "div" }, { tag: "footer" })), "footer");
    assert.equal(clickPlace(el({ tag: "a" }, { tag: "header" })), "header");
    assert.equal(clickPlace(el({ tag: "a" }, { tag: "section", attrs: { "data-click-place": "article-cta" } }, { tag: "article" })), "article-cta");
    assert.equal(clickPlace(el({ tag: "a", attrs: { "data-click-place": "inline" } }, { tag: "article" })), "inline");
    assert.equal(clickPlace(el({ tag: "a" }, { tag: "div", attrs: { "data-click-place": "closer-look" } })), "closer-look");
    assert.equal(clickPlace(el({ tag: "a", attrs: { "data-click-place": "made-up" } })), "other", "only listed places are sent");
    assert.equal(clickPlace(el({ tag: "a" }, { tag: "main" })), "other");
    // One footer for both languages: the E46BUILD links in it carry no marker of their own, so they count as "footer".
    const footer = read("components", "SiteFooter.tsx");
    assert.match(footer, /<footer /);
    assert.ok(!footer.includes("data-click-place"));
  });
  test("every marker in the code is a listed place; article box, inline links (both kinds), hero, closer look are marked", () => {
    const files = [["components", "HomeHero.tsx"], ["components", "CloserLook.tsx"], ["components", "VoteCard.tsx"], ["components", "StickyStartBar.tsx"], ["components", "blog", "ConfiguratorCta.tsx"], ["components", "blog", "mdx-components.tsx"], ["app", "[lang]", "page.tsx"]];
    const marks = files.flatMap((f) => [...read(...f).matchAll(/data-click-place="([a-z-]+)"/g)].map((m) => m[1]));
    for (const m of marks) assert.ok((CLICK_PLACES as readonly string[]).includes(m), m);
    for (const m of ["hero", "closer-look", "vote", "blog-teaser", "sticky-bar", "article-cta", "inline"]) assert.ok(marks.includes(m), m);
    assert.equal(marks.filter((m) => m === "inline").length, 2, "<ConfiguratorLink> and plain E46BUILD links in the article body");
  });
  test("the tracker sends only configurator, from and place; nothing about the person", () => {
    const tracker = read("components", "ConfiguratorClickTracker.tsx");
    assert.match(tracker, /track\(CONFIGURATOR_CLICK_EVENT, \{ configurator, from: clickFrom\(location\.pathname\), place: clickPlace\(a\) \}\)/);
    assert.match(tracker, /sendStat\(\{ t: "k", c: configurator \}\)/, "our own counter stays as it was");
  });
  test("Datenschutz §5 names the page it was clicked on (German text, shown on both languages)", () => {
    const ds = read("app", "[lang]", "datenschutz", "page.tsx").replace(/\s+/g, " ");
    assert.ok(ds.includes("das nur den Namen des Konfigurators und die Seite enthält, auf der geklickt wurde (samt der Stelle auf der Seite, z. B. Fußzeile), zusammen mit denselben Angaben wie bei einem Seitenaufruf."));
    assert.ok(!ds.includes("das nur den Namen des Konfigurators enthält"));
  });
});
