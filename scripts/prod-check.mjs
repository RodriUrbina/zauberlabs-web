#!/usr/bin/env node
/**
 * BL-058 (PO decision 2026-10-20) — production checks that are never counted.
 *
 *   node scripts/prod-check.mjs [--viewport WxH]... [--out DIR] [--full] [--wait MS] URL...
 *
 * Opens each URL at each viewport in headless Chromium and saves a screenshot. Before the FIRST navigation it sets the
 * internal-mode cookie zl_internal=1 for every host in the list (BL-039: Vercel Web Analytics and our own statistics
 * drop such visits) and refuses to navigate if the cookie is not in place. It keeps Chromium's default "HeadlessChrome"
 * User-Agent, so the server-side bot filter of our statistics catches it too, and refuses to run with any other UA.
 * No dependencies: Chrome DevTools protocol over WebSocket. Chrome: $CHROME_PATH or Playwright's cached browsers.
 * See README "Agent rules: production checks".
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { cookiesFor, findChrome, hasMarker, isCountingRequest, isHeadlessUa, parseArgs, shotName } from "./prod-check-lib.mjs";

// Node 20 has WebSocket only behind a flag; re-run this script with it.
if (typeof WebSocket === "undefined") {
  const child = spawn(process.execPath, ["--experimental-websocket", "--no-warnings", ...process.argv.slice(1)], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 1));
} else {
  main().catch((err) => {
    console.error(`✗ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const chrome = findChrome();
  if (!chrome || !fs.existsSync(chrome)) {
    throw new Error(`No Chrome found${chrome ? ` at ${chrome}` : ""}. Set CHROME_PATH or install Playwright's browsers (npx playwright install chromium-headless-shell).`);
  }
  fs.mkdirSync(opts.out, { recursive: true });

  const port = 9222 + Math.floor(Math.random() * 600);
  const browser = spawn(chrome, ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--mute-audio", `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
  let browserError = null;
  browser.on("error", (err) => (browserError = err));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    let targets;
    for (let i = 0; i < 75 && !targets; i++) {
      try {
        targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      } catch {
        await sleep(200);
      }
    }
    const page = targets?.find((t) => t.type === "page");
    if (!page) throw new Error(`Chrome did not start${browserError ? `: ${browserError.message}` : ""}`);
    const cdp = await connect(page.webSocketDebuggerUrl);

    // Belt and braces: any analytics or statistics request leaving the page means the marker did not work.
    const counted = [];
    cdp.on("Network.requestWillBeSent", ({ request }) => {
      if (isCountingRequest(request.url)) counted.push(request.url);
    });

    await cdp.send("Network.enable");
    await cdp.send("Page.enable");

    // 1. The UA must stay the headless default (rule b).
    const ua = (await cdp.send("Runtime.evaluate", { expression: "navigator.userAgent", returnByValue: true })).result.value;
    if (!isHeadlessUa(ua)) throw new Error(`User-Agent is not the HeadlessChrome default: ${ua}`);

    // 2. The internal marker for every host, before the first navigation (rule a); verified, or nothing is opened.
    for (const c of cookiesFor(opts.urls)) await cdp.send("Network.setCookie", c);
    const { cookies } = await cdp.send("Network.getCookies", { urls: opts.urls });
    for (const u of opts.urls) {
      const host = new URL(u).hostname;
      if (!cookies.some((c) => c.name === "zl_internal" && c.value === "1" && host.endsWith(c.domain.replace(/^\./, "")))) {
        throw new Error(`Internal-mode cookie not set for ${host}; nothing was opened.`);
      }
    }
    console.log(`✓ zl_internal=1 set for ${[...new Set(opts.urls.map((u) => new URL(u).hostname))].join(", ")} · UA ${ua.match(/HeadlessChrome\/\S+/)[0]}`);

    // 3. Screenshots.
    for (const { width, height } of opts.viewports) {
      await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 500 });
      for (const url of opts.urls) {
        const nav = await cdp.send("Page.navigate", { url });
        if (nav.errorText) throw new Error(`${url}: ${nav.errorText}`);
        await sleep(opts.wait);
        const seen = (await cdp.send("Runtime.evaluate", { expression: "document.cookie", returnByValue: true })).result.value;
        if (!hasMarker(seen)) throw new Error(`${url}: the page does not see zl_internal=1; stopping.`);
        if (counted.length) throw new Error(`${url}: a counting request was sent despite the marker (${counted[0]}); stopping.`);
        let clip;
        if (opts.full) {
          const { cssContentSize } = await cdp.send("Page.getLayoutMetrics");
          clip = { x: 0, y: 0, width, height: Math.ceil(cssContentSize.height), scale: 1 };
        }
        const shot = await cdp.send("Page.captureScreenshot", { format: "png", ...(clip ? { clip, captureBeyondViewport: true } : {}) });
        const file = path.join(opts.out, shotName(url, { width, height }));
        fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
        console.log(`✓ ${width}x${height}  ${url}  →  ${file}`);
      }
    }
    // Speed Insights (BL-082) sends its measurements when the page is hidden or left; leave the last page and check once more.
    await cdp.send("Page.navigate", { url: "about:blank" });
    await sleep(1000);
    if (counted.length) throw new Error(`a counting request was sent despite the marker (${counted[0]}); stopping.`);
    console.log("✓ no analytics or statistics request was sent");
    cdp.close();
  } finally {
    browser.kill();
  }
}

/** Minimal Chrome DevTools protocol client: send(method, params) → result, rejects on protocol errors. */
async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error("Could not connect to Chrome"));
  });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.method) for (const fn of listeners.get(d.method) ?? []) fn(d.params);
    const p = d.id && pending.get(d.id);
    if (!p) return;
    pending.delete(d.id);
    if (d.error) p.reject(new Error(`${p.method}: ${d.error.message}`));
    else p.resolve(d.result);
  };
  return {
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const i = ++id;
        pending.set(i, { resolve, reject, method });
        ws.send(JSON.stringify({ id: i, method, params }));
      }),
    on: (method, fn) => listeners.set(method, [...(listeners.get(method) ?? []), fn]),
    close: () => ws.close(),
  };
}
