import { NextRequest, NextResponse } from "next/server";
import { addSuggestion, allow, hashIp } from "@/lib/store";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await allow(`suggest:${await hashIp(ip)}`, 5, 600))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const car = typeof body?.car === "string" ? body.car.trim().slice(0, 120) : "";
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
  if (car.length < 2) return NextResponse.json({ error: "Missing car" }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  await addSuggestion({ car, email: email || null, lang: body?.lang === "en" ? "en" : "de" });
  return NextResponse.json({ ok: true });
}
