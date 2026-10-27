"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { hasInternalMarker, withoutQueryAndHash } from "@/lib/internal-mode-client";

/**
 * Vercel Web Analytics (BL-008) and Speed Insights (BL-082) with the BL-039 internal-mode filter: while the first-party
 * marker cookie "zl_internal=1" is set on this device, every page view, event and performance measurement is dropped
 * before it is sent. Client component because beforeSend is a function and cannot be passed from the server layout.
 */
const isInternal = () => typeof document !== "undefined" && hasInternalMarker(document.cookie);

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  return isInternal() ? null : event;
}

/**
 * Speed Insights calls this once per measurement (type "vital") just before sending; null drops it. The page address goes
 * without query and hash (data minimisation: no utm_ or filter parameters, no #anchors reach Vercel).
 */
function beforeSendVital<T extends { url: string }>(event: T): T | null {
  if (isInternal()) return null;
  const url = withoutQueryAndHash(event.url);
  return url ? { ...event, url } : null;
}

export default function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={beforeSend} />
      <SpeedInsights beforeSend={beforeSendVital} />
    </>
  );
}
