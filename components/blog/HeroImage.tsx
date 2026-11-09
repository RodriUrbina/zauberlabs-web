import Image from "next/image";
import type { Hero } from "@/lib/blog-schema";
import { dictionaries, type Locale } from "@/lib/i18n";
import HERO_SIZES from "@/lib/blog-image-sizes.json";

/**
 * Hero with credit line. With no image yet (hero.src = null) nothing is rendered; never a third-party picture.
 * BL-127 (PO 2026-11-09: no blog image may appear cropped) — the whole picture always shows:
 *   - fit "natural" (the article): the picture at its own ratio, its size from lib/blog-image-sizes.json; like <Figure>, a tall
 *     picture is capped at 75 % of the screen height and centred on a light neutral ground.
 *   - fit "contain" (the cards on /blog): the card's 16:9 box with the whole picture contained in it on the same ground.
 * BL-101's `hero.position` (a focal point for the old 16:9 crop) has nothing left to do and is no longer applied.
 */
/** BL-101: the old focal point as CSS; kept for the front matter's sake, no longer used by the hero (BL-127). */
export const heroFocus = (hero: Pick<Hero, "position">): { style?: { objectPosition: string } } => (hero.position ? { style: { objectPosition: hero.position } } : {});

const SIZES: Record<string, number[]> = HERO_SIZES;

export default function HeroImage({
  hero,
  lang,
  priority = false,
  sizes = "(min-width: 820px) 760px, 100vw",
  className = "",
  fit = "natural",
}: {
  hero: Hero;
  lang: Locale;
  priority?: boolean;
  sizes?: string;
  className?: string;
  fit?: "natural" | "contain";
}) {
  const t = dictionaries[lang].blog;
  // No licensed image yet: render nothing (PO decision 2026-10-02). The front-matter brief stays in the file, unseen.
  if (!hero.src) return null;
  const size = SIZES[hero.src];
  return (
    <figure className={className}>
      {fit === "contain" ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-ink/[0.04]">
          <Image src={hero.src} alt={hero.alt} fill priority={priority} sizes={sizes} className="object-contain" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-ink/[0.04]">
          {size ? (
            <Image src={hero.src} alt={hero.alt} width={size[0]} height={size[1]} priority={priority} sizes={sizes} className="mx-auto block h-auto max-h-[75vh] w-auto max-w-full" />
          ) : (
            // A hero without a recorded size (should not happen; the test keeps the list complete): still the whole picture.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.src} alt={hero.alt} className="mx-auto block h-auto max-h-[75vh] w-auto max-w-full" />
          )}
        </div>
      )}
      {(hero.credit || hero.licence) && (
        <figcaption className="mt-3 font-mono text-[11px] tracking-[0.06em] text-muted">
          {t.photo}: {[hero.credit, hero.licence].filter(Boolean).join(" · ")}
        </figcaption>
      )}
    </figure>
  );
}
