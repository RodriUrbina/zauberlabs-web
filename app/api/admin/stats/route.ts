import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { STATS_START_DAY, statsDays } from "@/lib/metrics";
import { getBudget, getStats } from "@/lib/metrics-store";
import { getCars, getCounts } from "@/lib/store";

export const dynamic = "force-dynamic";

/** BL-051 — GET /api/admin/stats?days=7|30|90 → summed daily counters (admin password required); BL-060: never before STATS_START_DAY. */
export async function GET(req: NextRequest) {
  const denied = await adminGuard(req);
  if (denied) return denied;
  const n = Number(req.nextUrl.searchParams.get("days"));
  const days = [7, 30, 90].includes(n) ? n : 30;
  const cars = await getCars();
  const [stats, budget, counts] = await Promise.all([getStats(statsDays(days)), getBudget(), getCounts(cars)]);
  // BL-078: the standing totals, the same numbers as the public vote card.
  const standing = cars.map((c) => ({ car: c.id, name: c.name, votes: counts[c.id] ?? 0 })).sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
  return NextResponse.json({ ...stats, budget, since: STATS_START_DAY, standing }, { headers: { "Cache-Control": "no-store" } });
}
