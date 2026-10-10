"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { hasInternalMarker } from "@/lib/internal-mode-client";

/**
 * Vercel Web Analytics (BL-008) with the BL-039 internal-mode filter: while the first-party marker cookie
 * "zl_internal=1" is set on this device, every page view and event is dropped before it is sent.
 * Client component because beforeSend is a function and cannot be passed from the server layout.
 */
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (typeof document !== "undefined" && hasInternalMarker(document.cookie)) return null;
  return event;
}

export default function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
