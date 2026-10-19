"use client";

import { useEffect } from "react";
import { referrerHost, sendStat } from "@/lib/beacon-client";

const IDLE_MS = 15_000;

/**
 * BL-051 — counts one view of this article, and when the page is left or hidden for the first time,
 * how long it was actively read and whether the end of the text (#article-end) was on screen.
 * "Active" = tab visible and the reader scrolled, moved, touched or typed in the last 15 seconds.
 * Stores nothing in the browser.
 */
export default function ReadBeacon({ lang, slug }: { lang: string; slug: string }) {
  useEffect(() => {
    sendStat({ t: "v", l: lang, s: slug, r: referrerHost(document.referrer) });

    let seconds = 0;
    let lastActive = Date.now();
    let reachedEnd = false;
    let sent = false;
    const active = () => (lastActive = Date.now());
    const activity = ["scroll", "pointermove", "pointerdown", "keydown", "touchstart"] as const;
    activity.forEach((ev) => window.addEventListener(ev, active, { passive: true }));

    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastActive < IDLE_MS) seconds += 1;
    }, 1000);

    const end = document.getElementById("article-end");
    const io = end
      ? new IntersectionObserver((entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            reachedEnd = true;
            io?.disconnect();
          }
        })
      : null;
    if (end) io?.observe(end);

    const report = () => {
      if (sent) return;
      sent = true;
      sendStat({ t: "e", l: lang, s: slug, n: seconds, x: reachedEnd });
    };
    const onHide = () => document.visibilityState === "hidden" && report();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", report);

    return () => {
      report(); // client-side navigation to another page
      window.clearInterval(tick);
      io?.disconnect();
      activity.forEach((ev) => window.removeEventListener(ev, active));
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", report);
    };
  }, [lang, slug]);
  return null;
}
