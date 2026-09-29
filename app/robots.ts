import type { MetadataRoute } from "next";

// Served at /robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: "https://www.zauberlabs.de/sitemap.xml",
  };
}
