import type { Blog } from "./blog";
import type { Locale } from "./i18n";

/**
 * BL-106 — the blog half of the footer's "Popular topics": every published article of the language (the blog loader's
 * visibility, so drafts and scheduled articles stay out on production and new ones appear by themselves), grouped by topic.
 * An article sits in one group only: the first of its tags that names a topic (after "E46"); an article whose first such
 * tag is "buying guide", "History" or "glossary", or that has none, goes to "Buying & history".
 */
export const BLOG_TOPICS = [
  { key: "headlights", label: { en: "Headlights", de: "Scheinwerfer" }, tags: ["headlights"] },
  { key: "wheels", label: { en: "Wheels", de: "Felgen" }, tags: ["wheels"] },
  { key: "bumpers", label: { en: "Bumpers", de: "Stoßstangen" }, tags: ["bumpers"] },
  { key: "seats", label: { en: "Seats", de: "Sitze" }, tags: ["seats"] },
  { key: "steering", label: { en: "Steering wheels", de: "Lenkräder" }, tags: ["steering wheels", "steering wheel"] },
  { key: "buying", label: { en: "Buying & history", de: "Kauf & Geschichte" }, tags: ["buying guide", "history", "glossary"] },
] as const;

export type BlogTopicKey = (typeof BLOG_TOPICS)[number]["key"];

/** The group an article belongs to, from its tags in their written order. */
export function blogTopicOf(tags: string[]): BlogTopicKey {
  for (const tag of tags) {
    const t = tag.toLowerCase();
    const hit = BLOG_TOPICS.find((g) => (g.tags as readonly string[]).includes(t));
    if (hit) return hit.key;
  }
  return "buying";
}

/** Groups in BLOG_TOPICS order, newest article first; empty groups are left out. Fallback pages (other language) are not listed. */
export function footerBlogTopics(blog: Blog, lang: Locale) {
  const posts = blog.listPosts(lang).filter((r) => !r.fallback);
  return BLOG_TOPICS.map((g) => ({
    key: g.key,
    label: g.label[lang],
    posts: posts.filter((r) => blogTopicOf(r.post.meta.tags) === g.key).map((r) => ({ slug: r.post.slug, title: r.post.meta.title })),
  })).filter((g) => g.posts.length > 0);
}
