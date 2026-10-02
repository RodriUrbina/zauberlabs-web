#!/usr/bin/env node
/**
 * Smoke test: production build, start on a free port (default 3010), request every blog route,
 * assert status + markers, stop the server. Never touches a port that is already in use.
 *
 *   npm run smoke                 # build + start on 3010
 *   SMOKE_PORT=3015 npm run smoke
 *   SMOKE_SKIP_BUILD=1 npm run smoke   # reuse the existing .next build
 */
import { spawn } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.SMOKE_PORT ?? 3010);
// Run the Next binary directly (not through npx) so the process we kill IS the server, not a wrapper around it.
const NEXT_BIN = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const BASE = `http://127.0.0.1:${PORT}`;
const env = { ...process.env, BLOG_SHOW_DRAFTS: "1", NEXT_TELEMETRY_DISABLED: "1" };

const slugs = fs
  .readdirSync(path.join(process.cwd(), "content", "blog"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const slug = slugs.includes("sample-not-for-publication") ? "sample-not-for-publication" : slugs[0];
if (!slug) fail("no article folder in content/blog");
const hasDe = fs.existsSync(path.join("content", "blog", slug, "de.mdx"));
const hasEn = fs.existsSync(path.join("content", "blog", slug, "en.mdx"));

await assertPortFree(PORT);

if (!process.env.SMOKE_SKIP_BUILD) {
  console.log("▶ next build");
  await run(process.execPath, [NEXT_BIN, "build"]);
}

console.log(`▶ next start -p ${PORT}`);
const server = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], { env, stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
const stop = () => {
  if (!server.killed) server.kill("SIGTERM");
};
server.on("exit", () => {
  /* server gone */
});
process.on("exit", stop);
process.on("SIGINT", () => {
  stop();
  process.exit(130);
});

await waitFor(`${BASE}/robots.txt`, 60_000);

const checks = [
  { path: "/en/blog", status: 200, markers: ['rel="canonical" href="https://www.zauberlabs.de/en/blog"', 'hrefLang="de"', 'hrefLang="en"', "application/rss+xml", '"@type":"CollectionPage"'] },
  { path: "/de/blog", status: 200, markers: ['rel="canonical" href="https://www.zauberlabs.de/de/blog"', 'hrefLang="en"'] },
  { path: `/en/blog/${slug}`, status: 200, markers: ['"@type":"Article"', '"@type":"BreadcrumbList"', 'property="og:type" content="article"', 'rel="canonical"', "Sources", "cta-title"] },
  {
    path: `/de/blog/${slug}`,
    status: 200,
    markers: hasDe
      ? ['rel="canonical" href="https://www.zauberlabs.de/de/blog/']
      : ["Dieser Artikel ist bisher nur auf Englisch verfügbar.", `rel="canonical" href="https://www.zauberlabs.de/en/blog/${slug}"`],
  },
  { path: "/en/blog/tag/e46", status: 200, markers: ['rel="canonical" href="https://www.zauberlabs.de/en/blog/tag/e46"', 'aria-current="page"'] },
  { path: "/en/blog/tag/does-not-exist", status: 404, markers: [] },
  { path: "/en/blog/does-not-exist", status: 404, markers: [] },
  { path: "/en/blog/feed.xml", status: 200, markers: ["<rss", "<channel>", "Zauberlabs Blog"], contentType: "application/rss+xml" },
  { path: "/de/blog/feed.xml", status: 200, markers: ["<rss", "<language>de</language>"], contentType: "application/rss+xml" },
  { path: "/sitemap.xml", status: 200, markers: ["https://www.zauberlabs.de/en/blog</loc>", "https://www.zauberlabs.de/en/blog/tag/e46</loc>", `https://www.zauberlabs.de/en/blog/${slug}</loc>`] },
  { path: "/robots.txt", status: 200, markers: ["Sitemap: https://www.zauberlabs.de/sitemap.xml"] },
  { path: "/en", status: 200, markers: ['href="/en/blog"'] },
  { path: "/de", status: 200, markers: ['href="/de/blog"'] },
];
if (!hasEn) checks.splice(2, 1);

let failed = 0;
for (const c of checks) {
  const res = await fetch(`${BASE}${c.path}`, { redirect: "manual" });
  const body = await res.text();
  const problems = [];
  if (res.status !== c.status) problems.push(`status ${res.status} (expected ${c.status})`);
  if (c.contentType && !(res.headers.get("content-type") ?? "").startsWith(c.contentType)) problems.push(`content-type ${res.headers.get("content-type")}`);
  for (const m of c.markers) if (!body.includes(m)) problems.push(`missing ${JSON.stringify(m)}`);
  const ok = problems.length === 0;
  if (!ok) failed += 1;
  console.log(`${ok ? "✓" : "✗"} ${c.path} ${ok ? "" : "— " + problems.join("; ")}`);
}

stop();
if (failed) {
  console.error(`\n${failed} check(s) failed.\n--- server log ---\n${serverLog.slice(-4000)}`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed on port ${PORT}.`);
process.exit(0);

// ─── helpers ─────────────────────────────────────────────────────────────────

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function assertPortFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => fail(`port ${port} is in use. Never stop another agent's server; run with SMOKE_PORT=<free port>.`));
    s.listen(port, "127.0.0.1", () => s.close(resolve));
  });
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env, stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`))));
  });
}

async function waitFor(url, timeoutMs) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  stop();
  fail(`server did not answer within ${timeoutMs / 1000}s\n${serverLog.slice(-2000)}`);
}
