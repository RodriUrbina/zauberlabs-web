import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { berlinDay, countryCode, isBot, lastDays, medianBucket, parseBeacon, previousDay, referrerDomain, timeBucket } from "../lib/metrics";

describe("own statistics (BL-051)", () => {
  test("referrer is reduced to the domain; own sites and junk count as direct", () => {
    assert.equal(referrerDomain("https://www.google.com/search?q=e46+seats"), "google.com");
    assert.equal(referrerDomain("https://chatgpt.com/c/abc"), "chatgpt.com");
    assert.equal(referrerDomain("old.reddit.com"), "old.reddit.com");
    assert.equal(referrerDomain("android-app://com.google.android.gm/"), "app");
    assert.equal(referrerDomain("https://www.zauberlabs.de/de/blog"), "direct");
    assert.equal(referrerDomain("https://e46.zauberlabs.de/"), "direct");
    assert.equal(referrerDomain(""), "direct");
    assert.equal(referrerDomain(null), "direct");
    assert.equal(referrerDomain("javascript:alert(1)"), "direct");
    assert.equal(referrerDomain("not a domain"), "direct");
    assert.equal(referrerDomain("http://192.168.0.1/"), "192.168.0.1"); // a dotted host is still only a host
  });
  test("country code is two letters or XX", () => {
    assert.equal(countryCode("de"), "DE");
    assert.equal(countryCode(null), "XX");
    assert.equal(countryCode("Germany"), "XX");
  });
  test("bots and empty user agents are not counted", () => {
    assert.equal(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
    assert.equal(isBot("curl/8.0"), true);
    assert.equal(isBot(""), true);
    assert.equal(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1"), false);
  });
  test("reading time buckets and the median bucket", () => {
    assert.equal(timeBucket(0), "0-10s");
    assert.equal(timeBucket(45), "30-60s");
    assert.equal(timeBucket(119), "1-2m");
    assert.equal(timeBucket(3600), "5m+");
    assert.equal(medianBucket({}), null);
    assert.equal(medianBucket({ "0-10s": 1, "1-2m": 3, "5m+": 1 }), "1-2m");
  });
  test("beacons: only the expected shapes pass", () => {
    assert.deepEqual(parseBeacon('{"t":"v","l":"de","s":"e46-seat-swap-airbags","r":"www.google.com"}'), { t: "v", lang: "de", slug: "e46-seat-swap-airbags", ref: "www.google.com" });
    assert.deepEqual(parseBeacon('{"t":"e","l":"en","s":"a-b","n":95.4,"x":true}'), { t: "e", lang: "en", slug: "a-b", seconds: 95, end: true });
    assert.deepEqual(parseBeacon('{"t":"k","c":"e46"}'), { t: "k", configurator: "e46" });
    assert.equal(parseBeacon('{"t":"k","c":"porsche"}'), null);
    assert.equal(parseBeacon('{"t":"v","l":"de","s":"../etc"}'), null);
    assert.equal(parseBeacon('{"t":"e","l":"de","s":"a","n":-1}'), null);
    assert.equal(parseBeacon("not json"), null);
    assert.equal(parseBeacon("x".repeat(600)), null);
    assert.equal(parseBeacon('{"t":"e","l":"de","s":"a","n":99999999}')?.t, "e");
  });
  test("days roll over at midnight in Berlin", () => {
    assert.equal(berlinDay(new Date("2026-10-19T21:59:00Z")), "2026-10-19");
    assert.equal(berlinDay(new Date("2026-10-19T22:01:00Z")), "2026-10-20"); // 00:01 CEST
    assert.equal(previousDay("2026-03-01"), "2026-02-28");
    assert.deepEqual(lastDays(3, new Date("2026-10-25T10:00:00Z")), ["2026-10-23", "2026-10-24", "2026-10-25"]);
  });
});
