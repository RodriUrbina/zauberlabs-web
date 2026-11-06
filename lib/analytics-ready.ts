/**
 * BL-120 — run `fn` once Vercel Web Analytics is ready. track() silently drops an event while window.va does not exist yet,
 * and on a page load <Analytics> (components/SiteAnalytics.tsx) sets it up inside a Suspense boundary, after the page's own
 * mount effects; only then is its beforeSend (internal-mode filter) in place too. So an event sent from a mount effect waits
 * here, in 100 ms steps, at most `tries` × 100 ms; after that it is given up. Returns a cancel function for effect clean-up.
 */
export function whenAnalyticsReady(fn: () => void, tries = 100, win: { va?: unknown } = typeof window === "undefined" ? {} : (window as { va?: unknown })): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let left = tries;
  const attempt = () => {
    if (win.va) fn();
    else if (--left > 0) timer = setTimeout(attempt, 100);
  };
  attempt();
  return () => clearTimeout(timer);
}
