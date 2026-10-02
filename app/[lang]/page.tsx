import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dictionaries, E46_LIVE, E46_URL, isLocale } from "@/lib/i18n";
import { Arrow, ArrowUpRight, Wordmark } from "@/components/Icons";
import VoteCard from "@/components/VoteCard";
import SuggestForm from "@/components/SuggestForm";
import HeroDeck from "@/components/HeroDeck";
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
          <Link href={`/${lang}`} aria-label="Zauberlabs">
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
        {/* HERO */}
        <section className={`${wrap} grid gap-10 py-12 md:py-20 lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)] lg:gap-16 lg:py-24`}>
          <div className="flex flex-col justify-between gap-10">
            <div className="flex flex-col gap-6 md:gap-7">
              <p className="eyebrow text-[11px] text-muted md:text-xs">{t.hero.eyebrow}</p>
              <h1 className={`font-extrabold tracking-[-0.04em] ${lang === "de" ? "text-[40px] leading-[1.02] sm:text-6xl lg:text-[72px] lg:leading-none" : "text-5xl leading-[0.98] sm:text-7xl lg:text-[92px] lg:leading-[0.96]"}`}>
                {t.hero.title[0]}
                <span className="accent-serif text-accent">{t.hero.title[1]}</span>
              </h1>
              <p className="max-w-[520px] text-base leading-relaxed text-body md:text-[19px]">{t.hero.body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#garage" className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-ink px-7 text-base font-semibold text-paper hover:bg-black">
                {t.hero.ctaPrimary} <Arrow className="size-[18px]" />
              </a>
              <a href="#suggest" className="flex h-14 items-center justify-center rounded-full border border-ink px-7 text-base font-semibold hover:bg-ink/5">
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>

          <HeroDeck
            href={E46_LIVE ? E46_URL : undefined}
            live={E46_LIVE ? t.hero.live : `${t.hero.soon} · 01`}
            soon={t.hero.soon}
            e46Line={t.hero.cardLine}
            e46Alt={t.hero.heroAlt}
            left={{ num: "02", make: "Mercedes-Benz · 1984–1997", model: "W124", accent: "#6fd3c1", line: t.hero.w124Line, img: "/images/w124.svg", alt: "" }}
            right={{ num: "03", make: "Audi · 1994–2001", model: "B5", accent: "#e8553d", line: t.hero.b5Line, img: "/images/b5-rs4.svg", alt: "" }}
          />
        </section>

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
                <span className="accent-serif">{t.garage.title[1]}</span>
              </h2>
            </div>
            <p className="max-w-[400px] text-base leading-relaxed text-body">{t.garage.body}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col overflow-hidden rounded-3xl bg-ink text-paper lg:col-span-2">
              <div className="relative h-[240px] md:h-[400px]">
                {/* BL-003: AI-generated image made by the PO (Rodrigo Urbina), 2026-09-28, source doubleCar_HighFi.png.
                    Shown without a visible "AI-generated" label by explicit PO decision (exception to BL-000 rule 3, logged on BL-003).
                    object-position centres the crop on the two headlights and the split line at phone and desktop widths. */}
                <Image src="/images/e46-halogen-bixenon.jpg" alt={t.garage.e46CardAlt} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover object-[50%_46%] md:object-[50%_60%]" />
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
                  <span className="accent-serif text-accent-dark">{t.how.title[1]}</span>
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
                      {"sample" in s && s.sample && (
                        <div className="flex h-11 items-center rounded-full bg-ink-3 px-4.5 text-sm text-fog">{s.sample}</div>
                      )}
                      {"chips" in s && s.chips && (
                        <div className="flex flex-wrap gap-2">
                          {s.chips.map((c) => (
                            <span key={c} className="flex h-[34px] items-center rounded-full border border-[#3A3A40] px-3.5 text-[13px]">{c}</span>
                          ))}
                        </div>
                      )}
                      {"part" in s && s.part && (
                        <div className="flex h-11 items-center justify-between rounded-[10px] border border-ink px-4.5 font-mono text-[13px]">
                          <span>{s.part}</span>
                          <span className="text-[#1F7A45]">{s.fit}</span>
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
