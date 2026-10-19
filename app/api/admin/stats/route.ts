import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { lastDays } from "@/lib/metrics";
import { getStats } from "@/lib/metrics-store";

export const dynamic = "force-dynamic";

/** BL-051 — GET /api/admin/stats?days=7|30|90 → summed daily counters (admin password required). */
export async function GET(req: NextRequest) {
  const denied = await adminGuard(req);
  if (denied) return denied;
  const n = Number(req.nextUrl.searchParams.get("days"));
  const days = [7, 30, 90].includes(n) ? n : 30;
  return NextResponse.json(await getStats(lastDays(days)), { headers: { "Cache-Control": "no-store" } });
}
