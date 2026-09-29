import { NextRequest, NextResponse } from "next/server";
import { looksLikeCarId } from "@/lib/cars";
import { allow, getCars, getCounts, getVotedBy, hashIp, isVotableCar, setVote } from "@/lib/store";

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
  await setVote(body.car, id, body.on);
  const cars = await getCars();
  const [counts, voted] = await Promise.all([getCounts(cars), getVotedBy(id, cars)]);
  return withVoterCookie(NextResponse.json({ cars, counts, voted }), id);
}
