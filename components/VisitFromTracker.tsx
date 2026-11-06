"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { hasInternalMarker } from "@/lib/internal-mode-client";
import { VISIT_FROM_EVENT, visitFrom } from "@/lib/visit-from";

/**
 * BL-119 — sends "visit_from" { from: "instagram", page } once when a page loads with ?from=instagram (see lib/visit-from.ts).
 * Mounted once in the layout, so it runs on full page loads only. The PO's own devices (zl_internal) send nothing, here and
 * again in SiteAnalytics' beforeSend.
 */
export default function VisitFromTracker() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (hasInternalMarker(document.cookie)) return;
      const visit = visitFrom(location.search, location.pathname, document.referrer, location.host);
      if (!visit) return;
      // track() silently drops events until <Analytics> has set up window.va (it mounts inside a Suspense boundary, after
      // this effect on a page load), and only then is SiteAnalytics' beforeSend in place. So wait for it, at most 10 s.
      let tries = 0;
      const send = () => {
        if ((window as { va?: unknown }).va) track(VISIT_FROM_EVENT, visit);
        else if (++tries < 100) timer = setTimeout(send, 100);
      };
      send();
    } catch {
      // never break the page for a count
    }
    return () => clearTimeout(timer);
  }, []);
  return null;
}
