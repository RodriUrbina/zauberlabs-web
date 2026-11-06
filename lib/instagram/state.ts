import { getRedis } from "@/lib/store";

/**
 * BL-118 — what the publisher remembers, in Redis (the same Upstash database as the votes): per post one key
 * "ig:post:<post id>" with { state: "publishing" | "published" | "failed", … }, and the set "ig:comments:seen" with the ids of
 * comments already sent to the PO. Simpler and safer than a commit from the cron: the claim is one atomic SET NX, so two runs
 * at the same moment can never both publish a post, and a post that has any record is never tried again by itself.
 * A "publishing" or "failed" record stays until someone removes it on purpose (see README "Instagram"), because a failure
 * during the last API call cannot tell whether Instagram already posted it. BL-118.4: a retryable failure (auth error, or an
 * error before any media container existed) leaves no record, only a note in "ig:retry:<id>", so the next run tries again.
 */
export type PostRecord =
  | { state: "publishing"; at: string }
  | { state: "published"; at: string; mediaId: string; permalink?: string }
  | { state: "failed"; at: string; error: string };

export type State = {
  get(id: string): Promise<PostRecord | null>;
  /** True only for the one run that may publish this post. */
  claim(id: string, at: string): Promise<boolean>;
  set(id: string, record: PostRecord): Promise<void>;
  /** True when this comment id was not seen before (and marks it seen). */
  firstSeen(commentId: string): Promise<boolean>;
  /** BL-118.4: a retryable failure: the post's claim is removed (so it is not a record of the day) and the failure is noted in "ig:retry:<id>". */
  release(id: string, note: { at: string; error: string }): Promise<void>;
};

const key = (id: string) => `ig:post:${id}`;

export function redisState(): State {
  const redis = getRedis();
  if (!redis) return memoryState();
  return {
    get: async (id) => (await redis.get<PostRecord>(key(id))) ?? null,
    claim: async (id, at) => (await redis.set(key(id), { state: "publishing", at }, { nx: true })) === "OK",
    set: async (id, record) => {
      await redis.set(key(id), record);
    },
    firstSeen: async (commentId) => (await redis.sadd("ig:comments:seen", commentId)) === 1,
    release: async (id, note) => {
      await redis.del(key(id));
      await redis.set(`ig:retry:${id}`, note);
    },
  };
}

/** For tests and local runs without Redis. */
export function memoryState(): State & { records: Map<string, PostRecord>; seen: Set<string>; retries: Map<string, { at: string; error: string }> } {
  const records = new Map<string, PostRecord>();
  const seen = new Set<string>();
  const retries = new Map<string, { at: string; error: string }>();
  return {
    records,
    seen,
    retries,
    release: async (id, note) => {
      records.delete(id);
      retries.set(id, note);
    },
    get: async (id) => records.get(id) ?? null,
    claim: async (id, at) => {
      if (records.has(id)) return false;
      records.set(id, { state: "publishing", at });
      return true;
    },
    set: async (id, record) => {
      records.set(id, record);
    },
    firstSeen: async (commentId) => {
      if (seen.has(commentId)) return false;
      seen.add(commentId);
      return true;
    },
  };
}
