import { Redis } from "@upstash/redis";
import { VOTE_CARS, isBuiltInCar, slugify, type Car, type CarId } from "./cars";

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
export function getRedis(): Redis | null {
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
  cars: new Map<string, string>(), // approved suggestions: id → display name
};

/** Built-in cars plus approved suggestions (Redis hash "cars": id → name). */
export async function getCars(): Promise<Car[]> {
  const redis = getRedis();
  const approved = redis
    ? Object.entries((await redis.hgetall<Record<string, unknown>>("cars")) ?? {})
    : [...mem.cars.entries()];
  const extra = approved
    .filter(([id]) => !isBuiltInCar(id))
    .map(([id, name]) => ({ id, name: String(name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...VOTE_CARS.map((c) => ({ id: c.id, name: c.name })), ...extra];
}

export async function isVotableCar(id: CarId): Promise<boolean> {
  if (isBuiltInCar(id)) return true;
  const redis = getRedis();
  return redis ? (await redis.hexists("cars", id)) === 1 : mem.cars.has(id);
}

export async function getCounts(cars?: Car[]): Promise<Record<CarId, number>> {
  const redis = getRedis();
  const list = cars ?? (await getCars());
  const out: Record<CarId, number> = {};
  if (redis) {
    const h = (await redis.hgetall<Record<string, number | string>>("votes")) ?? {};
    for (const c of list) out[c.id] = Number(h[c.id] ?? 0);
  } else {
    for (const c of list) out[c.id] = mem.counts.get(c.id) ?? 0;
  }
  return out;
}

/*
 * BL-078 (PO 2026-10-26): a vote from a browser with the internal marker (zl_internal) goes into its own set,
 * `voters-internal:{car}`, and never changes the count, so the PO can test the vote card. The count is always the size
 * of `voters:{car}`. Taking a vote back removes it from whichever set holds it; only a counted vote lowers the count.
 */
const votersKey = (car: CarId) => `voters:${car}`;
const internalVotersKey = (car: CarId) => `voters-internal:${car}`;

async function isMember(key: string, voter: string): Promise<boolean> {
  const redis = getRedis();
  return redis ? (await redis.sismember(key, voter)) === 1 : Boolean(mem.voters.get(key)?.has(voter));
}

async function addMember(key: string, voter: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) return (await redis.sadd(key, voter)) === 1;
  const set = mem.voters.get(key) ?? new Set<string>();
  mem.voters.set(key, set);
  if (set.has(voter)) return false;
  set.add(voter);
  return true;
}

async function removeMember(key: string, voter: string): Promise<boolean> {
  const redis = getRedis();
  return redis ? (await redis.srem(key, voter)) === 1 : Boolean(mem.voters.get(key)?.delete(voter));
}

async function addToCount(car: CarId, by: number): Promise<number> {
  const redis = getRedis();
  if (redis) return by ? await redis.hincrby("votes", car, by) : Number((await redis.hget<number>("votes", car)) ?? 0);
  const n = (mem.counts.get(car) ?? 0) + by;
  mem.counts.set(car, n);
  return n;
}

/**
 * Adds or removes one voter's vote for a car. `changed`: the voter's own state changed; `counted`: the count changed
 * (never for an internal vote). Returns the new count.
 */
export async function setVote(
  car: CarId,
  voter: string,
  on: boolean,
  internal = false
): Promise<{ count: number; changed: boolean; counted: boolean }> {
  if (on) {
    // Already voted in either set: nothing changes (a vote never sits in both).
    if ((await isMember(votersKey(car), voter)) || (await isMember(internalVotersKey(car), voter))) {
      return { count: await addToCount(car, 0), changed: false, counted: false };
    }
    if (internal) {
      await addMember(internalVotersKey(car), voter);
      return { count: await addToCount(car, 0), changed: true, counted: false };
    }
    const added = await addMember(votersKey(car), voter);
    return { count: await addToCount(car, added ? 1 : 0), changed: added, counted: added };
  }
  const removed = await removeMember(votersKey(car), voter);
  const removedInternal = await removeMember(internalVotersKey(car), voter);
  return { count: await addToCount(car, removed ? -1 : 0), changed: removed || removedInternal, counted: removed };
}

export async function getVotedBy(voter: string, cars?: Car[]): Promise<CarId[]> {
  const list = cars ?? (await getCars());
  const flags = await Promise.all(
    list.map(async (c) => (await isMember(votersKey(c.id), voter)) || (await isMember(internalVotersKey(c.id), voter)))
  );
  return list.filter((_, i) => flags[i]).map((c) => c.id);
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

// ─── Admin: review suggestions ───────────────────────────────────────────────

export type Suggestion = { raw: string; car: string; email: string | null; lang: string; at: string };

/** Newest first. `raw` is the exact stored entry, used to remove it again. */
export async function listSuggestions(limit = 200): Promise<Suggestion[]> {
  const redis = getRedis();
  const items: unknown[] = redis ? await redis.lrange("suggestions", 0, limit - 1) : mem.suggestions.slice(0, limit);
  return items.map((item) => {
    // The Upstash client auto-parses JSON; re-serialising gives back the stored string.
    const raw = typeof item === "string" ? item : JSON.stringify(item);
    let d: Partial<Suggestion> = {};
    try {
      d = typeof item === "string" ? JSON.parse(item) : (item as Partial<Suggestion>);
    } catch {}
    return { raw, car: String(d.car ?? raw), email: d.email ?? null, lang: String(d.lang ?? ""), at: String(d.at ?? "") };
  });
}

export async function removeSuggestion(raw: string): Promise<void> {
  const redis = getRedis();
  if (redis) await redis.lrem("suggestions", 1, raw);
  else {
    const i = mem.suggestions.indexOf(raw);
    if (i >= 0) mem.suggestions.splice(i, 1);
  }
}

/** Adds a car to the vote. Returns the car; if it already exists, the existing one. */
export async function approveCar(name: string): Promise<Car> {
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 60);
  const id = slugify(clean);
  if (!id) throw new Error("Invalid car name");
  const existing = (await getCars()).find((c) => c.id === id);
  if (existing) return existing;
  const redis = getRedis();
  if (redis) await redis.hset("cars", { [id]: clean });
  else mem.cars.set(id, clean);
  return { id, name: clean };
}

/** Removes an approved car from the vote (built-in cars can't be removed; votes are kept). */
export async function removeCar(id: CarId): Promise<void> {
  if (isBuiltInCar(id)) return;
  const redis = getRedis();
  if (redis) await redis.hdel("cars", id);
  else mem.cars.delete(id);
}

export async function hashIp(ip: string) {
  const data = new TextEncoder().encode(ip + (process.env.VOTE_SALT ?? "zauberlabs"));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
