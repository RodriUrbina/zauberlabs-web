import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dictionaries, E46_LIVE, E46_URL, isLocale } from "@/lib/i18n";
import { Arrow, ArrowUpRight, Wordmark } from "@/components/Icons";
import VoteCard from "@/components/VoteCard";
import SuggestForm from "@/components/SuggestForm";
import HomeHero from "@/components/HomeHero";
import SiteFooter from "@/components/SiteFooter";

const wrap = "mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = dictionaries[lang];

  return (
    <>
      {/* NAV */}
      <header className="border-b border-[#D8D3CA]">
        <div className={`${wrap} flex h-16 items-center justify-between md:h-[84px]`}>
          <Link href={`/${lang}`} aria-label="zauberlabs">
            <Wordmark />
          </Link>
          <nav className="hidden gap-9 text-sm font-medium lg:flex">
            <a href="#garage" className="hover:opacity-70">{t.nav.configurators}</a>
            <a href="#how" className="hover:opacity-70">{t.nav.how}</a>
            <a href="#principles" className="hover:opacity-70">{t.nav.principles}</a>
            <a href="#suggest" className="hover:opacity-70">{t.nav.suggest}</a>
            <Link href={`/${lang}/blog`} className="hover:opacity-70">{t.nav.blog}</Link>
          </nav>
          <div className="flex items-center gap-4">
            <div className="font-mono text-xs tracking-[0.08em] text-muted">
              {lang === "en" ? <span className="text-ink">EN</span> : <Link href="/en" hrefLang="en" className="px-1 py-3 hover:text-ink">EN</Link>}
              {" / "}
              {lang === "de" ? <span className="text-ink">DE</span> : <Link href="/de" hrefLang="de" className="px-1 py-3 hover:text-ink">DE</Link>}
            </div>
            {E46_LIVE ? (
              <a href={E46_URL} className="hidden h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-black sm:flex">
                {t.nav.open} <Arrow />
              </a>
            ) : (
              <span className="hidden h-11 items-center rounded-full border border-line px-5 text-sm font-semibold text-muted sm:flex">{t.nav.comingSoon}</span>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO — BL-053 concept C */}
        <HomeHero lang={lang} wrap={wrap} />

        {/* TICKER */}
        <div className="bg-ink text-fog">
          <div className={`${wrap} eyebrow flex min-h-[60px] flex-wrap items-center justify-between gap-x-10 gap-y-2 py-4 text-[11px] md:text-xs`}>
            <div className="flex flex-wrap gap-x-10 gap-y-2">
              {t.ticker.map((raw, i) => {
                const item = i === 0 && !E46_LIVE ? t.tickerSoon : raw;
                return (
                <span key={item}>
                  <span className={i === 0 ? "text-e46" : "text-accent-dark"}>0{i + 1}</span>&nbsp;&nbsp;{item}
                </span>
                );
              })}
            </div>
            <span className="hidden md:block">{t.tickerRight}</span>
          </div>
        </div>

        {/* GARAGE */}
        <section id="garage" className={`${wrap} flex scroll-mt-4 flex-col gap-10 py-16 md:gap-14 md:py-28`}>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <p className="eyebrow text-muted">{t.garage.eyebrow}</p>
              <h2 className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]">
                {t.garage.title[0]}
                <span className="accent-serif lg:block">{t.garage.title[1]}</span>
              </h2>
            </div>
            <p className="max-w-[400px] text-base leading-relaxed text-body">{t.garage.body}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col overflow-hidden rounded-3xl bg-ink text-paper lg:col-span-2">
              <div className="relative aspect-[960/512] bg-ink md:aspect-auto md:h-[400px]">
                {/* BL-053.1 (PO decision 2026-10-19): the configurator loop now plays in the hero only (components/HomeHero.tsx).
                    This card shows the E46BUILD site's hero image, the silver E46 M3 Touring "dream build" (AI render by the PO;
                    see public/images/README.md). BL-053.5 (PO: "a bit more to the center"): source 1774×887 from e46build
                    apps/web/public/images/hero/, cropped to x 0–1150 at full height so the car (≈ x 30–1050, y 230–700) sits near
                    the middle (a slight zoom compared with BL-053.1). object-position 50% 56% keeps the whole car visible at every
                    card ratio (≈1.7:1 to 2.4:1 on desktop, 1.875:1 on phones). */}
                <Image src="/images/e46-m3-touring-garage-centred.webp" alt={t.garage.e46CardAlt} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover object-[50%_56%]" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-ink" />
              </div>
              <div className="flex flex-col gap-7 p-6 md:p-8">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div className="flex flex-col gap-2.5">
                    <span className="eyebrow text-[11px] text-e46">{E46_LIVE ? t.garage.e46Label : t.garage.e46LabelSoon}</span>
                    <span className="text-3xl font-extrabold tracking-tight md:text-4xl">
                      E46<span className="text-e46">BUILD</span>
                    </span>
                    <p className="max-w-[460px] text-[15px] leading-relaxed text-fog">{t.garage.e46Body}</p>
                  </div>
                  {E46_LIVE ? (
                    <a href={E46_URL} className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-paper px-6 text-[15px] font-semibold text-ink hover:bg-white">
                      {t.garage.open} <ArrowUpRight />
                    </a>
                  ) : (
                    <span className="flex h-12 shrink-0 items-center justify-center rounded-full border border-[#3A3A40] px-6 text-[15px] font-semibold text-fog">{t.nav.comingSoon}</span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {t.garage.bodies.map((b) => (
                    <div key={b.name} className="flex items-center gap-3 rounded-2xl bg-[#1A1A1E] p-2">
                      <Image src={b.img} alt={`E46 ${b.name}`} width={88} height={56} className="h-14 w-[88px] rounded-lg object-cover" />
                      <div className="flex flex-col">
                        <span className="text-[15px] font-semibold">{b.name}</span>
                        <span className="text-xs text-[#A9A6A0]">{b.years}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <VoteCard lang={lang} />
              <div className="flex flex-col gap-3.5 rounded-3xl bg-accent p-6 text-[#FFF8F3] md:p-8">
                <span className="eyebrow text-[11px]">{t.garage.nextLabel}</span>
                <span className="accent-serif text-[32px] leading-[1.05] md:text-[38px]">{t.garage.nextTitle}</span>
                <a href="#suggest" className="flex h-11 items-center self-start rounded-full bg-[#FFF8F3] px-5 text-sm font-semibold text-ink hover:bg-white">
                  {t.garage.nextCta}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="scroll-mt-4 bg-ink text-paper">
          <div className={`${wrap} flex flex-col gap-10 py-16 md:gap-14 md:py-28`}>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="flex flex-col gap-4">
                <p className="eyebrow text-[#A9A6A0]">{t.how.eyebrow}</p>
                <h2 className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]">
                  {t.how.title[0]}
                  <span className="accent-serif text-accent-dark lg:block">{t.how.title[1]}</span>
                </h2>
              </div>
              <p className="max-w-[400px] text-base leading-relaxed text-fog">{t.how.body}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              {t.how.steps.map((s, i) => {
                const light = i === 2;
                return (
                  <div key={s.k} className={`flex min-h-[260px] flex-col gap-4 rounded-[20px] p-6 md:min-h-[300px] md:p-9 ${light ? "bg-paper text-ink" : "bg-ink-2"}`}>
                    <span className={`eyebrow ${light ? "text-muted" : "text-[#A9A6A0]"}`}>{s.k}</span>
                    <span className="text-[22px] font-bold tracking-tight md:text-[26px]">{s.t}</span>
                    <p className={`text-[15px] leading-relaxed ${light ? "text-body" : "text-fog"}`}>{s.b}</p>
                    <div className="mt-auto">
                      {"chips" in s && s.chips && (
                        <div className="flex flex-wrap gap-2">
                          {s.chips.map((c) => (
                            <span key={c} className="flex h-[34px] items-center rounded-full border border-[#3A3A40] px-3.5 text-[13px]">{c}</span>
                          ))}
                        </div>
                      )}
                      {"part" in s && s.part && (
                        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-[10px] border border-ink px-4.5 py-2.5 font-mono text-[12px] md:text-[13px]">
                          <span className="whitespace-nowrap">
                            {s.part} → {s.car}
                          </span>
                          <span className="whitespace-nowrap text-[#1F7A45]">{s.fit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRINCIPLES */}
        <section id="principles" className={`${wrap} grid scroll-mt-4 gap-10 py-16 md:py-28 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-20`}>
          <div className="flex flex-col gap-4">
            <p className="eyebrow text-muted">{t.principles.eyebrow}</p>
            <h2 className="text-[34px] leading-[1.02] font-extrabold tracking-[-0.035em] md:text-[50px]">
              {t.principles.title[0]}
              <span className="accent-serif text-accent">{t.principles.title[1]}</span>
              {t.principles.title[2]}
            </h2>
          </div>
          <ol className="flex flex-col border-b border-line">
            {t.principles.items.map((p, i) => (
              <li key={p.t} className="grid gap-2 border-t border-line py-6 md:grid-cols-[80px_minmax(0,1fr)_minmax(0,1.2fr)] md:items-baseline md:gap-6 md:py-7">
                <span className="hidden font-mono text-[13px] text-muted md:block">0{i + 1}</span>
                <span className="text-xl font-bold tracking-tight md:text-2xl">{p.t}</span>
                <span className="text-[15px] leading-relaxed text-body">{p.b}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* SUGGEST */}
        <section id="suggest" className={`${wrap} scroll-mt-4 pb-16 md:pb-28`}>
          <div className="grid items-center gap-10 rounded-[28px] bg-ink p-6 text-paper md:p-12 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-16 lg:p-[72px]">
            <div className="flex flex-col gap-4">
              <p className="eyebrow text-[#A9A6A0]">{t.suggest.eyebrow}</p>
              <h2 className="text-[34px] leading-[1.02] font-extrabold tracking-[-0.035em] md:text-[56px]">
                {t.suggest.title[0]}
                <span className="accent-serif text-accent-dark">{t.suggest.title[1]}</span>
                {t.suggest.title[2]}
              </h2>
              <p className="max-w-[460px] text-base leading-relaxed text-fog">{t.suggest.body}</p>
            </div>
            <SuggestForm t={t.suggest} lang={lang} />
          </div>
        </section>
      </main>

      <SiteFooter lang={lang} />
    </>
  );
}
