import type { Locale } from "./i18n";

/**
 * Scheduled publishing (BL-004): one approved article per day at 07:00 Europe/Berlin.
 * Pure date helpers, no dependencies; DST is derived from Intl, never hard-coded.
 */

export const PUBLISH_TZ = "Europe/Berlin";
export const PUBLISH_HOUR = 7;
export const PUBLISH_MINUTE = 0;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/; // no offset → Berlin wall time
const WITH_OFFSET = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i;

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsInZone(utcMs: number, tz: string): Parts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const { type, value } of dtf.formatToParts(new Date(utcMs))) p[type] = value;
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour === 24 ? 0 : +p.hour, minute: +p.minute, second: +p.second };
}

/** UTC offset of `tz` at a UTC instant, in minutes (Berlin: 60 in winter, 120 in summer). */
export function tzOffsetMinutes(utcMs: number, tz = PUBLISH_TZ): number {
  const p = partsInZone(utcMs, tz);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asIfUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

/** Wall-clock time in `tz` → UTC milliseconds. Two-pass so the offset of the *resulting* instant is used (DST-safe). */
export function zonedToUtcMs(year: number, month: number, day: number, hour = PUBLISH_HOUR, minute = PUBLISH_MINUTE, tz = PUBLISH_TZ): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const off1 = tzOffsetMinutes(guess, tz);
  const first = guess - off1 * 60000;
  const off2 = tzOffsetMinutes(first, tz);
  return off2 === off1 ? first : guess - off2 * 60000;
}

/** Calendar day (YYYY-MM-DD) of a UTC instant, seen from `tz`. */
export function dayInZone(utcMs: number, tz = PUBLISH_TZ): string {
  const p = partsInZone(utcMs, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * Parses the front-matter `publishAt` value into a UTC instant (ms).
 *   "2026-10-05"                 → 07:00 Europe/Berlin on that day
 *   "2026-10-05T12:30"           → 12:30 Europe/Berlin (wall time, no offset given)
 *   "2026-10-05T12:30:00+02:00"  → that exact instant ("Z" accepted too)
 * Throws on anything else.
 */
export function parsePublishAt(value: string): number {
  const v = value.trim();
  let m = v.match(DATE_ONLY);
  if (m) {
    checkFields(v, +m[1], +m[2], +m[3]);
    return zonedToUtcMs(+m[1], +m[2], +m[3]);
  }
  m = v.match(WALL_TIME);
  if (m) {
    checkFields(v, +m[1], +m[2], +m[3], +m[4], +m[5], m[6] ? +m[6] : 0);
    return zonedToUtcMs(+m[1], +m[2], +m[3], +m[4], +m[5]);
  }
  if (WITH_OFFSET.test(v)) {
    const ms = Date.parse(v.replace(" ", "T"));
    if (!Number.isFinite(ms)) throw new Error(`publishAt "${value}" is not a valid moment`);
    return ms;
  }
  throw new Error(`publishAt "${value}" is not a date (YYYY-MM-DD), a Berlin wall time (YYYY-MM-DDTHH:mm) or an ISO moment with offset`);
}

/** Date.UTC silently rolls over month 13 or hour 25; reject those explicitly. */
function checkFields(raw: string, y: number, mo: number, d: number, h = 0, mi = 0, sec = 0): void {
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate(); // day 0 of next month
  const ok = y >= 1970 && y <= 9999 && mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth && h >= 0 && h <= 23 && mi >= 0 && mi <= 59 && sec >= 0 && sec <= 59;
  if (!ok) throw new Error(`publishAt "${raw}" is not a valid calendar date/time`);
}

/** Human form of a publish moment in Berlin time, e.g. "5 October 2026, 07:00 (Berlin)". */
export function formatPublishMoment(utcMs: number, lang: Locale): string {
  const p = partsInZone(utcMs, PUBLISH_TZ);
  const month = new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { timeZone: PUBLISH_TZ, month: "long" }).format(new Date(utcMs));
  const hhmm = `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
  // Composed by hand so the wording does not drift with the ICU version ("at" / "um").
  return lang === "de" ? `${p.day}. ${month} ${p.year}, ${hhmm} (Berlin)` : `${p.day} ${month} ${p.year}, ${hhmm} (Berlin)`;
}
