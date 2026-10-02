import type { Hero } from "./blog-schema";
import { dictionaries, type Locale } from "./i18n";
import { SITE_URL } from "./blog";

export const SITE_OG_IMAGE = "/images/hero.jpg";

/**
 * The social-share image of an article (og:image / twitter:image).
 * With a hero image: that image and its alt. Without one: the site hero image with the
 * site's own alt text, never the article's placeholder alt (BL-005).
 */
export function articleOgImage(hero: Hero, lang: Locale): { url: string; alt: string } {
  if (hero.src) return { url: `${SITE_URL}${hero.src}`, alt: hero.alt };
  return { url: `${SITE_URL}${SITE_OG_IMAGE}`, alt: dictionaries[lang].hero.heroAlt };
}
