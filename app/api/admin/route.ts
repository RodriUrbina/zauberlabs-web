import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "node:crypto";
import { looksLikeCarId } from "@/lib/cars";
import { allow, approveCar, getCars, getCounts, hashIp, listSuggestions, removeCar, removeSuggestion } from "@/lib/store";

export const dynamic = "force-dynamic";

const sha = (s: string) => createHash("sha256").update(s).digest();

/** Checks `Authorization: Bearer <ADMIN_PASSWORD>`. Returns an error response, or null when allowed. */
async function guard(req: NextRequest): Promise<NextResponse | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.json({ error: "Admin is disabled (ADMIN_PASSWORD not set)" }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await allow(`admin:${await hashIp(ip)}`, 120, 600))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!timingSafeEqual(sha(given), sha(expected))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

async function state() {
  const [suggestions, cars] = await Promise.all([listSuggestions(), getCars()]);
  const counts = await getCounts(cars);
  return { suggestions, cars: cars.map((c) => ({ ...c, votes: counts[c.id] ?? 0 })) };
}

export async function GET(req: NextRequest) {
  const denied = await guard(req);
  if (denied) return denied;
  return NextResponse.json(await state(), { headers: { "Cache-Control": "no-store" } });
}

/**
 * { action: "approve", name, raw? }  → add car to the vote (and remove the suggestion `raw`)
 * { action: "dismiss", raw }         → delete a suggestion
 * { action: "remove", id }           → take an approved car out of the vote (votes are kept)
 */
export async function POST(req: NextRequest) {
  const denied = await guard(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const raw = typeof body?.raw === "string" ? body.raw : null;

  if (body?.action === "approve" && typeof body.name === "string" && body.name.trim().length >= 2) {
    await approveCar(body.name);
    if (raw) await removeSuggestion(raw);
  } else if (body?.action === "dismiss" && raw) {
    await removeSuggestion(raw);
  } else if (body?.action === "remove" && looksLikeCarId(body.id)) {
    await removeCar(body.id);
  } else {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  return NextResponse.json(await state());
}
