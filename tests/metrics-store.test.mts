import { test, describe } from "node:test";
import assert from "node:assert/strict";

// BL-060.1: an empty day list (every period before STATS_START_DAY) must not reach Redis. The Redis URL below is
// unreachable on purpose: any request would fail the test instead of quietly returning numbers.
process.env.KV_REST_API_URL = "http://127.0.0.1:9/";
process.env.KV_REST_API_TOKEN = "test-only";
const { getStats } = await import("../lib/metrics-store");

describe("getStats with no days (BL-060.1)", () => {
  test("returns empty statistics without any Redis call", async () => {
    const s = await getStats([]);
    assert.deepEqual(s.days, []);
    assert.deepEqual(s.totals, { views: 0, uniques: 0, clicks: 0 });
    assert.deepEqual(s.daily, []);
    assert.equal(s.votes.total, 0);
  });
});
