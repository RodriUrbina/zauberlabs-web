import Image from "next/image";
import Link from "next/link";
import { Arrow } from "@/components/Icons";
import { dictionaries, E46_LIVE, E46_URL, e46StartUrl, type Locale } from "@/lib/i18n";

/**
 * BL-081 (PO decision 2026-10-26) — Rivian-style hero, as mocked in e46/docs/design/zauberlabs-rivian-landing (version b,
 * headline option 2): one static photo of the E46 M3 Touring dream build (the E46BUILD hero, no video), a status line, the
 * headline, one line and two pill buttons. lg+: full-width photo, the text in the dark space right of the car. Below lg:
 * the car on top, text and buttons centred under it on ink. The body pills (BL-064) follow on the paper background.
 * The alt text keeps "never sold" (BMW built one prototype and never sold it). [data-hero-cta] drives the phone sticky bar
 * (BL-079).
 */
export default function HomeHero({ lang, wrap }: { lang: Locale; wrap: string }) {
  const d = dictionaries[lang];
  const t = d.hero;
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="relative aspect-[4/3.1] lg:aspect-auto lg:h-[min(78vh,760px)] lg:min-h-[560px]">
          <Image
            src="/images/e46-m3-touring-hero.webp"
            alt={d.garage.e46CardAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[3%_70%] lg:object-[30%_60%]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,16,0)_62%,rgba(14,14,16,1)_100%)] lg:bg-[linear-gradient(90deg,rgba(14,14,16,0)_40%,rgba(14,14,16,0.55)_70%,rgba(14,14,16,0.75)_100%)]"
          />
        </div>
        <div className={`${wrap} lg:absolute lg:inset-x-0 lg:top-1/2 lg:flex lg:-translate-y-1/2 lg:justify-end`}>
          <div className="flex flex-col items-center px-0 pt-1 pb-7 text-center lg:w-[480px] lg:items-start lg:p-0 lg:text-left">
            <p className="eyebrow flex items-center gap-2 text-[11px] text-[#d9d5ce] md:text-xs">
              <span aria-hidden="true" className={`size-2 rounded-full ${E46_LIVE ? "bg-[#1f9d63]" : "border border-fog"}`} />
              {E46_LIVE ? t.live : t.liveSoon}
            </p>
            <h1 className="mt-3 text-[38px] leading-none font-extrabold tracking-[-0.045em] [text-wrap:balance] lg:mt-[18px] lg:text-[60px]">
              {t.title[0]}
              <span className="accent-serif text-accent-dark">{t.title[1]}</span>
              {t.title[2]}
            </h1>
            <p className="mt-3 text-base leading-normal text-[#e6e2dc] [text-wrap:pretty] lg:mt-4 lg:text-[19px]">{t.line}</p>
            <div className="mt-[22px] flex w-full flex-col gap-2.5 lg:mt-7 lg:w-auto lg:flex-row lg:gap-3">
              {E46_LIVE ? (
                <a
                  href={E46_URL}
                  data-hero-cta
                  className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-paper px-[26px] text-base font-semibold whitespace-nowrap text-ink hover:bg-white"
                >
                  {t.configure} <Arrow className="size-[18px]" />
                </a>
              ) : (
                <span className="flex h-[52px] items-center justify-center rounded-full border border-[#3A3A40] px-[26px] text-base font-semibold text-fog">
                  {d.nav.comingSoon}
                </span>
              )}
              <Link
                href={`/${lang}/blog`}
                className="flex h-[52px] items-center justify-center rounded-full border-[1.5px] border-paper/70 px-[26px] text-base font-semibold whitespace-nowrap text-paper hover:border-paper hover:bg-white/5"
              >
                {t.readBlog}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BL-064: one quiet row of body buttons; each opens E46BUILD with that body pre-chosen (same tab, like the other home
          links). Outline pills, so the hero button stays the one primary action. */}
      {E46_LIVE && (
        <nav aria-label={t.pickLead} className={`${wrap} flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5 pt-[22px] pb-[26px] md:pt-[26px] md:pb-[30px]`}>
          <span className="w-full text-center text-[15px] text-body md:mr-1 md:w-auto">{t.pickLead}</span>
          {d.garage.bodies.map((b) => (
            <a
              key={b.start}
              href={e46StartUrl(b.start)}
              rel="nofollow" // each load creates a build on E46BUILD; crawlers should not follow these
              className="inline-flex h-[38px] items-center rounded-full border border-line px-4 text-[15px] font-semibold text-ink hover:border-ink md:h-10 md:px-[18px]"
            >
              {b.name}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
