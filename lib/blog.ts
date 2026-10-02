import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { LOCALES, type Locale } from "./i18n";
import { parseFrontMatter, type FrontMatter } from "./blog-schema";

/**
 * Build-time loader for content/blog/<slug>/<lang>.mdx.
 * Server-only (reads the file system). Pure functions, no Next imports, so it is unit-testable with Node.
 */

export const SITE_URL = "https://www.zauberlabs.de";
export const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export type Post = {
  slug: string;
  lang: Locale;
  meta: FrontMatter;
  /** MDX body without front matter. */
  body: string;
  readingMinutes: number;
};

export type Resolved = {
  post: Post;
  /** true when the article is shown in a language it does not exist in (the other language's file is used). */
  fallback: boolean;
  /** Languages the article actually exists in. */
  available: Locale[];
};

export type Tag = { slug: string; name: string; count: number };

export type BlogOptions = {
  dir?: string;
  includeDrafts?: boolean;
};

/** Drafts are hidden on the live site only; previews (Vercel "preview") and local runs show them. */
export function shouldShowDrafts(env: Record<string, string | undefined> = process.env): boolean {
  if (env.BLOG_SHOW_DRAFTS === "1") return true;
  if (env.BLOG_SHOW_DRAFTS === "0") return false;
  return env.VERCEL_ENV !== "production";
}

