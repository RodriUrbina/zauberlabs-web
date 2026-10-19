import { getRedis } from "./store";
import { RETENTION_DAYS, TIME_BUCKETS, berlinDay, medianBucket, previousDay, type PageId, type TimeBucket } from "./metrics";

/**
 * BL-051 — Redis side of our own reading statistics. Everything stored is a daily counter:
 *   v:{day}          hash  page → views
 *   u:{day}:{page}   HyperLogLog of salted hashes (unique readers); rolled up into uc:{day} once the day is over, then deleted
 *   uc:{day}         hash  page → unique readers (number)
 *   r:{day}          hash  referrer domain → views
 *   c:{day}          hash  country → views (never stored together with anything else)
 *   k:{day}          hash  configurator → clicks
 *   t:{day}          hash  "page|bucket" → readings, "page|end" → read to the end
 *   salt:{day}       random value for that day's hash; expires 24 h after it is created
 * Daily keys expire after RETENTION_DAYS. No IP, no User-Agent, no hash is stored outside the HyperLogLog.
 * Preview and local builds write under "m:test:" so tests never mix with production numbers.
 */
const P = process.env.VERCEL_ENV === "production" ? "m:" : "m:test:";
const TTL = RETENTION_DAYS * 86_400;
const HLL_TTL = 8 * 86_400; // safety net: rolled up the next day at the latest when the site has traffic

const key = {
  views: (d: string) => `${P}v:${d}`,
  hll: (d: string, page: PageId) => `${P}u:${d}:${page}`,
  uniques: (d: string) => `${P}uc:${d}`,
  refs: (d: string) => `${P}r:${d}`,
  countries: (d: string) => `${P}c:${d}`,
  clicks: (d: string) => `${P}k:${d}`,
  time: (d: string) => `${P}t:${d}`,
  salt: (d: string) => `${P}salt:${d}`,
};

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Today's salt. The first request of a day creates it (and rolls up yesterday's unique readers). */
async function daySalt(day: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const existing = await redis.get<string>(key.salt(day));
  if (existing) return String(existing);
  const fresh = crypto.randomUUID();
  const created = await redis.set(key.salt(day), fresh, { nx: true, ex: 86_400 });
  if (created === "OK") {
    await rollupUniques(previousDay(day));
    return fresh;
  }
  return String((await redis.get<string>(key.salt(day))) ?? fresh);
}

/** Replaces a finished day's HyperLogLogs by plain numbers. Safe to call more than once. */
export async function rollupUniques(day: string): Promise<void> {
  const redis = getRedis();
  if (!redis || day >= berlinDay()) return;
  const pages = (await redis.hkeys(key.views(day))) as string[];
  if (!pages.length) return;
  const counts = await Promise.all(pages.map((p) => redis.pfcount(key.hll(day, p))));
  const found = pages.map((p, i) => [p, counts[i]] as const).filter(([, n]) => n > 0);
  if (!found.length) return; // already rolled up (or expired)
  const tx = redis.pipeline();
  tx.hset(key.uniques(day), Object.fromEntries(found));
  tx.expire(key.uniques(day), TTL);
  for (const [p] of found) tx.del(key.hll(day, p));
  await tx.exec();
}

export async function recordView(input: { page: PageId; ref: string; country: string; ip: string; userAgent: string }): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const day = berlinDay();
  const salt = await daySalt(day);
  const reader = await sha256(`${salt}|${input.ip}|${input.userAgent}`);
  const tx = redis.pipeline();
  tx.hincrby(key.views(day), input.page, 1);
  tx.expire(key.views(day), TTL);
  tx.pfadd(key.hll(day, input.page), reader);
  tx.expire(key.hll(day, input.page), HLL_TTL);
  tx.hincrby(key.refs(day), input.ref, 1);
  tx.expire(key.refs(day), TTL);
  tx.hincrby(key.countries(day), input.country, 1);
  tx.expire(key.countries(day), TTL);
  await tx.exec();
}

export async function recordEngagement(input: { page: PageId; bucket: TimeBucket; end: boolean }): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const day = berlinDay();
  const tx = redis.pipeline();
  tx.hincrby(key.time(day), `${input.page}|${input.bucket}`, 1);
  if (input.end) tx.hincrby(key.time(day), `${input.page}|end`, 1);
  tx.expire(key.time(day), TTL);
  await tx.exec();
}

