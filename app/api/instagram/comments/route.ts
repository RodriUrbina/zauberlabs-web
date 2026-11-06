import { NextRequest, NextResponse } from "next/server";
import { sendBrevoMail } from "@/lib/brevo";
import { collectNewComments, digestMail } from "@/lib/instagram/comments";
import { cronAuthorized, graphFromEnv } from "@/lib/instagram/env";
import { publishedPosts } from "@/lib/instagram/publisher";
import { readQueue } from "@/lib/instagram/queue";
import { redisState } from "@/lib/instagram/state";
import { OWNER } from "@/lib/legal-entity";

export const dynamic = "force-dynamic";

/**
 * BL-118 — Vercel Cron (vercel.json), daily at 07:00 UTC: reads the comments on our own published posts (read only) and mails
 * the new ones to the PO with a drafted reply each. No reply, like or anything else is ever sent to Instagram.
 */
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const graph = graphFromEnv();
  if (!graph) return NextResponse.json({ error: "IG_USER_ID / IG_PAGE_TOKEN missing" }, { status: 503 });
  const state = redisState();
  const items = await collectNewComments(await publishedPosts(readQueue().posts, state), graph, state);
  let mail: string = "none";
  if (items.length) {
    const { subject, text } = digestMail(items);
    mail = await sendBrevoMail({ to: { email: OWNER.email }, subject, text, bccOwner: false });
  }
  return NextResponse.json({ posts: items.length, comments: items.reduce((s, i) => s + i.comments.length, 0), mail }, { headers: { "Cache-Control": "no-store" } });
}
