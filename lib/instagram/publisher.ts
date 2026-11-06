import { isRetryable, type Graph } from "./graph";
import { duePosts, type Post } from "./queue";
import type { State } from "./state";

/**
 * BL-118 — one publisher run: the approved posts whose time has come, at most PER_RUN per run, each only if Redis has no record
 * of it yet, and never a second post on the same Berlin day (PO 2026-11-06, "every day a post": a missed day shifts the backlog
 * by a day instead of doubling up; any record of today counts, also a failed one). With `enabled` false (the default until the PO says go, see IG_PUBLISH_ENABLED) it only reports what it would post.
 */
export const PER_RUN = 1;

/** "2026-11-06" for a moment, in Berlin time. */
export const berlinDay = (ms: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(ms));

const SITE_URL = "https://www.zauberlabs.de"; // as lib/blog.ts; not imported, so the cron function stays small

/** Where Instagram fetches a slide: the public image route, which serves approved posts only (app/social/instagram/…). */
export const slideUrl = (post: Post, file: string, base = SITE_URL) => `${base}/social/instagram/${post.id}/${file}`;

export type RunReport = {
  published: { id: string; mediaId: string; permalink?: string }[];
  wouldPublish: string[];
  failed: { id: string; error: string }[];
  /** BL-118.4: failed in a way that is safe to try again; the next run does. */
  retry: { id: string; error: string }[];
  skipped: { id: string; reason: string }[];
};

export async function publishDue(opts: { posts: Post[]; now: number; state: State; graph: Graph | null; enabled: boolean; base?: string }): Promise<RunReport> {
  const report: RunReport = { published: [], wouldPublish: [], failed: [], retry: [], skipped: [] };
  let budget = PER_RUN;
  const today = berlinDay(opts.now);
  const records = await Promise.all(opts.posts.map((p) => opts.state.get(p.id)));
  if (records.some((r) => r && berlinDay(Date.parse(r.at)) === today)) {
    for (const post of duePosts(opts.posts, opts.now)) {
      if (!records[opts.posts.indexOf(post)]) report.skipped.push({ id: post.id, reason: "tomorrow (one post per Berlin day)" });
    }
    return report;
  }
  for (const post of duePosts(opts.posts, opts.now)) {
    const record = await opts.state.get(post.id);
    if (record) {
      if (record.state !== "published") report.skipped.push({ id: post.id, reason: `record "${record.state}" in Redis` });
      continue;
    }
    if (budget === 0) {
      report.skipped.push({ id: post.id, reason: "next run (one post per run)" });
      continue;
    }
    budget -= 1;
    if (!opts.enabled || !opts.graph) {
      report.wouldPublish.push(post.id);
      continue;
    }
    const at = new Date(opts.now).toISOString();
    if (!(await opts.state.claim(post.id, at))) {
      report.skipped.push({ id: post.id, reason: "claimed by another run" });
      continue;
    }
    try {
      const images = post.slides.map((s) => ({ url: slideUrl(post, s.file, opts.base), alt: s.alt }));
      const { mediaId, permalink } = await opts.graph.publish(images, post.caption);
      await opts.state.set(post.id, { state: "published", at, mediaId, ...(permalink ? { permalink } : {}) });
      report.published.push({ id: post.id, mediaId, permalink });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      if (isRetryable(e)) {
        await opts.state.release(post.id, { at, error });
        report.retry.push({ id: post.id, error });
      } else {
        await opts.state.set(post.id, { state: "failed", at, error });
        report.failed.push({ id: post.id, error });
      }
    }
  }
  return report;
}

/** The posts that are on Instagram, with their media ids (for the comment digest). */
export async function publishedPosts(posts: Post[], state: State): Promise<{ post: Post; mediaId: string; permalink?: string }[]> {
  const out: { post: Post; mediaId: string; permalink?: string }[] = [];
  for (const post of posts) {
    const r = await state.get(post.id);
    if (r?.state === "published") out.push({ post, mediaId: r.mediaId, permalink: r.permalink });
  }
  return out;
}
