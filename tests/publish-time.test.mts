import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { dayInZone, formatPublishMoment, parsePublishAt, tzOffsetMinutes, zonedToUtcMs } from "../lib/publish-time";

const iso = (ms: number) => new Date(ms).toISOString();

describe("publish-time: 07:00 Europe/Berlin → UTC", () => {
  test("winter: 07:00 CET = 06:00Z", () => {
    assert.equal(iso(parsePublishAt("2026-01-15")), "2026-01-15T06:00:00.000Z");
  });
  test("summer: 07:00 CEST = 05:00Z", () => {
    assert.equal(iso(parsePublishAt("2026-07-15")), "2026-07-15T05:00:00.000Z");
  });

  // EU DST 2026: starts Sunday 29 March 01:00Z (02:00 → 03:00 local), ends Sunday 25 October 01:00Z (03:00 → 02:00 local).
  test("DST start boundary: the day before is CET, the day itself is CEST", () => {
    assert.equal(iso(parsePublishAt("2026-03-28")), "2026-03-28T06:00:00.000Z");
    assert.equal(iso(parsePublishAt("2026-03-29")), "2026-03-29T05:00:00.000Z");
  });
  test("DST end boundary: the day before is CEST, the day itself is CET", () => {
    assert.equal(iso(parsePublishAt("2026-10-24")), "2026-10-24T05:00:00.000Z");
    assert.equal(iso(parsePublishAt("2026-10-25")), "2026-10-25T06:00:00.000Z");
  });
  test("offsets around the transitions are derived, not assumed", () => {
    assert.equal(tzOffsetMinutes(Date.UTC(2026, 2, 29, 0, 59)), 60);
    assert.equal(tzOffsetMinutes(Date.UTC(2026, 2, 29, 1, 0)), 120);
    assert.equal(tzOffsetMinutes(Date.UTC(2026, 9, 25, 0, 59)), 120);
    assert.equal(tzOffsetMinutes(Date.UTC(2026, 9, 25, 1, 0)), 60);
  });
  test("a wall time that falls inside the spring-forward gap resolves to a real instant", () => {
    // 02:30 local on 29 March 2026 does not exist; must not throw and must land near the gap.
    const ms = zonedToUtcMs(2026, 3, 29, 2, 30);
    assert.ok(Number.isFinite(ms));
    assert.ok(Math.abs(ms - Date.UTC(2026, 2, 29, 1, 0)) <= 3_600_000);
  });
});

describe("publish-time: accepted forms", () => {
  test("Berlin wall time without offset", () => {
    assert.equal(iso(parsePublishAt("2026-07-15T12:30")), "2026-07-15T10:30:00.000Z");
    assert.equal(iso(parsePublishAt("2026-01-15 12:30")), "2026-01-15T11:30:00.000Z");
  });
  test("ISO moment with offset or Z is taken literally", () => {
    assert.equal(iso(parsePublishAt("2026-10-05T07:00:00+02:00")), "2026-10-05T05:00:00.000Z");
    assert.equal(iso(parsePublishAt("2026-10-05T05:00:00Z")), "2026-10-05T05:00:00.000Z");
  });
  for (const bad of ["tomorrow", "2026-13-01", "05.10.2026", "", "2026-10-05T25:00"]) {
    test(`rejects ${JSON.stringify(bad)}`, () => {
      assert.throws(() => parsePublishAt(bad));
    });
  }
  test("dayInZone gives the Berlin calendar day", () => {
    assert.equal(dayInZone(Date.UTC(2026, 6, 14, 22, 30)), "2026-07-15"); // 00:30 CEST next day
    assert.equal(dayInZone(Date.UTC(2026, 0, 14, 23, 30)), "2026-01-15"); // 00:30 CET next day
  });
  test("formatPublishMoment", () => {
    assert.equal(formatPublishMoment(parsePublishAt("2026-10-05"), "en"), "5 October 2026, 07:00 (Berlin)");
    assert.equal(formatPublishMoment(parsePublishAt("2026-10-05"), "de"), "5. Oktober 2026, 07:00 (Berlin)");
  });
});
