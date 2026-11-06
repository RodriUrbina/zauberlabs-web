import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

/**
 * BL-118 (PO 2026-11-06) — the Instagram post queue: one folder per post under content/social/instagram/<yyyy-mm-dd>-<slug>/ with
 * the slides (1.jpg, 2.jpg … at 1080 × 1350; Instagram's publishing API takes JPEG only), caption.txt (German, a line "—",
 * English, then the hashtags) and meta.json (publishAt with its Berlin offset, status, one alt text per slide). Only posts with
 * status "approved" are ever published; the PO approves them one at a time. Whether a post went out is recorded in Redis
 * (lib/instagram/state.ts), not here, so a published post keeps status "approved" in the repo.
 */
export const QUEUE_DIR = path.join(process.cwd(), "content", "social", "instagram");

export const STATUSES = ["draft", "approved", "published"] as const;
export const MAX_SLIDES = 10; // Instagram carousel limit
export const MAX_CAPTION = 2200; // Instagram caption limit (characters)
export const MAX_HASHTAGS = 30; // Instagram hashtag limit per post
export const SLIDE_SIZE = { width: 1080, height: 1350 } as const;

const POST_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLIDE_FILE = /^(?:[1-9]|10)\.jpg$/;

const MetaSchema = z.object({
  // An ISO time with its offset (+01:00 in winter, +02:00 in summer), so the folder is readable without a time zone table.
  publishAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?[+-]\d{2}:\d{2}$/, "publishAt needs an ISO time with offset"),
  status: z.enum(STATUSES),
  title: z.string().optional(),
  // BL-118 /links: the tile's headline (the slide's own words) and where the tile leads: "e46build", "vote" (the vote on
  // zauberlabs.de) or a blog article's slug. Without a link the tile opens E46BUILD.
  headline: z.string().min(1).max(120).optional(),
  link: z.union([z.literal("e46build"), z.literal("vote"), z.string().regex(/^blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/, 'link is "e46build", "vote" or "blog/<slug>"')]).optional(),
  slides: z
    .array(z.object({ file: z.string().regex(SLIDE_FILE, "slides are 1.jpg … 10.jpg"), alt: z.string().min(1).max(1000) }))
    .min(1)
    .max(MAX_SLIDES),
  factSources: z.string().optional(),
  reviewNotes: z.array(z.string()).optional(),
  importedFrom: z.string().optional(),
});
export type PostMeta = z.infer<typeof MetaSchema>;

export type Post = PostMeta & { id: string; caption: string; publishAtMs: number };

/** JPEG width and height from the SOF marker, without an image library (the queue check runs in tests and the dry run). */
export function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

/** The problems with one caption (empty list = fine). */
export function captionProblems(caption: string): string[] {
  const problems: string[] = [];
  if (!caption.trim()) problems.push("caption.txt is empty");
  if ([...caption].length > MAX_CAPTION) problems.push(`caption has ${[...caption].length} characters (max ${MAX_CAPTION})`);
  const tags = caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  if (tags.length > MAX_HASHTAGS) problems.push(`caption has ${tags.length} hashtags (max ${MAX_HASHTAGS})`);
  if (!/\n—\n/.test(caption)) problems.push('caption needs the German block, a line "—", then the English block');
  return problems;
}

/** Reads and checks one post folder. Returns the post, or the list of problems. */
export function readPost(dir: string): { post: Post } | { problems: string[] } {
  const id = path.basename(dir);
  const problems: string[] = [];
  if (!POST_ID.test(id)) problems.push(`folder name "${id}" is not <yyyy-mm-dd>-<slug>`);
  let meta: PostMeta | null = null;
  try {
    const parsed = MetaSchema.safeParse(JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")));
    if (parsed.success) meta = parsed.data;
    else problems.push(...parsed.error.issues.map((i) => `meta.json ${i.path.join(".")}: ${i.message}`));
  } catch (e) {
    problems.push(`meta.json: ${e instanceof Error ? e.message : "unreadable"}`);
  }
  let caption = "";
  try {
    caption = fs.readFileSync(path.join(dir, "caption.txt"), "utf8").trim();
    problems.push(...captionProblems(caption));
  } catch {
    problems.push("caption.txt is missing");
  }
  if (meta) {
    const files = meta.slides.map((s) => s.file);
    files.forEach((f, i) => f !== `${i + 1}.jpg` && problems.push(`slide ${i + 1} must be ${i + 1}.jpg, not ${f}`));
    for (const f of files) {
      try {
        const size = jpegSize(fs.readFileSync(path.join(dir, f)));
        if (!size) problems.push(`${f} is not a JPEG`);
        else if (size.width !== SLIDE_SIZE.width || size.height !== SLIDE_SIZE.height) problems.push(`${f} is ${size.width}×${size.height}, not 1080×1350`);
      } catch {
        problems.push(`${f} is missing`);
      }
    }
    const extra = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg") && !files.includes(f));
    if (extra.length) problems.push(`slides not listed in meta.json: ${extra.join(", ")}`);
    if (id.slice(0, 10) !== meta.publishAt.slice(0, 10)) problems.push(`folder date ${id.slice(0, 10)} differs from publishAt ${meta.publishAt.slice(0, 10)}`);
  }
  const publishAtMs = meta ? Date.parse(meta.publishAt) : NaN;
  if (meta && Number.isNaN(publishAtMs)) problems.push("publishAt is not a valid time");
  if (problems.length || !meta) return { problems };
  return { post: { ...meta, id, caption, publishAtMs } };
}

/** Every post folder in the queue, oldest first, with the problems of the broken ones. */
export function readQueue(dir = QUEUE_DIR): { posts: Post[]; broken: { id: string; problems: string[] }[] } {
  const posts: Post[] = [];
  const broken: { id: string; problems: string[] }[] = [];
  const ids = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort() : [];
  for (const id of ids) {
    const r = readPost(path.join(dir, id));
    if ("post" in r) posts.push(r.post);
    else broken.push({ id, problems: r.problems });
  }
  return { posts, broken };
}

/** Approved posts whose time has come, oldest first. Drafts and posts marked "published" in the repo never are. */
export function duePosts(posts: Post[], now: number): Post[] {
  return posts.filter((p) => p.status === "approved" && p.publishAtMs <= now).sort((a, b) => a.publishAtMs - b.publishAtMs);
}

/**
 * The slide files the public image route may serve: only those of approved posts (Instagram fetches them by URL when we
 * publish), so drafts stay private until the PO approves them.
 */
export function servableSlide(posts: Post[], id: string, file: string): Post | null {
  const post = posts.find((p) => p.id === id);
  if (!post || post.status === "draft" || !SLIDE_FILE.test(file) || !post.slides.some((s) => s.file === file)) return null;
  return post;
}
