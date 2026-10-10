import { timingSafeEqual } from "node:crypto";
import { INTERNAL_COOKIE, INTERNAL_COOKIE_VALUE, hasInternalMarker } from "./internal-mode-client";

export { INTERNAL_COOKIE, INTERNAL_COOKIE_VALUE, hasInternalMarker };

/**
 * BL-039 — "internal mode": the PO's own devices are excluded from Vercel Web Analytics.
 *
 * Opening /api/internal-mode?k=<secret> once per device and browser sets a first-party marker cookie;
 * the Analytics beforeSend callback (components/SiteAnalytics.tsx) drops every event while it is present.
 * The secret lives only in the server env var ZL_INTERNAL_SECRET and is never shipped to the browser.
 * Visits counted before the marker was set stay counted.
 */

/** Two years; the marker is re-set whenever the PO opens the URL again. */
export const INTERNAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 730;
/** A secret shorter than this is treated as unset, so a typo in the env var cannot open the switch to guessing. */
export const MIN_SECRET_LENGTH = 24;

/** Constant-time comparison of the given key with the configured secret. False when no usable secret is set. */
export function isValidInternalKey(given: string | null | undefined, secret: string | null | undefined): boolean {
  if (!secret || secret.length < MIN_SECRET_LENGTH || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
