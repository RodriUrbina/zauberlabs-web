"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { E46_URL } from "@/lib/i18n";
import { CONFIGURATOR_CLICK_EVENT, configuratorFor, configuratorHosts } from "@/lib/configurator-click";
import { sendStat } from "@/lib/beacon-client";

/**
 * BL-050 — counts clicks on configurator links as a Vercel Web Analytics custom event:
 * "configurator_click" with only { configurator: "e46" }. One listener for the whole page, so the
 * server-rendered links stay as they are. Goes through the same beforeSend as page views
 * (components/SiteAnalytics.tsx), so the PO's own devices are excluded (BL-039).
 */
export default function ConfiguratorClickTracker() {
  useEffect(() => {
    const hosts = configuratorHosts(E46_URL);
    const onClick = (e: MouseEvent) => {
      if (e.type === "auxclick" && e.button !== 1) return; // auxclick: middle button (new tab) only
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement)) return;
      const configurator = configuratorFor(a.href, hosts);
      if (!configurator) return;
      track(CONFIGURATOR_CLICK_EVENT, { configurator });
      sendStat({ t: "k", c: configurator }); // BL-051: our own daily click counter
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);
  return null;
}
