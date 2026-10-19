import { NextRequest } from "next/server";
import { getBlog } from "@/lib/blog";
import { isLocale } from "@/lib/i18n";
import { hasInternalMarker } from "@/lib/internal-mode-client";
import { countryCode, isBot, pageId, parseBeacon, referrerDomain, timeBucket } from "@/lib/metrics";
import { recordClick, recordEngagement, recordView } from "@/lib/metrics-store";

export const dynamic = "force-dynamic";

/**
 * BL-051 — beacon endpoint for our own anonymous statistics (see lib/metrics-store.ts for what is stored).
 * Always answers 204, so a reader's browser learns nothing and never retries.
 */
const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

// Abuse guard held in this instance's memory only (nothing about the sender is written to Redis).
const recent = new Map<string, { n: number; until: number }>();
function allowedInMemory(ip: string): boolean {
  const now = Date.now();
  if (recent.size > 5000) for (const [k, v] of recent) if (v.until < now) recent.delete(k);
  const cur = recent.get(ip);
  if (!cur || cur.until < now) {
    recent.set(ip, { n: 1, until: now + 60_000 });
    return true;
  }
  cur.n += 1;
  return cur.n <= 60;
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent");
  if (isBot(ua) || hasInternalMarker(req.headers.get("cookie") ?? "")) return done();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  if (!allowedInMemory(ip)) return done();

  const beacon = parseBeacon(await req.text().catch(() => ""));
  if (!beacon) return done();
  try {
    if (beacon.t === "k") {
      await recordClick(beacon.configurator);
      return done();
    }
    // Only real, published articles count.
    if (!isLocale(beacon.lang) || !getBlog().getPost(beacon.slug, beacon.lang)) return done();
    const page = pageId(beacon.lang, beacon.slug);
    if (beacon.t === "v") {
      await recordView({
        page,
        ref: referrerDomain(beacon.ref),
        country: countryCode(req.headers.get("x-vercel-ip-country")),
        ip,
        userAgent: ua ?? "",
      });
    } else {
      await recordEngagement({ page, bucket: timeBucket(beacon.seconds), end: beacon.end });
    }
  } catch (err) {
    console.error("stats beacon failed", err instanceof Error ? err.message : "unknown error");
  }
  return done();
}
