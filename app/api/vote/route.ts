import { NextRequest, NextResponse } from "next/server";
import { isCarId } from "@/lib/cars";
import { allow, getCounts, getVotedBy, hashIp, setVote } from "@/lib/store";

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
  const [counts, voted] = await Promise.all([getCounts(), id ? getVotedBy(id) : Promise.resolve([])]);
  return NextResponse.json({ counts, voted }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await allow(`vote:${await hashIp(ip)}`, 30, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  if (!body || !isCarId(body.car) || typeof body.on !== "boolean") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const id = voterId(req) ?? crypto.randomUUID();
  await setVote(body.car, id, body.on);
  const [counts, voted] = await Promise.all([getCounts(), getVotedBy(id)]);
  return withVoterCookie(NextResponse.json({ counts, voted }), id);
}
