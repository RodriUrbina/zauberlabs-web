import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { graphClient, type Fetch } from "../lib/instagram/graph";
import { captionProblems, duePosts, jpegSize, readPost, readQueue, servableSlide, type Post } from "../lib/instagram/queue";
import { berlinDay, publishDue, publishedPosts, slideUrl } from "../lib/instagram/publisher";
import { memoryState } from "../lib/instagram/state";
import { collectNewComments, digestMail, draftReply } from "../lib/instagram/comments";
import { cronAuthorized } from "../lib/instagram/env";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");

/** A fake Graph API: answers the calls the publisher makes and records them (method, path, body). */
function fakeGraph(opts: { failOn?: string } = {}) {
  const calls: { method: string; path: string; params: Record<string, string>; auth: string | null }[] = [];
  let n = 0;
  const fetchImpl: Fetch = async (url, init) => {
    const u = new URL(url);
    const p = u.pathname.replace(/^\/v[\d.]+\//, "");
    const params = Object.fromEntries(init?.method === "POST" ? new URLSearchParams(String(init.body)) : u.searchParams);
    calls.push({ method: init?.method ?? "GET", path: p, params, auth: new Headers(init?.headers).get("authorization") });
    if (opts.failOn && p.endsWith(opts.failOn)) return new Response(JSON.stringify({ error: { message: "boom" } }), { status: 400 });
    if (p.endsWith("/media")) return Response.json({ id: `c${++n}` });
    if (p.endsWith("/media_publish")) return Response.json({ id: "m1" });
    if (p.endsWith("/comments")) return Response.json({ data: [{ id: "k1", text: "Passt das 135M an meinen Compact?", timestamp: "2026-11-10T08:00:00+0000" }, { id: "k2", text: "Love it 🔥" }] });
    if (params.fields === "status_code") return Response.json({ status_code: "FINISHED" });
    if (params.fields === "permalink") return Response.json({ permalink: "https://www.instagram.com/p/abc/" });
    return Response.json({});
  };
  return { calls, graph: graphClient("TOKEN-xyz", "17841", fetchImpl, async () => {}) };
}

const post = (over: Partial<Post> = {}): Post => ({
  id: "2026-11-09-hello",
  publishAt: "2026-11-09T18:00:00+01:00",
  publishAtMs: Date.parse("2026-11-09T18:00:00+01:00"),
  status: "approved",
  caption: "Hallo\n\n—\n\nHello\n\n#e46",
  slides: [{ file: "1.jpg", alt: "One" }, { file: "2.jpg", alt: "Two" }],
  ...over,
});
const AFTER = Date.parse("2026-11-09T17:00:30Z");
const BEFORE = Date.parse("2026-11-09T16:00:30Z");

describe("Instagram queue (BL-118)", () => {
  test("the imported week 1–2 posts are all valid, 1080 × 1350 JPEG, one alt text per slide, one a day at 18:00 Berlin from Fri 6 Nov", () => {
    const { posts, broken } = readQueue();
    assert.deepEqual(broken, []);
    assert.deepEqual(posts.map((p) => p.id), [
      "2026-11-06-hello-e46build",
      "2026-11-07-m-sport-package-ii",
      "2026-11-08-spot-the-wheel",
      "2026-11-09-cloth-leather-alcantara",
      "2026-11-10-standard-to-m-front",
      "2026-11-11-which-car-is-next",
    ]);
    for (const p of posts) {
      assert.ok(["draft", "approved"].includes(p.status), `${p.id}: the PO approves each post`);
      assert.match(p.publishAt, /T18:00:00\+01:00$/);
      assert.ok(p.caption.indexOf("\n—\n") > 0, "German first, then English");
    }
    assert.deepEqual(posts.map((p) => p.slides.length), [3, 3, 2, 3, 1, 1]);
    assert.deepEqual(posts.map((p) => p.publishAtMs - posts[0].publishAtMs), [0, 1, 2, 3, 4, 5].map((d) => d * 86_400_000), "one a day");
  });
  test("a broken post is reported, not published: wrong size, missing alt text, too many hashtags, unlisted slides", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ig-"));
    const d = path.join(dir, "2026-11-09-test");
    fs.mkdirSync(d);
    fs.copyFileSync(path.join(process.cwd(), "content/social/instagram/2026-11-10-standard-to-m-front/1.jpg"), path.join(d, "1.jpg"));
    fs.writeFileSync(path.join(d, "2.jpg"), "not a jpeg");
    fs.writeFileSync(path.join(d, "caption.txt"), `Hallo\n—\nHello ${Array.from({ length: 31 }, (_, i) => `#t${i}`).join(" ")}`);
    fs.writeFileSync(path.join(d, "meta.json"), JSON.stringify({ publishAt: "2026-11-10T18:00:00+01:00", status: "approved", slides: [{ file: "1.jpg", alt: "" }] }));
    const r = readPost(d);
    assert.ok("problems" in r);
    const text = r.problems.join(" | ");
    assert.match(text, /slides\.0\.alt/);
    fs.writeFileSync(path.join(d, "meta.json"), JSON.stringify({ publishAt: "2026-11-10T18:00:00+01:00", status: "approved", slides: [{ file: "1.jpg", alt: "x" }] }));
    const r2 = readPost(d);
    assert.ok("problems" in r2);
    assert.match(r2.problems.join(" | "), /31 hashtags/);
    assert.match(r2.problems.join(" | "), /not listed in meta\.json: 2\.jpg/);
    assert.match(r2.problems.join(" | "), /folder date 2026-11-09 differs/);
  });
  test("JPEG size is read from the file; captions over 2,200 characters or without the language split are refused", () => {
    assert.deepEqual(jpegSize(fs.readFileSync(path.join(process.cwd(), "content/social/instagram/2026-11-11-which-car-is-next/1.jpg"))), { width: 1080, height: 1350 });
    assert.equal(jpegSize(Buffer.from("PNG")), null);
    assert.deepEqual(captionProblems("Hallo\n—\nHello"), []);
    assert.match(captionProblems("x".repeat(2201) + "\n—\n")[0], /2204 characters/);
    assert.match(captionProblems("Only one language").join(), /German block/);
  });
  test("only approved posts whose time has passed are due, oldest first", () => {
    const posts = [post({ id: "b", publishAtMs: 2 }), post({ id: "a", publishAtMs: 1 }), post({ id: "d", status: "draft", publishAtMs: 0 }), post({ id: "p", status: "published", publishAtMs: 0 }), post({ id: "f", publishAtMs: 99 })];
    assert.deepEqual(duePosts(posts, 50).map((p) => p.id), ["a", "b"]);
  });
  test("the public slide route serves approved posts only; drafts and unknown files are 404", () => {
    const posts = [post(), post({ id: "2026-11-11-draft", status: "draft" })];
    assert.ok(servableSlide(posts, "2026-11-09-hello", "2.jpg"));
    assert.equal(servableSlide(posts, "2026-11-11-draft", "1.jpg"), null);
    assert.equal(servableSlide(posts, "2026-11-09-hello", "3.jpg"), null);
    assert.equal(servableSlide(posts, "2026-11-09-hello", "../meta.json"), null);
    assert.equal(slideUrl(post(), "1.jpg"), "https://www.zauberlabs.de/social/instagram/2026-11-09-hello/1.jpg");
    const route = read("app", "social", "instagram", "[post]", "[file]", "route.ts");
    assert.match(route, /servableSlide\(readQueue\(\)\.posts, id, file\)/);
    assert.match(route, /"X-Robots-Tag": "noindex"/);
  });
});

describe("Instagram publisher (BL-118)", () => {
  test("a carousel: one container per slide (with alt text), the carousel, then media_publish; the token only in the header", async () => {
    const { calls, graph } = fakeGraph();
    const state = memoryState();
    const r = await publishDue({ posts: [post()], now: AFTER, state, graph, enabled: true });
    assert.deepEqual(r.published, [{ id: "2026-11-09-hello", mediaId: "m1", permalink: "https://www.instagram.com/p/abc/" }]);
    const posts = calls.filter((c) => c.method === "POST");
    assert.deepEqual(posts.map((c) => c.path), ["17841/media", "17841/media", "17841/media", "17841/media_publish"]);
    assert.deepEqual(posts[0].params, { image_url: "https://www.zauberlabs.de/social/instagram/2026-11-09-hello/1.jpg", alt_text: "One", is_carousel_item: "true" });
    assert.deepEqual(posts[2].params, { media_type: "CAROUSEL", children: "c1,c2", caption: post().caption });
    assert.deepEqual(posts[3].params, { creation_id: "c3" });
    for (const c of calls) {
      assert.equal(c.auth, "Bearer TOKEN-xyz");
      assert.ok(!JSON.stringify(c.params).includes("TOKEN"), "never in the URL or body");
    }
    assert.deepEqual(state.records.get("2026-11-09-hello"), { state: "published", at: new Date(AFTER).toISOString(), mediaId: "m1", permalink: "https://www.instagram.com/p/abc/" });
  });
  test("a single image: one container with the caption, then media_publish", async () => {
    const { calls, graph } = fakeGraph();
    await publishDue({ posts: [post({ slides: [{ file: "1.jpg", alt: "One" }] })], now: AFTER, state: memoryState(), graph, enabled: true });
    const posts = calls.filter((c) => c.method === "POST");
    assert.deepEqual(posts.map((c) => c.path), ["17841/media", "17841/media_publish"]);
    assert.equal(posts[0].params.caption, post().caption);
    assert.equal(posts[0].params.is_carousel_item, undefined);
  });
  test("idempotent: a second run, or a run racing the first, never posts again", async () => {
    const { calls, graph } = fakeGraph();
    const state = memoryState();
    const [a, b] = await Promise.all([
      publishDue({ posts: [post()], now: AFTER, state, graph, enabled: true }),
      publishDue({ posts: [post()], now: AFTER, state, graph, enabled: true }),
    ]);
    const again = await publishDue({ posts: [post()], now: AFTER + 3600_000, state, graph, enabled: true });
    assert.equal(a.published.length + b.published.length, 1);
    assert.equal(again.published.length, 0);
    assert.equal(calls.filter((c) => c.path.endsWith("media_publish")).length, 1);
  });
  test("a failure is recorded and never retried by itself; the PO is told", async () => {
    const { calls, graph } = fakeGraph({ failOn: "media_publish" });
    const state = memoryState();
    const r = await publishDue({ posts: [post()], now: AFTER, state, graph, enabled: true });
    assert.equal(r.failed.length, 1);
    assert.match(r.failed[0].error, /media_publish: boom/);
    assert.equal(state.records.get("2026-11-09-hello")?.state, "failed");
    const again = await publishDue({ posts: [post()], now: AFTER + 86_400_000, state, graph, enabled: true });
    assert.deepEqual(again.skipped, [{ id: "2026-11-09-hello", reason: 'record "failed" in Redis' }], "the next day too");
    assert.equal(calls.filter((c) => c.path.endsWith("media_publish")).length, 1);
    assert.match(read("app", "api", "instagram", "publish", "route.ts"), /Fehlgeschlagen/);
  });
  test("switched off (the default), drafts, not yet due: nothing is sent to Instagram", async () => {
    const { calls, graph } = fakeGraph();
    const state = memoryState();
    const off = await publishDue({ posts: [post()], now: AFTER, state, graph, enabled: false });
    assert.deepEqual(off.wouldPublish, ["2026-11-09-hello"]);
    await publishDue({ posts: [post({ status: "draft" })], now: AFTER, state, graph, enabled: true });
    const early = await publishDue({ posts: [post()], now: BEFORE, state, graph, enabled: true });
    assert.deepEqual(early, { published: [], wouldPublish: [], failed: [], skipped: [] }, "the 16:00 UTC run in winter finds nothing");
    assert.equal(calls.length, 0);
    assert.equal(state.records.size, 0);
  });
  test("one post per run; the next due post waits for the next run", async () => {
    const { graph } = fakeGraph();
    const r = await publishDue({ posts: [post(), post({ id: "2026-11-09-second" })], now: AFTER, state: memoryState(), graph, enabled: true });
    assert.equal(r.published.length, 1);
    assert.deepEqual(r.skipped, [{ id: "2026-11-09-second", reason: "next run (one post per run)" }]);
  });
  test("one post per Berlin day: a missed day shifts the backlog instead of doubling up (PO 2026-11-06)", async () => {
    const { calls, graph } = fakeGraph();
    const state = memoryState();
    const p1 = post({ id: "2026-11-06-p1", publishAt: "2026-11-06T18:00:00+01:00", publishAtMs: Date.parse("2026-11-06T18:00:00+01:00") });
    const p2 = post({ id: "2026-11-07-p2", publishAt: "2026-11-07T18:00:00+01:00", publishAtMs: Date.parse("2026-11-07T18:00:00+01:00") });
    // P1's day was missed; on Sat at the 16:00 UTC run P1 goes out, the 17:00 UTC run must not post P2 the same day.
    const a = await publishDue({ posts: [p1, p2], now: Date.parse("2026-11-07T16:00:10Z"), state, graph, enabled: true });
    assert.deepEqual(a.published.map((p) => p.id), ["2026-11-06-p1"]);
    const b = await publishDue({ posts: [p1, p2], now: Date.parse("2026-11-07T17:00:10Z"), state, graph, enabled: true });
    assert.deepEqual(b, { published: [], wouldPublish: [], failed: [], skipped: [{ id: "2026-11-07-p2", reason: "tomorrow (one post per Berlin day)" }] });
    const c = await publishDue({ posts: [p1, p2], now: Date.parse("2026-11-08T16:00:10Z"), state, graph, enabled: true });
    assert.deepEqual(c.published.map((p) => p.id), ["2026-11-07-p2"]);
    assert.equal(calls.filter((x) => x.path.endsWith("media_publish")).length, 2);
    // The Berlin day, not the UTC day: 23:30 UTC on 7 Nov is already 8 Nov in Berlin.
    assert.equal(berlinDay(Date.parse("2026-11-07T23:30:00Z")), "2026-11-08");
    assert.equal(berlinDay(Date.parse("2026-07-07T22:30:00Z")), "2026-07-08", "summer time too");
  });
  test("a failed post today also blocks a second try the same day", async () => {
    const { graph } = fakeGraph();
    const state = memoryState();
    await state.set("2026-11-06-other", { state: "failed", at: "2026-11-06T17:00:05.000Z", error: "x" });
    const r = await publishDue({ posts: [post({ id: "2026-11-06-other", publishAtMs: Date.parse("2026-11-06T17:00:00Z") }), post({ id: "2026-11-06-next", publishAtMs: Date.parse("2026-11-06T17:00:00Z") })], now: Date.parse("2026-11-06T17:30:00Z"), state, graph, enabled: true });
    assert.deepEqual(r.published, []);
    assert.deepEqual(r.skipped, [{ id: "2026-11-06-next", reason: "tomorrow (one post per Berlin day)" }]);
  });
  test("real publishing needs IG_PUBLISH_ENABLED=1 on production; the cron routes need CRON_SECRET", () => {
    const env = read("lib", "instagram", "env.ts");
    assert.match(env, /process\.env\.IG_PUBLISH_ENABLED === "1" && process\.env\.VERCEL_ENV === "production"/);
    const saved = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "s3cret";
    assert.equal(cronAuthorized("Bearer s3cret"), true);
    assert.equal(cronAuthorized("Bearer wrong"), false);
    assert.equal(cronAuthorized(null), false);
    delete process.env.CRON_SECRET;
    assert.equal(cronAuthorized("Bearer "), false, "no secret set = closed");
    if (saved !== undefined) process.env.CRON_SECRET = saved;
    for (const r of ["publish", "comments"]) assert.match(read("app", "api", "instagram", r, "route.ts"), /if \(!cronAuthorized\(req\.headers\.get\("authorization"\)\)\) return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\)/);
  });
  test("vercel.json: daily at 16:00 and 17:00 UTC (18:00 Berlin in summer and winter), comments daily", () => {
    const crons = JSON.parse(read("vercel.json")).crons;
    assert.deepEqual(crons, [
      { path: "/api/instagram/publish", schedule: "0 16,17 * * *" },
      { path: "/api/instagram/comments", schedule: "0 7 * * *" },
    ]);
  });
  test("no outward actions: the client has no like, follow, reply or comment call", () => {
    const src = read("lib", "instagram", "graph.ts");
    assert.ok(!/\/(likes|replies|follows?)\b|"POST", `\$\{[^}]+\}\/comments/.test(src));
    const posts = [...src.matchAll(/call<[^>]*>\("POST", `([^`]+)`/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(posts)], ["${igUserId}/media", "${igUserId}/media_publish"]);
  });
});

describe("Instagram comment digest (BL-118)", () => {
  test("new comments on our published posts, each once, with a draft reply in its language; no names", async () => {
    const { calls, graph } = fakeGraph();
    const state = memoryState();
    await state.set("2026-11-09-hello", { state: "published", at: "x", mediaId: "m1", permalink: "https://www.instagram.com/p/abc/" });
    const published = await publishedPosts([post(), post({ id: "2026-11-11-other" })], state);
    assert.equal(published.length, 1);
    const items = await collectNewComments(published, graph, state);
    assert.equal(items[0].comments.length, 2);
    assert.equal(calls.find((c) => c.path === "m1/comments")?.params.fields, "id,text,timestamp", "the commenter's name is not asked for");
    assert.equal((await collectNewComments(published, graph, state)).length, 0, "already mailed comments are not mailed again");
    const mail = digestMail(items);
    assert.equal(mail.subject, "Instagram: 2 neue Kommentare");
    assert.match(mail.text, /„Passt das 135M an meinen Compact\?“ \(2026-11-10 08:00 UTC\)\n  Vorschlag: Danke für die Frage!/);
    assert.match(mail.text, /„Love it 🔥“\n  Vorschlag: Thank you!/);
    assert.match(mail.text, /https:\/\/www\.instagram\.com\/p\/abc\//);
    assert.match(mail.text, /nichts automatisch beantwortet/);
  });
  test("draft replies: questions get a placeholder for the answer, the rest a thank-you", () => {
    assert.match(draftReply("Which wheel is that?"), /^Thanks for asking! \[add the answer\]/);
    assert.match(draftReply("Wie heißt die Farbe?"), /^Danke für die Frage! \[Antwort ergänzen\]/);
    assert.equal(draftReply("Sehr schön!"), "Danke dir! Schön, dass es dir gefällt.");
    assert.equal(draftReply("Clean build"), "Thank you! Glad you like it.");
  });
});

describe("Instagram privacy and secrets (BL-118)", () => {
  test("Datenschutz names the Instagram profile and the daily comment read, German, before 'Deine Rechte'", () => {
    const ds = read("app", "[lang]", "datenschutz", "page.tsx").replace(/\s+/g, " ");
    const i = ds.indexOf(". Unser Instagram-Profil</h2>");
    assert.ok(i > 0 && i < ds.indexOf(". Deine Rechte</h2>"));
    assert.ok(ds.includes("rufen wir einmal am Tag über die Schnittstelle von Instagram den Text und den Zeitpunkt neuer Kommentare zu unseren eigenen Beiträgen ab – nicht deinen Namen"));
    assert.ok(ds.includes("Wir antworten selbst, nie automatisch."));
    assert.match(ds, /<h2>\{SHOP_LAUNCHED \? 17 : 16\}\. Deine Rechte<\/h2>/);
    assert.match(ds, /<h2>\{SHOP_LAUNCHED \? 18 : 17\}\. Aktualität<\/h2>/);
  });
  test("no token in the repo; the scripts print only whether a token is set", () => {
    const files = ["lib/instagram/graph.ts", "lib/instagram/env.ts", "scripts/instagram-dry-run.mts", "scripts/instagram-page-token.mts", "scripts/instagram-env.mts", "vercel.json"];
    for (const f of files) assert.ok(!/EAA[A-Za-z0-9]{20,}|IGQ[A-Za-z0-9]{20,}/.test(read(f)), f);
    const dry = read("scripts", "instagram-dry-run.mts");
    assert.ok(!/console\.log\([^)]*(env\.IG_PAGE_TOKEN|env\.IG_ACCESS_TOKEN|token)\)/.test(dry));
    assert.match(read("scripts", "instagram-env.mts"), /describeToken = \(t: string \| undefined\) => \(t \? `set \(\$\{t\.length\} characters\)` : "missing"\)/);
    assert.match(read("scripts", "instagram-page-token.mts"), /mode: 0o600/);
    assert.ok(!fs.readdirSync(path.join(process.cwd(), "content/social/instagram")).some((f) => f.endsWith(".env")));
  });
});
