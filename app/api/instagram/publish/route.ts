import { NextRequest, NextResponse } from "next/server";
import { sendBrevoMail } from "@/lib/brevo";
import { cronAuthorized, graphFromEnv, publishingEnabled } from "@/lib/instagram/env";
import { publishDue } from "@/lib/instagram/publisher";
import { readQueue } from "@/lib/instagram/queue";
import { redisState } from "@/lib/instagram/state";
import { OWNER } from "@/lib/legal-entity";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // a carousel waits for each slide container

/**
 * BL-118 — Vercel Cron (vercel.json): daily (PO 2026-11-06, "every day a post") at 16:00 and 17:00 UTC, i.e. 18:00 Berlin in summer and in winter; the run
 * before 18:00 finds nothing due. Publishes at most one due, approved post (lib/instagram/publisher.ts) and mails the PO
 * when a post went out or failed. Without IG_PUBLISH_ENABLED=1 on production it only answers what it would post.
 */
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const enabled = publishingEnabled();
  const graph = graphFromEnv();
  if (enabled && !graph) return NextResponse.json({ error: "IG_USER_ID / IG_PAGE_TOKEN missing" }, { status: 503 });
  const { posts, broken } = readQueue();
  const report = await publishDue({ posts, now: Date.now(), state: redisState(), graph, enabled });

  const lines = [
    ...report.published.map((p) => `Veröffentlicht: ${p.id}${p.permalink ? ` – ${p.permalink}` : ""}`),
    ...report.failed.map((p) => `Fehlgeschlagen: ${p.id} – ${p.error}\nNicht noch einmal versucht. Erst auf Instagram nachsehen, dann den Redis-Eintrag ig:post:${p.id} löschen (README „Instagram“).`),
  ];
  if (lines.length) {
    await sendBrevoMail({ to: { email: OWNER.email }, subject: `Instagram: ${report.failed.length ? "Fehler beim Posten" : "Post veröffentlicht"}`, text: lines.join("\n\n"), bccOwner: false });
  }
  return NextResponse.json({ enabled, ...report, broken: broken.map((b) => b.id) }, { headers: { "Cache-Control": "no-store" } });
}
