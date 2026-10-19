import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "node:crypto";
import { allow, hashIp } from "./store";

const sha = (s: string) => createHash("sha256").update(s).digest();

/** Checks `Authorization: Bearer <ADMIN_PASSWORD>`. Returns an error response, or null when allowed. */
export async function adminGuard(req: NextRequest): Promise<NextResponse | null> {
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
