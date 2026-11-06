import { e46Url, type Locale } from "@/lib/i18n";
import type { Post } from "./queue";

/**
 * BL-118 (PO 2026-11-06) — the link-in-bio page /<lang>/links: the latest Instagram posts as tiles, each opening the post's
 * target. Built from the queue, so it needs no Instagram API call and no Redis read: a post counts as out once it is approved
 * and its time has passed (the publisher posts it at that run). Before the first post is out, the scheduled approved ones
 * show. Drafts never show (their slides are private, see app/social/instagram/…).
 */
export const LINKS_MAX = 12;
export const FROM = "from=instagram";

export type Tile = { id: string; headline: string; img: string; alt: string; href: string; external: boolean; scheduled: boolean };

/** Where a post's tile leads, with from=instagram; E46BUILD and the article in the page's language. */
export function linkHref(link: Post["link"], lang: Locale): { href: string; external: boolean } {
  if (link?.startsWith("blog/")) return { href: `/${lang}/${link}?${FROM}`, external: false };
  if (link === "vote") return { href: `/${lang}?${FROM}#next`, external: false };
  return { href: e46Href(lang), external: true };
}

/** E46BUILD's start page in this language, with from=instagram ("https://e46.zauberlabs.de/?from=…", ".../de?from=…"). */
export const e46Href = (lang: Locale) => `${e46Url(lang).replace(/\/+$/, "")}${lang === "de" ? "" : "/"}?${FROM}`;

/** The headline on the tile: meta.json "headline", else the quoted part of the title, else the title. */
export function headlineOf(post: Post): string {
  return post.headline ?? /"([^"]+)"/.exec(post.title ?? "")?.[1] ?? post.title ?? post.id;
}

export function linkTiles(posts: Post[], lang: Locale, now: number): Tile[] {
  const approved = posts.filter((p) => p.status !== "draft");
  const out = approved.filter((p) => p.publishAtMs <= now).sort((a, b) => b.publishAtMs - a.publishAtMs);
  const list = out.length ? out : approved.filter((p) => p.publishAtMs > now).sort((a, b) => a.publishAtMs - b.publishAtMs);
  return list.slice(0, LINKS_MAX).map((p) => ({
    id: p.id,
    headline: headlineOf(p),
    img: `/social/instagram/${p.id}/${p.slides[0].file}`,
    alt: p.slides[0].alt,
    ...linkHref(p.link, lang),
    scheduled: p.publishAtMs > now,
  }));
}
