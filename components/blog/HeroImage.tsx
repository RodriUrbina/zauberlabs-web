import Image from "next/image";
import type { Hero } from "@/lib/blog-schema";
import { dictionaries, type Locale } from "@/lib/i18n";

/** 16:9 hero with credit line. With no image yet (hero.src = null) nothing is rendered; never a third-party picture. */
export default function HeroImage({ hero, lang, priority = false, sizes = "(min-width: 820px) 760px, 100vw", className = "" }: { hero: Hero; lang: Locale; priority?: boolean; sizes?: string; className?: string }) {
  const t = dictionaries[lang].blog;
  // No licensed image yet: render nothing (PO decision 2026-10-02). The front-matter brief stays in the file, unseen.
  if (!hero.src) return null;
  return (
    <figure className={className}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-ink">
        <Image src={hero.src} alt={hero.alt} fill priority={priority} sizes={sizes} className="object-cover" />
      </div>
      {(hero.credit || hero.licence) && (
        <figcaption className="mt-3 font-mono text-[11px] tracking-[0.06em] text-muted">
          {t.photo}: {[hero.credit, hero.licence].filter(Boolean).join(" · ")}
        </figcaption>
      )}
    </figure>
  );
}
