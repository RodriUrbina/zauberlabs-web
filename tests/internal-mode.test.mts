import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hasInternalMarker, isValidInternalKey, MIN_SECRET_LENGTH } from "../lib/internal-mode";

const SECRET = "x".repeat(MIN_SECRET_LENGTH) + "abc";

describe("internal mode (BL-039)", () => {
  test("accepts only the exact configured secret", () => {
    assert.equal(isValidInternalKey(SECRET, SECRET), true);
    assert.equal(isValidInternalKey(SECRET + "d", SECRET), false);
    assert.equal(isValidInternalKey(SECRET.slice(0, -1), SECRET), false);
    assert.equal(isValidInternalKey("", SECRET), false);
    assert.equal(isValidInternalKey(null, SECRET), false);
  });
  test("is off when no secret, or a too-short secret, is configured", () => {
    assert.equal(isValidInternalKey("anything", undefined), false);
    assert.equal(isValidInternalKey("", ""), false);
    assert.equal(isValidInternalKey("short", "short"), false);
  });
  test("detects the marker in a cookie string, and nothing else", () => {
    assert.equal(hasInternalMarker("zl_internal=1"), true);
    assert.equal(hasInternalMarker("zl_vid=abc; zl_internal=1; x=y"), true);
    assert.equal(hasInternalMarker("zl_internal=0"), false);
    assert.equal(hasInternalMarker("zl_internal="), false);
    assert.equal(hasInternalMarker("xzl_internal=1"), false);
    assert.equal(hasInternalMarker(""), false);
  });
});
