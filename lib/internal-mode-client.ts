/**
 * BL-039 — browser-safe part of the internal-mode switch (no node:crypto, no secret).
 * Kept separate from lib/internal-mode.ts so the client bundle never imports server code.
 */
export const INTERNAL_COOKIE = "zl_internal";
export const INTERNAL_COOKIE_VALUE = "1";

/** True when a cookie string (document.cookie or a Cookie header) carries the internal marker. */
export function hasInternalMarker(cookieHeader: string): boolean {
  return cookieHeader.split(";").some((part) => part.trim() === `${INTERNAL_COOKIE}=${INTERNAL_COOKIE_VALUE}`);
}
