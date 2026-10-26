import { NextRequest, NextResponse } from "next/server";
import { looksLikeCarId } from "@/lib/cars";
import { allow, getCars, getCounts, getVotedBy, hashIp, isVotableCar, setVote } from "@/lib/store";
import { hasInternalMarker } from "@/lib/internal-mode-client";
import { countryCode, isBot, referrerDomain } from "@/lib/metrics";
import { recordVote, recordWithdrawal } from "@/lib/metrics-store";

export const dynamic = "force-dynamic";
const COOKIE = "zl_vid";

function voterId(req: NextRequest) {
  return req.cookies.get(COOKIE)?.value ?? null;
}

function withVoterCookie(res: NextResponse, id: string) {
  res.cookies.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}

export async function GET(req: NextRequest) {
  const id = voterId(req);
  const cars = await getCars();
  const [counts, voted] = await Promise.all([getCounts(cars), id ? getVotedBy(id, cars) : Promise.resolve([])]);
  return NextResponse.json({ cars, counts, voted }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await allow(`vote:${await hashIp(ip)}`, 30, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  if (!body || !looksLikeCarId(body.car) || typeof body.on !== "boolean" || !(await isVotableCar(body.car))) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const id = voterId(req) ?? crypto.randomUUID();
  // BL-078: a browser with the internal marker (cookie zl_internal=1) votes without changing the count.
  const internal = hasInternalMarker(req.headers.get("cookie") ?? "");
  const { counted } = await setVote(body.car, id, body.on, internal);
  // BL-051.2: anonymous vote sources for the admin statistics. Totals only, never linked to the voter id or cookie;
  // a statistics error never affects the vote. BL-078: only votes that changed the count, and votes taken back too.
  if (counted && !isBot(req.headers.get("user-agent"))) {
    try {
      if (body.on) {
        await recordVote({
          car: body.car,
          ref: referrerDomain(typeof body.r === "string" ? body.r.slice(0, 200) : "", undefined, "internal"),
          country: countryCode(req.headers.get("x-vercel-ip-country")),
        });
      } else {
        await recordWithdrawal(body.car);
      }
    } catch (err) {
      console.error("vote statistics failed", err instanceof Error ? err.message : "unknown error");
    }
  }
  const cars = await getCars();
  const [counts, voted] = await Promise.all([getCounts(cars), getVotedBy(id, cars)]);
  return withVoterCookie(NextResponse.json({ cars, counts, voted }), id);
}
