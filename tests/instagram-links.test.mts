import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { e46Href, headlineOf, linkHref, linkTiles, LINKS_MAX } from "../lib/instagram/links";
import { readQueue, type Post } from "../lib/instagram/queue";
import { clickFrom, CLICK_PLACES } from "../lib/configurator-click";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
const post = (id: string, at: string, over: Partial<Post> = {}): Post => ({
  id,
  publishAt: at,
  publishAtMs: Date.parse(at),
  status: "approved",
  caption: "a\n—\nb",
  slides: [{ file: "1.jpg", alt: `alt ${id}` }],
  ...over,
});

describe("Instagram link page /links (BL-118)", () => {
  test("tiles lead to E46BUILD, the vote or an article, in the page's language, always with from=instagram", () => {
    assert.deepEqual(linkHref("e46build", "en"), { href: "https://e46.zauberlabs.de/?from=instagram", external: true });
    assert.deepEqual(linkHref("e46build", "de"), { href: "https://e46.zauberlabs.de/de?from=instagram", external: true });
    assert.deepEqual(linkHref(undefined, "de"), { href: "https://e46.zauberlabs.de/de?from=instagram", external: true }, "no link = E46BUILD");
    assert.deepEqual(linkHref("blog/telling-e46-wheels-apart", "en"), { href: "/en/blog/telling-e46-wheels-apart?from=instagram", external: false });
    assert.deepEqual(linkHref("blog/telling-e46-wheels-apart", "de"), { href: "/de/blog/telling-e46-wheels-apart?from=instagram", external: false });
    assert.deepEqual(linkHref("vote", "de"), { href: "/de?from=instagram#next", external: false });
    assert.equal(e46Href("en"), "https://e46.zauberlabs.de/?from=instagram");
  });
  test("posts that are out, newest first; drafts never; before the first post is out, the scheduled ones, soonest first", () => {
    const posts = [
      post("2026-11-06-a", "2026-11-06T18:00:00+01:00"),
      post("2026-11-07-b", "2026-11-07T18:00:00+01:00"),
      post("2026-11-08-draft", "2026-11-08T18:00:00+01:00", { status: "draft" }),
      post("2026-11-09-c", "2026-11-09T18:00:00+01:00"),
    ];
    const before = linkTiles(posts, "en", Date.parse("2026-11-06T12:00:00Z"));
    assert.deepEqual(before.map((t) => [t.id, t.scheduled]), [["2026-11-06-a", true], ["2026-11-07-b", true], ["2026-11-09-c", true]]);
    const later = linkTiles(posts, "en", Date.parse("2026-11-08T20:00:00Z"));
    assert.deepEqual(later.map((t) => [t.id, t.scheduled]), [["2026-11-07-b", false], ["2026-11-06-a", false]], "only what is out once something is");
    assert.ok(!linkTiles(posts, "de", Date.parse("2026-12-01T00:00:00Z")).some((t) => t.id.includes("draft")));
    const many = Array.from({ length: 15 }, (_, i) => post(`2026-10-${String(i + 1).padStart(2, "0")}-x`, `2026-10-${String(i + 1).padStart(2, "0")}T18:00:00+02:00`));
    assert.equal(linkTiles(many, "en", Date.parse("2026-11-01T00:00:00Z")).length, LINKS_MAX);
  });
  test("a tile shows the first slide with its alt text and the headline", () => {
    const [t] = linkTiles([post("2026-11-06-a", "2026-11-06T18:00:00+01:00", { headline: "The one BMW never sold." })], "en", 0);
    assert.equal(t.img, "/social/instagram/2026-11-06-a/1.jpg");
    assert.equal(t.alt, "alt 2026-11-06-a");
    assert.equal(t.headline, "The one BMW never sold.");
    assert.equal(headlineOf(post("x", "2026-11-06T18:00:00+01:00", { title: 'Week 1 · "Tick box 338."' })), "Tick box 338.");
  });
  test("the queue's links are valid: every blog/<slug> is an article that is public before its post goes out", () => {
    const { posts, broken } = readQueue();
    assert.deepEqual(broken, []);
    for (const p of posts) {
      assert.ok(p.headline, `${p.id} has a headline`);
      if (p.link?.startsWith("blog/")) {
        const slug = p.link.slice(5);
        // English always; a German page without its own text shows the English article (lib/blog.ts fallback), so /de/blog/<slug> works too.
        const en = path.join(process.cwd(), "content", "blog", slug, "en.mdx");
        assert.ok(fs.existsSync(en), `${p.id}: ${slug}/en.mdx`);
        const at = /^publishAt: "?(\d{4}-\d{2}-\d{2})/m.exec(fs.readFileSync(en, "utf8"))?.[1];
        if (at) assert.ok(Date.parse(`${at}T07:00:00+01:00`) <= p.publishAtMs, `${p.id}: ${slug} is public from ${at}`);
      }
    }
    assert.equal(posts.find((p) => p.id.endsWith("which-car-is-next"))?.link, "vote");
  });
  test("the page: title code h1, fixed row E46BUILD / blog / shop, every link with from=instagram, counted as place 'links', nothing new tracked", () => {
    const page = read("app", "[lang]", "links", "page.tsx");
    assert.match(page, /<Title as="h1" lead=\{c\.headline\[0\]\} accent=\{c\.headline\[1\]\}/);
    assert.match(page, /<main data-click-place="links"/);
    assert.ok((CLICK_PLACES as readonly string[]).includes("links"));
    assert.equal(clickFrom("/de/links"), "links");
    assert.match(page, /href=\{e46Href\(lang\)\}/);
    assert.match(page, /href=\{`\/\$\{lang\}\/blog\?\$\{FROM\}`\}/);
    assert.match(page, /href=\{`\/\$\{lang\}\/shop\?\$\{FROM\}`\}/);
    assert.match(page, /href=\{tile\.href\}/);
    const lines = page.split("\n").filter((l) => /<(a|Link) [^>]*href=/.test(l));
    assert.equal(lines.length, 5, "E46BUILD, blog, shop, home (shop not launched), tiles");
    for (const l of lines) assert.ok(/\$\{FROM\}|e46Href\(lang\)|tile\.href/.test(l), `link without from=instagram: ${l.trim()}`);
    assert.ok(!/track\(|sendStat|<script|useEffect/.test(page), "no tracking of its own");
    assert.match(page, /export const revalidate = 300/);
    assert.match(read("next.config.ts"), /"\/\[lang\]\/links": \["\.\/content\/social\/instagram\/\*\*\/\*"\]/);
  });
});
