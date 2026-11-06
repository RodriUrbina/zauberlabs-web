import { getRedis } from "@/lib/store";

/**
 * BL-118 — what the publisher remembers, in Redis (the same Upstash database as the votes): per post one key
 * "ig:post:<post id>" with { state: "publishing" | "published" | "failed", … }, and the set "ig:comments:seen" with the ids of
 * comments already sent to the PO. Simpler and safer than a commit from the cron: the claim is one atomic SET NX, so two runs
 * at the same moment can never both publish a post, and a post that has any record is never tried again by itself.
 * A "publishing" or "failed" record stays until someone removes it on purpose (see README "Instagram"), because a failure
 * during the last API call cannot tell whether Instagram already posted it.
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
  };
}

/** For tests and local runs without Redis. */
export function memoryState(): State & { records: Map<string, PostRecord>; seen: Set<string> } {
  const records = new Map<string, PostRecord>();
  const seen = new Set<string>();
  return {
    records,
    seen,
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
