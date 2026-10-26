import { test, describe } from "node:test";
import assert from "node:assert/strict";

// BL-078: the in-memory store (no Redis credentials in tests) follows the same rules as Redis.
delete process.env.KV_REST_API_URL;
delete process.env.UPSTASH_REDIS_REST_URL;
const { getCounts, getVotedBy, setVote } = await import("../lib/store");

const count = async (car: string) => (await getCounts([{ id: car, name: car }]))[car];
const voted = (voter: string, car: string) => getVotedBy(voter, [{ id: car, name: car }]);

describe("votes from the internal marker (BL-078)", () => {
  test("an internal vote shows as voted but never changes the count", async () => {
    const r = await setVote("t-golf", "pc-1", true, true);
    assert.deepEqual(r, { count: 0, changed: true, counted: false });
    assert.equal(await count("t-golf"), 0);
    assert.deepEqual(await voted("pc-1", "t-golf"), ["t-golf"]);
  });

  test("taking an internal vote back doesn't lower the count, even without the marker", async () => {
    await setVote("t-a4", "real-1", true);
    await setVote("t-a4", "pc-2", true, true);
    assert.equal(await count("t-a4"), 1);
    const r = await setVote("t-a4", "pc-2", false, false);
    assert.deepEqual(r, { count: 1, changed: true, counted: false });
    assert.deepEqual(await voted("pc-2", "t-a4"), []);
  });

  test("an internal vote never sits next to a counted one: voting again without the marker changes nothing", async () => {
    await setVote("t-w203", "pc-3", true, true);
    const r = await setVote("t-w203", "pc-3", true, false);
    assert.deepEqual(r, { count: 0, changed: false, counted: false });
  });

  test("a counted vote taken back from an internal browser lowers the count (the count is always the counted voters)", async () => {
    await setVote("t-e30", "old-1", true);
    assert.equal(await count("t-e30"), 1);
    const r = await setVote("t-e30", "old-1", false, true);
    assert.deepEqual(r, { count: 0, changed: true, counted: true });
  });
});

describe("normal votes (unchanged)", () => {
  test("vote, vote again, take back, take back again", async () => {
    assert.deepEqual(await setVote("t-e36", "v-1", true), { count: 1, changed: true, counted: true });
    assert.deepEqual(await setVote("t-e36", "v-1", true), { count: 1, changed: false, counted: false });
    assert.deepEqual(await setVote("t-e36", "v-1", false), { count: 0, changed: true, counted: true });
    assert.deepEqual(await setVote("t-e36", "v-1", false), { count: 0, changed: false, counted: false });
  });
});
