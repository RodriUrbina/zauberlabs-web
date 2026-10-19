import { NextRequest, NextResponse } from "next/server";
import { looksLikeCarId } from "@/lib/cars";
import { adminGuard as guard } from "@/lib/admin-guard";
import { approveCar, getCars, getCounts, listSuggestions, removeCar, removeSuggestion } from "@/lib/store";

export const dynamic = "force-dynamic";

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
