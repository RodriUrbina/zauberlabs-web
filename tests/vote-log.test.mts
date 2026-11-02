import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// The Redis URL is unreachable on purpose: these tests never talk to a real database (BL-104).
process.env.KV_REST_API_URL = "http://127.0.0.1:9/";
process.env.KV_REST_API_TOKEN = "test-only";
const { hourOf, voteLogEntry, pushVoteLog, mergeVoteLogs } = await import("../lib/metrics-store");
const { berlinHourSlot, voteLang, RETENTION_DAYS } = await import("../lib/metrics");

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
const input = { car: "e30", ref: "google.com", country: "DE", lang: "de" as const };

describe("vote log (BL-104)", () => {
  test("an entry has exactly the six fields, the hour rounded down (UTC)", () => {
    const e = voteLogEntry("vote", input, new Date("2026-11-02T14:37:52.123Z"));
    assert.deepEqual(Object.keys(e).sort(), ["car", "country", "hour", "lang", "source", "type"]);
    assert.deepEqual(e, { hour: "2026-11-02T14:00Z", type: "vote", car: "e30", country: "DE", source: "google.com", lang: "de" });
    assert.equal(hourOf(new Date("2026-11-02T14:59:59.999Z")), "2026-11-02T14:00Z");
    assert.equal(hourOf(new Date("2026-12-31T23:00:00Z")), "2026-12-31T23:00Z");
    assert.equal(voteLogEntry("unvote", input).type, "unvote");
  });

  test("pushed to its month's list (test prefix off production), kept without expiry (BL-104.1: PERSIST)", () => {
    const calls: [string, string, unknown?][] = [];
    const tx = { lpush: (k: string, v: string) => calls.push(["lpush", k, v]), persist: (k: string) => calls.push(["persist", k]) };
    const e = voteLogEntry("unvote", input, new Date("2026-11-30T23:10:00Z"));
    assert.equal(pushVoteLog(tx, e), 3, "three commands, counted in the stats budget");
    assert.deepEqual(calls[0], ["lpush", "m:test:vl:2026-11", JSON.stringify(e)]);
    assert.deepEqual(calls[1], ["persist", "m:test:vl:2026-11"]);
    assert.deepEqual(calls[2], ["persist", "m:test:vl:2026-11"], "the legacy 2026-11 list (BL-104 gave it an expiry)");
    assert.equal(calls.length, 3);
    calls.length = 0;
    const dec = voteLogEntry("vote", input, new Date("2026-12-01T08:00:00Z"));
    pushVoteLog(tx, dec);
    assert.deepEqual(calls, [["lpush", "m:test:vl:2026-12", JSON.stringify(dec)], ["persist", "m:test:vl:2026-12"], ["persist", "m:test:vl:2026-11"]]);
    assert.equal(RETENTION_DAYS, 400, "daily keys keep their expiry");
    assert.doesNotMatch(read("lib", "metrics-store.ts"), /expireat\(key\.voteLog/);
  });

  // Runs only against a local Redis behind SRH (BL104_LOCAL_REDIS=http://127.0.0.1:8079, token in BL104_LOCAL_TOKEN), never Upstash.
  test("a month list that already has an expiry loses it with the next push (local Redis)", { skip: !process.env.BL104_LOCAL_REDIS }, async () => {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url: process.env.BL104_LOCAL_REDIS!, token: process.env.BL104_LOCAL_TOKEN ?? "" });
    const k = "m:test:vl:2026-11";
    await redis.del(k);
    await redis.lpush(k, "old");
    await redis.expire(k, 3600);
    assert.ok((await redis.ttl(k)) > 0);
    const tx = redis.pipeline();
    pushVoteLog(tx, voteLogEntry("vote", input, new Date("2026-11-02T10:05:00Z")));
    await tx.exec();
    assert.equal(await redis.ttl(k), -1, "no expiry");
    assert.equal(await redis.llen(k), 2);
    // a push in another month also clears the expiry of the legacy 2026-11 list
    await redis.expire(k, 3600);
    const dec = redis.pipeline();
    pushVoteLog(dec, voteLogEntry("vote", input, new Date("2026-12-03T10:05:00Z")));
    await dec.exec();
    assert.equal(await redis.ttl(k), -1, "2026-11 has no expiry after a December push");
    assert.equal(await redis.ttl("m:test:vl:2026-12"), -1);
    await redis.del(k, "m:test:vl:2026-12");
  });

  test("written for counted votes and take-backs only, never for internal, bot or uncounted votes", () => {
    const route = read("app", "api", "vote", "route.ts");
    const guarded = route.slice(route.indexOf("if (counted && !isBot("));
    assert.match(guarded, /^if \(counted && !isBot\(req\.headers\.get\("user-agent"\)\)\) \{[\s\S]*?if \(body\.on\) await recordVote\(input\);\s*else await recordWithdrawal\(input\);/);
    assert.equal(route.match(/recordVote\(|recordWithdrawal\(/g)?.length, 2, "no other call");
    const store = read("lib", "metrics-store.ts");
    assert.match(store, /return 6 \+ pushVoteLog\(tx, voteLogEntry\("vote", input\)\);/);
    assert.match(store, /return 2 \+ pushVoteLog\(tx, voteLogEntry\("unvote", input\)\);/);
    // internal votes come back from setVote with counted: false (BL-078), so they never reach this block
    assert.match(route, /const \{ counted \} = await setVote\(body\.car, id, body\.on, internal\);/);
  });

  test("nothing about the voter: no cookie id, IP, hash, User-Agent or exact time in the entry", () => {
    const store = read("lib", "metrics-store.ts");
    const fn = store.slice(store.indexOf("export function voteLogEntry"), store.indexOf("export function pushVoteLog"));
    assert.ok(!/zl_vid|\bid\b|ip|hash|userAgent|toISOString\(\)[^.]/i.test(fn.replace(/hourOf\(at\)/, "")), fn);
  });

  test("the page language: sent by the card, else from the page URL", () => {
    assert.equal(voteLang("en", null), "en");
    assert.equal(voteLang("xx", "https://www.zauberlabs.de/en#next"), "en");
    assert.equal(voteLang(undefined, "https://www.zauberlabs.de/de"), "de");
    assert.equal(voteLang(undefined, null), "de");
    assert.match(read("components", "VoteCard.tsx"), /JSON\.stringify\(\{ car, on, r: referrerHost\(document\.referrer\), l: lang \}\)/);
  });

  test("admin: newest first, current month before the previous, at most 100; Berlin hour slots", () => {
    const e = (hour: string) => ({ ...voteLogEntry("vote", input), hour });
    const cur = [e("2026-11-02T14:00Z"), JSON.stringify(e("2026-11-01T09:00Z"))];
    const prev = Array.from({ length: 120 }, () => e("2026-10-30T10:00Z"));
    const merged = mergeVoteLogs(cur, prev);
    assert.equal(merged.length, 100);
    assert.deepEqual(merged.slice(0, 3).map((x) => x.hour), ["2026-11-02T14:00Z", "2026-11-01T09:00Z", "2026-10-30T10:00Z"]);
    assert.equal(berlinHourSlot("2026-11-02T14:00Z"), "02.11. 15–16 h");
    assert.equal(berlinHourSlot("2026-07-01T22:00Z"), "02.07. 0–1 h", "summer time");
    assert.equal(berlinHourSlot("2026-11-02T22:00Z"), "02.11. 23–0 h");
    const panel = read("components", "admin", "StatsPanel.tsx");
    assert.match(panel, /Latest votes[\s\S]*No entries yet\.[\s\S]*berlinHourSlot\(e\.hour\)[\s\S]*e\.type === "unvote" \? <span title="taken back">− /);
    assert.match(read("app", "api", "admin", "stats", "route.ts"), /getLatestVotes\(\)/);
  });

  test("Datenschutz § 7 names exactly what the log keeps and for how long", () => {
    const ds = read("app", "[lang]", "datenschutz", "page.tsx").replace(/\s+/g, " ");
    assert.ok(
      ds.includes(
        "Für unsere Statistik speichern wir zu jeder gezählten Stimme (und jeder zurückgenommenen) nur das Auto, die Stunde der Abstimmung, dein ungefähres Land (von unserem Hoster aus der IP-Adresse abgeleitet, die wir dafür nicht speichern), die Seite, über die du gekommen bist (nur die Domain, z. B. google.com, oder „direkt“), und die Sprache der Seite – ohne Cookie-Kennung, IP-Adresse oder andere Angaben zu deiner Person. Diese Einträge bewahren wir ohne zeitliche Begrenzung auf; sie enthalten keine Angaben, die sich deiner Person zuordnen lassen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, zu verstehen, welche Autos gewünscht werden und woher die Stimmen kommen).",
      ),
    );
    assert.ok(ds.indexOf("Für unsere Statistik speichern wir zu jeder gezählten Stimme") > ds.indexOf("zl_internal"), "after the zl_internal sentence");
    assert.match(ds, /Die Tageszähler löschen wir nach 13 Monaten\./, "§ 6 (daily counters) unchanged");
  });
});
