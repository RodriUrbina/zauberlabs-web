/**
 * BL-051 — browser side of our own statistics. Sends one small JSON message to /api/m.
 * Never sends anything from devices in internal mode (BL-039), and nothing that identifies the reader.
 */
import { hasInternalMarker } from "./internal-mode-client";

export type BeaconPayload =
  | { t: "v"; l: string; s: string; r: string }
  | { t: "e"; l: string; s: string; n: number; x: boolean }
  | { t: "k"; c: string };

export function sendStat(payload: BeaconPayload): void {
  if (typeof navigator === "undefined" || hasInternalMarker(document.cookie)) return;
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/m", body)) return;
  } catch {}
  fetch("/api/m", { method: "POST", body, keepalive: true, credentials: "same-origin" }).catch(() => {});
}

/** Only the host of the page the reader came from; path and query never leave the browser. */
export function referrerHost(referrer: string): string {
  try {
    return referrer ? new URL(referrer).host : "";
  } catch {
    return "";
  }
}
