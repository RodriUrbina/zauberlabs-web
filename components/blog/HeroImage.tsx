import Image from "next/image";
import type { Hero } from "@/lib/blog-schema";
import { dictionaries, type Locale } from "@/lib/i18n";
import { Wordmark } from "@/components/Icons";

/** 16:9 hero. With no image yet (hero.src = null) a labelled placeholder is shown instead; never a third-party picture. */
export default function HeroImage({ hero, lang, priority = false, sizes = "(min-width: 820px) 760px, 100vw", className = "" }: { hero: Hero; lang: Locale; priority?: boolean; sizes?: string; className?: string }) {
  const t = dictionaries[lang].blog;
  if (!hero.src) {
    return (
      <div className={`relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-6 text-paper ${className}`} role="img" aria-label={hero.alt}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_20%,rgb(255_255_255/0.12),transparent_70%)]" />
        <span className="eyebrow relative text-[11px] text-fog">{t.imagePending}</span>
        <div className="relative flex flex-col gap-3">
          <Wordmark dark />
          <p className="max-w-[420px] text-[13px] leading-relaxed text-fog">{hero.alt}</p>
        </div>
      </div>
    );
  }
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
