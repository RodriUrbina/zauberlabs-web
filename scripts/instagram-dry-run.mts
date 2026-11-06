/**
 * BL-118 — dry run of the Instagram publisher: `npm run instagram:dry-run`.
 *   1. checks every post in content/social/instagram (slides 1080 × 1350 JPEG, alt text per slide, caption limits, meta.json);
 *   2. lists what the cron would publish now and next (approved posts only);
 *   3. makes read-only API calls (the account and the publishing quota) with the token from ~/.config/zauberlabs/instagram.env
 *      (IG_PAGE_TOKEN if present, else IG_ACCESS_TOKEN). Skip them with --offline.
 * It never publishes, never writes to Redis and never prints a token. Exit code 1 when a post is broken or a call fails.
 */
import { graphClient } from "../lib/instagram/graph";
import { duePosts, readQueue } from "../lib/instagram/queue";
import { describeToken, ENV_FILE, readEnvFile } from "./instagram-env.mjs";

const offline = process.argv.includes("--offline");
let failed = false;

const { posts, broken } = readQueue();
console.log(`Queue: ${posts.length} valid post(s), ${broken.length} broken`);
for (const p of posts) {
  console.log(`  ${p.status.padEnd(9)} ${p.id}  ${p.publishAt}  ${p.slides.length === 1 ? "single image" : `carousel of ${p.slides.length}`}, caption ${[...p.caption].length} chars`);
}
for (const b of broken) {
  failed = true;
  console.log(`  BROKEN    ${b.id}\n${b.problems.map((x) => `            - ${x}`).join("\n")}`);
}
const now = Date.now();
const due = duePosts(posts, now);
const next = posts.filter((p) => p.status === "approved" && p.publishAtMs > now).sort((a, b) => a.publishAtMs - b.publishAtMs)[0];
console.log(`Due now (approved, time passed): ${due.length ? due.map((p) => p.id).join(", ") : "none"}`);
console.log(`Next approved: ${next ? `${next.id} at ${next.publishAt}` : "none (all posts are drafts until the PO approves them)"}`);

if (!offline) {
  try {
    const env = readEnvFile();
    const token = env.IG_PAGE_TOKEN || env.IG_ACCESS_TOKEN;
    console.log(`Credentials (${ENV_FILE}): IG_USER_ID ${env.IG_USER_ID ? "set" : "missing"}, IG_PAGE_TOKEN ${describeToken(env.IG_PAGE_TOKEN)}, IG_ACCESS_TOKEN ${describeToken(env.IG_ACCESS_TOKEN)}`);
    if (!token || !env.IG_USER_ID) throw new Error("IG_USER_ID and a token are needed");
    const graph = graphClient(token, env.IG_USER_ID);
    const account = await graph.account();
    console.log(`Read-only call 1, account: @${account.username ?? "?"}, ${account.media_count ?? "?"} post(s) (token used: ${env.IG_PAGE_TOKEN ? "page token" : "user token"})`);
    const limit = (await graph.publishingLimit()).data?.[0];
    console.log(`Read-only call 2, publishing quota: ${limit?.quota_usage ?? "?"} of ${limit?.config?.quota_total ?? "?"} used in the last 24 h`);
  } catch (e) {
    failed = true;
    console.log(`API check failed: ${e instanceof Error ? e.message : e}`);
  }
}
console.log("Nothing was published.");
process.exit(failed ? 1 : 0);
