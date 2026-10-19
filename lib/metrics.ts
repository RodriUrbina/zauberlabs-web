/**
 * BL-051 — our own anonymous reading statistics (PO decision 2026-10-19, option A).
 * Pure helpers only (no Redis, no Node APIs), shared by the beacon endpoint, the admin stats and the tests.
 * Stored in Redis are daily counters only: no IP, no cookies, no record per visitor (see lib/metrics-store.ts).
 */

/** Reading-time buckets for engaged seconds on an article page. */
export const TIME_BUCKETS = ["0-10s", "10-30s", "30-60s", "1-2m", "2-5m", "5m+"] as const;
export type TimeBucket = (typeof TIME_BUCKETS)[number];

/** Configurators a click can be counted for; nothing outside this list is ever stored. */
export const CONFIGURATORS = ["e46"] as const;

/** Daily counters are kept for about 13 months. */
export const RETENTION_DAYS = 400;

export function timeBucket(seconds: number): TimeBucket {
  if (seconds < 10) return "0-10s";
  if (seconds < 30) return "10-30s";
  if (seconds < 60) return "30-60s";
  if (seconds < 120) return "1-2m";
  if (seconds < 300) return "2-5m";
  return "5m+";
}

/** The calendar day in Berlin, "YYYY-MM-DD". Counters roll over at midnight German time. */
export function berlinDay(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** The `n` Berlin days ending today, oldest first. */
export function lastDays(n: number, at: Date = new Date()): string[] {
  const out: string[] = [];
  const today = berlinDay(at);
  const base = Date.parse(`${today}T12:00:00Z`);
  for (let i = n - 1; i >= 0; i--) out.push(new Date(base - i * 86_400_000).toISOString().slice(0, 10));
  return out;
}

export function previousDay(day: string): string {
  return new Date(Date.parse(`${day}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/**
 * Referrer → domain only ("google.com", "chatgpt.com"). Our own sites, an empty or invalid referrer → "direct".
 * Path and query are never kept. "www." is dropped so google.com and www.google.com count together.
 */
export function referrerDomain(referrer: string | null | undefined, ownHosts: readonly string[] = ["zauberlabs.de"]): string {
  if (!referrer) return "direct";
  let host: string;
  try {
    const u = new URL(referrer);
    if (u.protocol === "android-app:") return "app";
    if (u.protocol !== "http:" && u.protocol !== "https:") return "direct";
    host = u.hostname.toLowerCase();
  } catch {
    // The browser already sends a bare host; accept that too.
    host = referrer.trim().toLowerCase();
  }
  host = host.replace(/^www\./, "");
  if (host.length > 60 || !DOMAIN.test(host)) return "direct";
  if (ownHosts.some((own) => host === own || host.endsWith(`.${own}`))) return "direct";
  return host;
}

/** Two-letter country code from x-vercel-ip-country, or "XX" when unknown. */
export function countryCode(header: string | null | undefined): string {
  const c = (header ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : "XX";
}

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|python|curl|wget|httpclient|monitor/i;

/** Obvious bots and tools are not counted. An empty User-Agent counts as a bot. */
export function isBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT.test(userAgent);
}

/** "de/some-article" — the language of the page that was read, then the article slug. */
export type PageId = string;
export const pageId = (lang: string, slug: string): PageId => `${lang}/${slug}`;

export type Beacon =
  | { t: "v"; lang: string; slug: string; ref: string }
  | { t: "e"; lang: string; slug: string; seconds: number; end: boolean }
  | { t: "k"; configurator: string };

/** Parses a beacon body (sent as text by navigator.sendBeacon). Returns null for anything malformed. */
export function parseBeacon(body: string): Beacon | null {
  if (body.length > 500) return null;
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(body);
  } catch {
    return null;
  }
  if (!d || typeof d !== "object") return null;
  const str = (v: unknown, max: number) => (typeof v === "string" && v.length > 0 && v.length <= max ? v : null);
  if (d.t === "k") {
    const c = str(d.c, 20);
    return c && (CONFIGURATORS as readonly string[]).includes(c) ? { t: "k", configurator: c } : null;
  }
  const lang = str(d.l, 5);
  const slug = str(d.s, 120);
  if (!lang || !slug || !/^[a-z0-9-]+$/.test(slug)) return null;
  if (d.t === "v") return { t: "v", lang, slug, ref: typeof d.r === "string" ? d.r.slice(0, 200) : "" };
  if (d.t === "e" && typeof d.n === "number" && Number.isFinite(d.n) && d.n >= 0) {
    return { t: "e", lang, slug, seconds: Math.min(Math.round(d.n), 6 * 3600), end: d.x === true };
  }
  return null;
}

/** The bucket the median reader falls into, or null when there are no readings. */
export function medianBucket(counts: Partial<Record<TimeBucket, number>>): TimeBucket | null {
  const total = TIME_BUCKETS.reduce((s, b) => s + (counts[b] ?? 0), 0);
  if (!total) return null;
  let seen = 0;
  for (const b of TIME_BUCKETS) {
    seen += counts[b] ?? 0;
    if (seen >= total / 2) return b;
  }
  return null;
}