export const tagSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function readingMinutes(body: string): number {
  const words = body
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_#>\[\]()!-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export const otherLocale = (lang: Locale): Locale => (lang === "de" ? "en" : "de");
export const blogUrl = (lang: Locale) => `${SITE_URL}/${lang}/blog`;
export const postUrl = (lang: Locale, slug: string) => `${SITE_URL}/${lang}/blog/${slug}`;
export const tagUrl = (lang: Locale, tag: string) => `${SITE_URL}/${lang}/blog/tag/${tagSlug(tag)}`;
export const feedUrl = (lang: Locale) => `${SITE_URL}/${lang}/blog/feed.xml`;

function loadPosts(dir: string): Map<string, Partial<Record<Locale, Post>>> {
  const out = new Map<string, Partial<Record<Locale, Post>>>();
  if (!fs.existsSync(dir)) return out;
  const errors: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const slug = entry.name;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.push(`content/blog/${slug}: folder name must be a slug (lowercase letters, digits, hyphens)`);
      continue;
    }
    const byLang: Partial<Record<Locale, Post>> = {};
    for (const lang of LOCALES) {
      const file = path.join(dir, slug, `${lang}.mdx`);
      if (!fs.existsSync(file)) continue;
      try {
        const { data, content } = matter(fs.readFileSync(file, "utf8"));
        const rel = `content/blog/${slug}/${lang}.mdx`;
        const meta = parseFrontMatter(data, rel);
        if (meta.lang && meta.lang !== lang) throw new Error(`${rel}: front matter says lang "${meta.lang}" but the file is ${lang}.mdx`);
        if (meta.slug && meta.slug !== slug) throw new Error(`${rel}: front matter says slug "${meta.slug}" but the folder is ${slug}`);
        byLang[lang] = { slug, lang, meta, body: content, readingMinutes: readingMinutes(content) };
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    if (Object.keys(byLang).length) out.set(slug, byLang);
  }
  if (errors.length) throw new Error(`Blog content errors:\n\n${errors.join("\n\n")}`);
  return out;
}

export function createBlog(opts: BlogOptions = {}) {
  const dir = opts.dir ?? CONTENT_DIR;
  const includeDrafts = opts.includeDrafts ?? shouldShowDrafts();
  const all = loadPosts(dir);

  const visible = (p: Post | undefined): p is Post => !!p && (includeDrafts || !p.meta.draft);

  /** Resolves an article for a language, falling back to the other language. null = does not exist at all. */
  function getPost(slug: string, lang: Locale): Resolved | null {
    const byLang = all.get(slug);
    if (!byLang) return null;
    const available = LOCALES.filter((l) => visible(byLang[l]));
    if (!available.length) return null;
    const own = byLang[lang];
    if (visible(own)) return { post: own, fallback: false, available };
    const other = byLang[otherLocale(lang)];
    if (visible(other)) return { post: other, fallback: true, available };
    return null;
  }

  function slugs(): string[] {
    return [...all.keys()].filter((slug) => LOCALES.some((l) => visible(all.get(slug)?.[l])));
  }

  /** Newest first. Includes articles that only exist in the other language (marked by `fallback`). */
  function listPosts(lang: Locale, filter: { tag?: string } = {}): Resolved[] {
    const items = slugs()
      .map((slug) => getPost(slug, lang))
      .filter((r): r is Resolved => r !== null);
    const wanted = filter.tag ? tagSlug(filter.tag) : null;
    const filtered = wanted ? items.filter((r) => r.post.meta.tags.some((t) => tagSlug(t) === wanted)) : items;
    return filtered.sort((a, b) => (a.post.meta.date < b.post.meta.date ? 1 : a.post.meta.date > b.post.meta.date ? -1 : a.post.slug.localeCompare(b.post.slug)));
  }

  function listTags(lang: Locale): Tag[] {
    const map = new Map<string, Tag>();
    for (const { post } of listPosts(lang)) {
      for (const name of post.meta.tags) {
        const s = tagSlug(name);
        const cur = map.get(s);
        if (cur) cur.count += 1;
        else map.set(s, { slug: s, name, count: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  function getTag(lang: Locale, slug: string): Tag | null {
    return listTags(lang).find((t) => t.slug === slug) ?? null;
  }

  /** Entries for app/sitemap.ts: index + tag pages per language, articles only in the languages they exist in. */
  function sitemapEntries(): { url: string; lastModified: Date; priority: number; alternates?: { languages: Record<string, string> } }[] {
    const entries: ReturnType<typeof sitemapEntries> = [];
    const newest = (lang: Locale) => listPosts(lang)[0]?.post.meta;
    for (const lang of LOCALES) {
      const n = newest(lang);
      entries.push({
        url: blogUrl(lang),
        lastModified: new Date(n ? (n.updated ?? n.date) : 0),
        priority: 0.8,
        alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, blogUrl(l)])) },
      });
      for (const tag of listTags(lang)) {
        entries.push({
          url: tagUrl(lang, tag.name),
          lastModified: new Date(n ? (n.updated ?? n.date) : 0),
          priority: 0.5,
          alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, tagUrl(l, tag.name)])) },
        });
      }
    }
    for (const slug of slugs()) {
      const byLang = all.get(slug)!;
      const available = LOCALES.filter((l) => visible(byLang[l]));
      const languages = Object.fromEntries(available.map((l) => [l, postUrl(l, slug)]));
      for (const lang of available) {
        const m = byLang[lang]!.meta;
        entries.push({ url: postUrl(lang, slug), lastModified: new Date(m.updated ?? m.date), priority: 0.7, alternates: { languages } });
      }
    }
    return entries;
  }

  /** RSS 2.0 for one language: only articles that exist in that language. */
  function rss(lang: Locale, channel: { title: string; description: string }): string {
    const items = listPosts(lang)
      .filter((r) => !r.fallback)
      .map(({ post }) => {
        const url = postUrl(lang, post.slug);
        return [
          "    <item>",
          `      <title>${esc(post.meta.title)}</title>`,
          `      <link>${esc(url)}</link>`,
          `      <guid isPermaLink="true">${esc(url)}</guid>`,
          `      <pubDate>${new Date(post.meta.date).toUTCString()}</pubDate>`,
          `      <description>${esc(post.meta.description)}</description>`,
          ...post.meta.tags.map((t) => `      <category>${esc(t)}</category>`),
          "    </item>",
        ].join("\n");
      });
    const own = listPosts(lang).filter((r) => !r.fallback);
    const lastBuild = own.length ? new Date(own[0].post.meta.updated ?? own[0].post.meta.date) : new Date(0);
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
      "  <channel>",
      `    <title>${esc(channel.title)}</title>`,
      `    <link>${esc(blogUrl(lang))}</link>`,
      `    <description>${esc(channel.description)}</description>`,
      `    <language>${lang}</language>`,
      `    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>`,
      `    <atom:link href="${esc(feedUrl(lang))}" rel="self" type="application/rss+xml" />`,
      ...items,
      "  </channel>",
      "</rss>",
      "",
    ].join("\n");
  }

  return { getPost, listPosts, listTags, getTag, slugs, sitemapEntries, rss, includeDrafts };
}

export type Blog = ReturnType<typeof createBlog>;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

let singleton: Blog | null = null;
/** The site's blog, loaded once per process (build or server). */
export function getBlog(): Blog {
  if (!singleton) singleton = createBlog();
  return singleton;
}

/** Formats YYYY-MM-DD for display in the page language. */
export function formatDate(iso: string, lang: Locale): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
