import { getBlog } from "@/lib/blog";
import { dictionaries, isLocale, LOCALES } from "@/lib/i18n";

// RSS 2.0 per language. Served at /de/blog/feed.xml and /en/blog/feed.xml.
// Scheduled publishing (BL-004): re-rendered on Vercel at most every 5 minutes, so an article whose
// publish moment has passed appears by itself; no deploy, cron or agent needed.
export const revalidate = 300;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });
  const t = dictionaries[lang].blog;
  const xml = getBlog().rss(lang, { title: t.feedTitle, description: t.metaDescription });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
