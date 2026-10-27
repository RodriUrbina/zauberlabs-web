import type { MetadataRoute } from "next";
import { getBlog } from "@/lib/blog";
import { SHOP_LAUNCHED } from "@/lib/shop-flag";

const BASE = "https://www.zauberlabs.de";

// Served at /sitemap.xml — submit this URL in Google Search Console.
// Scheduled publishing (BL-004): re-rendered on Vercel at most every 5 minutes, so an article whose
// publish moment has passed appears by itself; no deploy, cron or agent needed.
export const revalidate = 300;
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number) => ({
    url: `${BASE}/de${path}`,
    lastModified: now,
    priority,
    alternates: { languages: { de: `${BASE}/de${path}`, en: `${BASE}/en${path}` } },
  });
  const en = (path: string, priority: number) => ({
    url: `${BASE}/en${path}`,
    lastModified: now,
    priority,
    alternates: { languages: { de: `${BASE}/de${path}`, en: `${BASE}/en${path}` } },
  });
  // Impressum/Datenschutz are noindex, so they stay out of the sitemap.
  // Blog: index + tag pages per language; articles only in the languages they exist in; drafts excluded on production.
  // BL-084: the fan shop only once it is launched (lib/shop-flag.ts); its legal pages stay out, like Impressum/Datenschutz.
  const shop = SHOP_LAUNCHED ? [page("/shop", 0.6), en("/shop", 0.5)] : [];
  return [page("", 1), en("", 0.9), ...shop, ...getBlog().sitemapEntries()];
}
