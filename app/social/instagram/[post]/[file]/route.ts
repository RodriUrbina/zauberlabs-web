import fs from "node:fs";
import path from "node:path";
import { QUEUE_DIR, readQueue, servableSlide } from "@/lib/instagram/queue";

export const dynamic = "force-dynamic";

/**
 * BL-118 — the public address Instagram fetches a slide from when we publish (lib/instagram/publisher.ts slideUrl). Serves the
 * JPEGs of approved posts only; drafts answer 404, so nothing is public before the PO approves it. Not for search engines.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ post: string; file: string }> }) {
  const { post: id, file } = await params;
  const post = servableSlide(readQueue().posts, id, file);
  if (!post) return new Response("Not found", { status: 404 });
  const body = fs.readFileSync(path.join(QUEUE_DIR, post.id, file));
  return new Response(new Uint8Array(body), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex" },
  });
}
