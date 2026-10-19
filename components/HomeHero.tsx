import Image from "next/image";
import { Arrow } from "@/components/Icons";
import { dictionaries, E46_LIVE, E46_URL, type Locale } from "@/lib/i18n";

/**
 * BL-053 (PO decision 2026-10-19) — home hero, concept C "Headline on paper" (Agent 3's mockup): the headline on the page
 * background, below it the E46BUILD configurator loop in one rounded frame with the line and the one button.
 * Desktop: 1200:600 frame (never wider than 1200 px), line left and button right over a bottom gradient. BL-053.3: on md+ only
 * the frame shrinks (and is centred) so it fits the first screen; the headline stays 72 px (app/globals.css, ".home-hero").
 * ≤ md: the video at its own ratio (960:512, nothing cropped), line and full-width button in a dark panel below it.
 * Video: same loop and rules as the garage card (BL-029): poster first (LCP, carries the alt), muted autoplay loop on top,
 * hidden under prefers-reduced-motion. Text inside the frame uses fixed colours (it always sits on ink).
 */
export default function HomeHero({ lang, wrap }: { lang: Locale; wrap: string }) {
  const t = dictionaries[lang].hero;
  return (
    <section className={`${wrap} home-hero flex flex-col gap-4 pt-8 pb-12 md:gap-6 md:pt-12 md:pb-14`}>
      <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-body uppercase md:text-xs">
        <span aria-hidden="true" className={`size-2 rounded-full ${E46_LIVE ? "bg-[#1f9d63]" : "border border-muted"}`} />
        {E46_LIVE ? t.live : t.liveSoon}
      </p>
      <h1 className="max-w-[12em] text-[38px] leading-none font-extrabold tracking-[-0.045em] [text-wrap:balance] md:text-[72px]">
        {t.title[0]}
        <span className="accent-serif text-accent">{t.title[1]}</span>
        {t.title[2]}
      </h1>

      <div className="hero-frame relative w-full max-w-[1200px] overflow-hidden rounded-[20px] bg-ink text-paper md:rounded-3xl">
        <div className="relative aspect-[960/512] md:aspect-[1200/600]">
          {/* BL-053.5: the loop's own fake browser bar (top ≈ 40 of 512 px) is pushed out of the frame. Poster and video sit in
              a box 8.7 % taller than the frame, anchored to the bottom, so exactly the top 8 % of the picture (the bar) is hidden
              at every width; the bottom is not cropped. A deeper crop would cut the status pills some frames show right under
              the bar. */}
          <div className="absolute inset-x-0 bottom-0 h-[108.7%]">
            <Image src="/images/e46-configurator-loop-poster.webp" alt={t.videoAlt} fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
            <video
              className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/e46-configurator-loop-poster.webp"
              aria-hidden="true"
              tabIndex={-1}
            >
              <source src="/media/e46-configurator-loop.webm" type="video/webm" />
              <source src="/media/e46-configurator-loop.mp4" type="video/mp4" />
            </video>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(0deg,rgba(14,14,16,0.92)_0%,rgba(14,14,16,0.6)_26%,rgba(14,14,16,0)_52%)] md:block" />
        </div>
        <div className="flex flex-col items-stretch gap-4 p-5 md:absolute md:inset-x-9 md:bottom-7 md:flex-row md:items-end md:justify-between md:gap-6 md:p-0">
          <p className="max-w-[30em] text-base leading-normal text-[#e6e2dc] [text-wrap:pretty] md:text-[19px]">{t.line}</p>
          {E46_LIVE ? (
            <a href={E46_URL} className="flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-full bg-paper px-[26px] text-base font-semibold whitespace-nowrap text-ink hover:bg-white">
              {t.cta} <Arrow className="size-[18px]" />
            </a>
          ) : (
            <span className="flex h-[54px] shrink-0 items-center justify-center rounded-full border border-[#3A3A40] px-[26px] text-base font-semibold text-fog">
              {dictionaries[lang].nav.comingSoon}
            </span>
          )}
        </div>
      </div>

    </section>
  );
}