export async function recordClick(configurator: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const day = berlinDay();
  const tx = redis.pipeline();
  tx.hincrby(key.clicks(day), configurator, 1);
  tx.expire(key.clicks(day), TTL);
  await tx.exec();
}

// ─── Admin: read the counters ───────────────────────────────────────────────

export type ArticleStats = {
  page: PageId;
  views: number;
  uniques: number;
  readings: number;
  medianTime: TimeBucket | null;
  readToEnd: number;
  time: Partial<Record<TimeBucket, number>>;
};
export type Stats = {
  days: string[];
  totals: { views: number; uniques: number; clicks: number };
  daily: { day: string; views: number; clicks: number }[];
  articles: ArticleStats[];
  referrers: { domain: string; views: number }[];
  countries: { code: string; views: number }[];
  clicks: { configurator: string; clicks: number }[];
};

type Hash = Record<string, number | string> | null;
const num = (v: unknown) => Number(v ?? 0) || 0;

function addInto(target: Map<string, number>, h: Hash) {
  for (const [k, v] of Object.entries(h ?? {})) target.set(k, (target.get(k) ?? 0) + num(v));
}
const sorted = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

/** Sums the daily counters for the given days. Unique readers are summed per day (a reader on two days counts twice). */
export async function getStats(days: string[]): Promise<Stats> {
  const empty: Stats = { days, totals: { views: 0, uniques: 0, clicks: 0 }, daily: [], articles: [], referrers: [], countries: [], clicks: [] };
  const redis = getRedis();
  if (!redis) return empty;
  const today = berlinDay();
  await Promise.all(days.filter((d) => d < today).map((d) => rollupUniques(d)));

  const tx = redis.pipeline();
  for (const d of days) {
    tx.hgetall(key.views(d));
    tx.hgetall(key.uniques(d));
    tx.hgetall(key.refs(d));
    tx.hgetall(key.countries(d));
    tx.hgetall(key.clicks(d));
    tx.hgetall(key.time(d));
  }
  const res = (await tx.exec()) as Hash[];

  const views = new Map<string, number>();
  const uniques = new Map<string, number>();
  const refs = new Map<string, number>();
  const countries = new Map<string, number>();
  const clicks = new Map<string, number>();
  const time = new Map<string, number>();
  const daily: Stats["daily"] = [];
  let todayPages: string[] = [];

  days.forEach((d, i) => {
    const [v, u, r, c, k, t] = res.slice(i * 6, i * 6 + 6);
    addInto(views, v);
    addInto(uniques, u);
    addInto(refs, r);
    addInto(countries, c);
    addInto(clicks, k);
    addInto(time, t);
    daily.push({
      day: d,
      views: Object.values(v ?? {}).reduce<number>((s, n) => s + num(n), 0),
      clicks: Object.values(k ?? {}).reduce<number>((s, n) => s + num(n), 0),
    });
    if (d === today) todayPages = Object.keys(v ?? {});
  });

  // Today's unique readers are still in the HyperLogLogs.
  if (todayPages.length) {
    const live = await Promise.all(todayPages.map((p) => redis.pfcount(key.hll(today, p))));
    todayPages.forEach((p, i) => uniques.set(p, (uniques.get(p) ?? 0) + live[i]));
  }

  const articles: ArticleStats[] = sorted(views).map(([page, n]) => {
    const buckets = Object.fromEntries(TIME_BUCKETS.map((b) => [b, time.get(`${page}|${b}`) ?? 0])) as Record<TimeBucket, number>;
    return {
      page,
      views: n,
      uniques: uniques.get(page) ?? 0,
      readings: TIME_BUCKETS.reduce((s, b) => s + buckets[b], 0),
      medianTime: medianBucket(buckets),
      readToEnd: time.get(`${page}|end`) ?? 0,
      time: buckets,
    };
  });

  return {
    days,
    totals: {
      views: articles.reduce((s, a) => s + a.views, 0),
      uniques: articles.reduce((s, a) => s + a.uniques, 0),
      clicks: [...clicks.values()].reduce((s, n) => s + n, 0),
    },
    daily,
    articles,
    referrers: sorted(refs).map(([domain, n]) => ({ domain, views: n })),
    countries: sorted(countries).map(([code, n]) => ({ code, views: n })),
    clicks: sorted(clicks).map(([configurator, n]) => ({ configurator, clicks: n })),
  };
}
