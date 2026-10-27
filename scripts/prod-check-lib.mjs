/**
 * BL-058 — pure helpers for scripts/prod-check.mjs (kept separate so the tests can import them without a browser).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const INTERNAL_COOKIE = { name: "zl_internal", value: "1" };
export const DEFAULT_VIEWPORTS = ["1440x900", "390x844"];

/**
 * prod-check [--viewport WxH]... [--out DIR] [--full] [--wait MS] URL...
 * Returns { urls, viewports: [{ width, height }], out, full, wait } or throws with a usage message.
 */
export function parseArgs(argv) {
  const urls = [];
  const viewports = [];
  let out = "prod-check-shots";
  let full = false;
  let wait = 4000;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--viewport" || a === "-v") viewports.push(argv[++i]);
    else if (a === "--out" || a === "-o") out = argv[++i];
    else if (a === "--full") full = true;
    else if (a === "--wait") wait = Number(argv[++i]);
    else if (a === "--help" || a === "-h") throw new Error(USAGE);
    else if (a.startsWith("-")) throw new Error(`Unknown option ${a}\n\n${USAGE}`);
    else urls.push(a);
  }
  if (!urls.length) throw new Error(USAGE);
  if (!out) throw new Error(`--out needs a directory\n\n${USAGE}`);
  if (!Number.isFinite(wait) || wait < 0) throw new Error(`--wait needs milliseconds\n\n${USAGE}`);
  return { urls: urls.map(checkUrl), viewports: (viewports.length ? viewports : DEFAULT_VIEWPORTS).map(parseViewport), out, full, wait };
}

export const USAGE = `Usage: node scripts/prod-check.mjs [--viewport WxH]... [--out DIR] [--full] [--wait MS] URL...
  Opens each URL at each viewport in headless Chromium with the internal-mode cookie zl_internal=1 set for the URL's host
  before the first navigation, so nothing is counted (Vercel Web Analytics, our statistics), and saves a screenshot.
  Default viewports: ${DEFAULT_VIEWPORTS.join(", ")}. Default output folder: ./prod-check-shots (git-ignored).
  Example: node scripts/prod-check.mjs -v 1488x792 -v 390x844 https://www.zauberlabs.de/en https://www.zauberlabs.de/de/blog`;

export function parseViewport(v) {
  const m = /^(\d{3,4})x(\d{3,4})$/.exec(String(v ?? ""));
  if (!m) throw new Error(`Viewport must look like 1440x900, got "${v}"`);
  return { width: Number(m[1]), height: Number(m[2]) };
}

/** Only http(s) URLs; returns the normalised string. */
export function checkUrl(u) {
  let url;
  try {
    url = new URL(u);
  } catch {
    throw new Error(`Not a URL: ${u}`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error(`Only http(s) URLs: ${u}`);
  return url.toString();
}

/** One cookie per distinct host in the list (production, a preview, localhost); the marker is harmless everywhere. */
export function cookiesFor(urls) {
  const hosts = [...new Set(urls.map((u) => new URL(u).hostname))];
  return hosts.map((domain) => ({ ...INTERNAL_COOKIE, domain, path: "/" }));
}

/** "https://www.zauberlabs.de/de/blog?x=1" + 390x844 → "www.zauberlabs.de_de-blog_390x844.png" */
export function shotName(u, { width, height }) {
  const url = new URL(u);
  const p = (url.pathname + url.search).replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "home";
  return `${url.hostname}_${p}_${width}x${height}.png`;
}

/** The marker as the page itself sees it (document.cookie). */
export const hasMarker = (cookieString) => String(cookieString ?? "").split(";").some((c) => c.trim() === "zl_internal=1");

/** Headless Chromium must keep its default UA so the server-side filter also catches it (BL-058 rule b). */
export const isHeadlessUa = (ua) => /HeadlessChrome\//.test(String(ua ?? ""));

/**
 * A request that would count this visit (BL-058 guard, BL-082). On Vercel the analytics endpoints sit under a per-project
 * random prefix (e.g. /4af0a58b770e44fd/view), not only under /_vercel/…, so match the endpoint names, not the prefix:
 * Web Analytics view/event/session, Speed Insights vitals (also on vitals.vercel-insights.com) and our own /api/m.
 * Script loads (…/script.js) are not counted.
 */
export function isCountingRequest(u) {
  let url;
  try {
    url = new URL(u);
  } catch {
    return false;
  }
  const p = url.pathname;
  return (
    p === "/api/m" ||
    /^\/(?:_vercel\/insights|[0-9a-f]{16})\/(?:view|event|session)$/.test(p) ||
    /^\/(?:_vercel|[0-9a-f]{16})\/speed-insights\/vitals$/.test(p) ||
    url.hostname === "vitals.vercel-insights.com" ||
    (url.hostname === "va.vercel-scripts.com" && /\/(?:view|event|session|vitals)$/.test(p))
  );
}

/** Chrome binary: $CHROME_PATH, else Playwright's cached headless shell / Chromium, else a system Chrome. */
export function findChrome(env = process.env) {
  if (env.CHROME_PATH) return env.CHROME_PATH;
  const cache = path.join(env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), ".cache", "ms-playwright"));
  const candidates = [];
  if (fs.existsSync(cache)) {
    for (const dir of fs.readdirSync(cache).sort().reverse()) {
      if (dir.startsWith("chromium_headless_shell-")) {
        for (const sub of ["chrome-headless-shell-linux64", "chrome-linux"]) candidates.push(path.join(cache, dir, sub, "chrome-headless-shell"));
      }
      if (dir.startsWith("chromium-")) candidates.push(path.join(cache, dir, "chrome-linux", "chrome"), path.join(cache, dir, "chrome-linux64", "chrome"));
    }
  }
  candidates.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  return candidates.find((c) => fs.existsSync(c)) ?? null;
}
