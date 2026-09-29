import { Redis } from "@upstash/redis";
import { VOTE_CARS, type CarId } from "./cars";

// Upstash Redis credentials. The Vercel Upstash integration provides KV_REST_API_*;
// UPSTASH_REDIS_REST_* is kept as a fallback for manual setups.
const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = Boolean(redisUrl && redisToken);

const redisClient = hasRedis
  ? new Redis({
      url: redisUrl!,
      token: redisToken!,
    })
  : null;

// Never silently fall back to the in-memory store in production: votes would be
// lost on every cold start and differ between serverless instances.
// The in-memory store below is for local development only.
// Checked on first use (not at import) so `next build`, which evaluates route
// modules, still works in environments without Redis credentials.
function getRedis(): Redis | null {
  if (process.env.NODE_ENV === "production" && !redisClient) {
    throw new Error(
      "Redis storage is not configured. Set KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN."
    );
  }
  return redisClient;
}

const mem = {
  counts: new Map<string, number>(),
  voters: new Map<string, Set<string>>(),
  hits: new Map<string, { n: number; until: number }>(),
  suggestions: [] as string[],
};

export async function getCounts(): Promise<Record<CarId, number>> {
  const redis = getRedis();
  const out = {} as Record<CarId, number>;
  if (redis) {
    const h = (await redis.hgetall<Record<string, number | string>>("votes")) ?? {};
    for (const c of VOTE_CARS) out[c.id] = Number(h[c.id] ?? 0);
  } else {
    for (const c of VOTE_CARS) out[c.id] = mem.counts.get(c.id) ?? 0;
  }
  return out;
}

/** Adds or removes one voter's vote for a car. Returns the new count. */
export async function setVote(car: CarId, voter: string, on: boolean): Promise<number> {
  const redis = getRedis();
  const key = `voters:${car}`;
  if (redis) {
    const changed = on ? await redis.sadd(key, voter) : await redis.srem(key, voter);
    if (changed) return redis.hincrby("votes", car, on ? 1 : -1);
    return Number((await redis.hget<number>("votes", car)) ?? 0);
  }
  const set = mem.voters.get(key) ?? new Set<string>();
  mem.voters.set(key, set);
  const had = set.has(voter);
  if (on && !had) set.add(voter);
  if (!on && had) set.delete(voter);
  const n = (mem.counts.get(car) ?? 0) + (on && !had ? 1 : !on && had ? -1 : 0);
  mem.counts.set(car, n);
  return n;
}

export async function getVotedBy(voter: string): Promise<CarId[]> {
  const redis = getRedis();
  const res: CarId[] = [];
  for (const c of VOTE_CARS) {
    const key = `voters:${c.id}`;
    const has = redis ? await redis.sismember(key, voter) : mem.voters.get(key)?.has(voter);
    if (has) res.push(c.id);
  }
  return res;
}

/** Simple fixed-window rate limit. Returns true when the request is allowed. */
export async function allow(key: string, max: number, windowSec: number): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const k = `rl:${key}`;
    const n = await redis.incr(k);
    if (n === 1) await redis.expire(k, windowSec);
    return n <= max;
  }
  const now = Date.now();
  const cur = mem.hits.get(key);
  if (!cur || cur.until < now) {
    mem.hits.set(key, { n: 1, until: now + windowSec * 1000 });
    return true;
  }
  cur.n += 1;
  return cur.n <= max;
}

export async function addSuggestion(entry: object) {
  const redis = getRedis();
  const json = JSON.stringify({ ...entry, at: new Date().toISOString() });
  if (redis) await redis.lpush("suggestions", json);
  else mem.suggestions.unshift(json);
}

export async function hashIp(ip: string) {
  const data = new TextEncoder().encode(ip + (process.env.VOTE_SALT ?? "zauberlabs"));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
