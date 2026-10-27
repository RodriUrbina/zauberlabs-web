import { test, describe } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error plain .mjs helper without type declarations
import { cookiesFor, hasMarker, isCountingRequest, isHeadlessUa, parseArgs, shotName } from "../scripts/prod-check-lib.mjs";

describe("prod-check (BL-058)", () => {
  test("parses URLs, viewports, output folder; defaults to desktop + phone", () => {
    const o = parseArgs(["-v", "1488x792", "--out", "shots", "https://www.zauberlabs.de/en"]);
    assert.deepEqual(o.viewports, [{ width: 1488, height: 792 }]);
    assert.equal(o.out, "shots");
    assert.deepEqual(parseArgs(["https://www.zauberlabs.de/de"]).viewports, [{ width: 1440, height: 900 }, { width: 390, height: 844 }]);
  });
  test("rejects bad input instead of guessing", () => {
    assert.throws(() => parseArgs([]), /Usage/);
    assert.throws(() => parseArgs(["-v", "big", "https://www.zauberlabs.de"]), /Viewport/);
    assert.throws(() => parseArgs(["ftp://x"]), /http/);
    assert.throws(() => parseArgs(["--bogus", "https://www.zauberlabs.de"]), /Unknown option/);
  });
  test("sets the internal marker for every host in the list", () => {
    const c = cookiesFor(["https://www.zauberlabs.de/en", "https://www.zauberlabs.de/de", "https://x-preview.vercel.app/en"]);
    assert.deepEqual(c, [
      { name: "zl_internal", value: "1", domain: "www.zauberlabs.de", path: "/" },
      { name: "zl_internal", value: "1", domain: "x-preview.vercel.app", path: "/" },
    ]);
  });
  test("checks: the page sees the marker; the UA is the HeadlessChrome default", () => {
    assert.equal(hasMarker("a=1; zl_internal=1"), true);
    assert.equal(hasMarker("zl_internal=0"), false);
    assert.equal(isHeadlessUa("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36"), true);
    assert.equal(isHeadlessUa("Mozilla/5.0 (X11; Linux x86_64) Chrome/153.0.0.0 Safari/537.36"), false);
  });
  test("file names say host, path and viewport", () => {
    assert.equal(shotName("https://www.zauberlabs.de/de/blog", { width: 390, height: 844 }), "www.zauberlabs.de_de-blog_390x844.png");
    assert.equal(shotName("https://www.zauberlabs.de/", { width: 1440, height: 900 }), "www.zauberlabs.de_home_1440x900.png");
  });
  test("stops on every counting request, including Vercel's random prefix and Speed Insights (BL-082)", () => {
    for (const u of [
      "https://www.zauberlabs.de/4af0a58b770e44fd/view",
      "https://www.zauberlabs.de/4af0a58b770e44fd/event",
      "https://www.zauberlabs.de/4af0a58b770e44fd/session",
      "https://www.zauberlabs.de/_vercel/insights/view",
      "https://www.zauberlabs.de/4af0a58b770e44fd/speed-insights/vitals",
      "https://www.zauberlabs.de/_vercel/speed-insights/vitals",
      "https://vitals.vercel-insights.com/v2/vitals?dsn=x&ve=production",
      "https://www.zauberlabs.de/api/m",
      "https://www.zauberlabs.de/api/m?x=1",
    ]) assert.equal(isCountingRequest(u), true, u);
    for (const u of [
      "https://www.zauberlabs.de/4af0a58b770e44fd/script.js",
      "https://www.zauberlabs.de/_vercel/speed-insights/script.js",
      "https://va.vercel-scripts.com/v1/speed-insights/script.js",
      "https://www.zauberlabs.de/api/vote",
      "https://www.zauberlabs.de/en/blog/view",
      "https://www.zauberlabs.de/api/metrics",
      "not a url",
    ]) assert.equal(isCountingRequest(u), false, u);
  });
});
