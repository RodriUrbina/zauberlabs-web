import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dictionaries, E46_LIVE, E46_URL, e46SectionUrl, e46StartUrl, isLocale, type Locale } from "@/lib/i18n";
import { Arrow, Wordmark } from "@/components/Icons";
import VoteCard from "@/components/VoteCard";
import SuggestForm from "@/components/SuggestForm";
import HomeHero from "@/components/HomeHero";
import SiteFooter from "@/components/SiteFooter";
import { getBlog } from "@/lib/blog";
import StickyStartBar from "@/components/StickyStartBar";
import CloserLook from "@/components/CloserLook";

const wrap = "mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-20";

// BL-081: the blog teaser follows the publish schedule (BL-004), so the page is re-rendered like /blog, at most every 5 minutes.
export const revalidate = 300;

/** "2026-10-26" → "26 Oct" / "26. Okt." */
const shortDate = (iso: string, lang: Locale) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = dictionaries[lang];
  const posts = getBlog().listPosts(lang).filter((r) => !r.fallback).slice(0, 3);

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
            <a href="#next" className="hover:opacity-70">{t.nav.next}</a>
            <Link href={`/${lang}/blog`} className="hover:opacity-70">{t.nav.blog}</Link>
          </nav>
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* BL-079: phones get "Blog" and a compact E46BUILD button (the nav and the full button start at sm/lg). Below 375 px
                there is no room for "Blog" next to the wordmark; the sticky bar still leads into E46BUILD there. */}
            <Link href={`/${lang}/blog`} className="py-3 text-sm font-medium hover:opacity-70 max-[374px]:hidden sm:hidden">{t.nav.blog}</Link>
            <div className="font-mono text-xs tracking-[0.08em] whitespace-nowrap text-muted">
              {lang === "en" ? <span className="text-ink">EN</span> : <Link href="/en" hrefLang="en" className="px-1 py-3 hover:text-ink">EN</Link>}
              {" / "}
              {lang === "de" ? <span className="text-ink">DE</span> : <Link href="/de" hrefLang="de" className="px-1 py-3 hover:text-ink">DE</Link>}
            </div>
            {E46_LIVE ? (
              <>
                <a href={E46_URL} aria-label={t.nav.open} className="flex h-10 items-center rounded-full bg-ink px-3 text-[13px] font-semibold text-paper hover:bg-black sm:hidden">
                  E46BUILD
                </a>
                <a href={E46_URL} className="hidden h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-black sm:flex">
                  {t.nav.open} <Arrow />
                </a>
              </>
            ) : (
              <span className="hidden h-11 items-center rounded-full border border-line px-5 text-sm font-semibold text-muted sm:flex">{t.nav.comingSoon}</span>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO — BL-081 (Rivian-style, static photo) */}
        <HomeHero lang={lang} wrap={wrap} />

        {/* GARAGE — BL-083 (PO 2026-10-27, option C "Take a closer look"): the five E46BUILD categories with E46BUILD's own
            pictures, then the six body tiles (BL-079) and the three value chips. The M3 Touring photo stays in the hero only. */}
        <section id="garage" className={`${wrap} flex scroll-mt-4 flex-col py-16 md:py-28`}>
          <div className="flex flex-col gap-4">
            <p className="eyebrow flex items-center gap-2 text-muted">
              <span aria-hidden="true" className={`size-2 rounded-full ${E46_LIVE ? "bg-[#1f9d63]" : "border border-muted"}`} />
              <span className="font-bold text-ink">
                E46<span className="text-[#5d6fd6]">BUILD</span>
              </span>
              <span aria-hidden="true">·</span>
              {E46_LIVE ? t.garage.live : t.garage.soon}
            </p>
            <h2 className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]">
              {t.garage.title[0]}
              <span className="accent-serif text-accent">{t.garage.title[1]}</span>
            </h2>
          </div>

          <div className="mt-7 md:mt-10">
            <CloserLook cats={t.garage.cats} pick={t.garage.pick} cta={t.garage.cta} hrefs={E46_LIVE ? t.garage.cats.map((c) => e46SectionUrl(c.key)) : null} soon={t.nav.comingSoon} />
          </div>

          <div className="mt-7 grid items-center gap-3.5 border-t border-line pt-7 md:mt-10 md:grid-cols-[200px_1fr] md:gap-6">
            <h3 className="text-lg font-bold tracking-[-0.01em]">{t.garage.startLabel}</h3>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-2.5">
              {/* BL-079 (PO 2026-10-26): each body tile opens E46BUILD with that body pre-chosen, like the hero pills (BL-064).
                  Counted as configurator_click by the page-wide tracker (BL-050). */}
              {t.garage.bodies.map((b) => {
                const inner = (
                  <>
                    <Image src={b.img} alt={E46_LIVE ? "" : `E46 ${b.name}`} width={240} height={150} sizes="(min-width: 768px) 200px, 33vw" className="aspect-[1.6] w-full object-cover" />
                    <span className="flex items-center justify-between gap-1 px-2 py-1.5 md:px-2.5 md:py-2">
                      <span className="flex flex-col">
                        <span className="text-[13px] font-semibold md:text-sm">{b.name}</span>
                        <span className="text-[11px] text-muted">{b.years}</span>
                      </span>
                      {E46_LIVE && <Arrow className="hidden size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink md:block" />}
                    </span>
                  </>
                );
                const box = "flex flex-col overflow-hidden rounded-[14px] border border-[#e3ddd3] bg-white";
                return E46_LIVE ? (
                  <a
                    key={b.name}
                    href={e46StartUrl(b.start)}
                    rel="nofollow" // each load creates a build on E46BUILD; crawlers should not follow these
                    aria-label={t.garage.configure(b.name)}
                    className={`group ${box} transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:bg-[#f4f1ec]`}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={b.name} className={box}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-5">
            {/* BL-081: the three "Why zauberlabs" titles as chips (the long values text is gone). */}
            <ul className="flex flex-wrap gap-2">
              {t.garage.values.map((v) => (
                <li key={v} className="rounded-full border border-line px-3.5 py-[7px] text-[13px] font-semibold">{v}</li>
              ))}
            </ul>
            {E46_LIVE && (
              <a href={E46_URL} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-paper hover:bg-black sm:w-auto">
                {t.garage.open} <Arrow className="size-[18px]" />
              </a>
            )}
          </div>
        </section>

        {/* WHAT'S NEXT — BL-081: one block for the vote (lineup) and the suggest form. Replaces the vote card, the orange
            "Open slot" card and the separate suggest section. The phone sticky bar (BL-079) hides while this block reaches the bottom of the screen. */}
        <section id="next" data-sticky-cta-hide className={`${wrap} flex scroll-mt-4 flex-col gap-8 pb-16 md:gap-14 md:pb-28`}>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <p className="eyebrow text-muted">{t.next.eyebrow}</p>
              <h2 className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]">
                {t.next.title[0]}
                <span className="accent-serif">{t.next.title[1]}</span>
              </h2>
            </div>
            <p className="max-w-[400px] text-base leading-relaxed text-body">{t.next.body}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <VoteCard lang={lang} />
            <div id="suggest" className="flex scroll-mt-4 flex-col gap-2.5 rounded-3xl bg-ink p-5 text-paper md:p-8">
              <p className="eyebrow text-[11px] text-[#A9A6A0]">{t.suggest.eyebrow}</p>
              <h3 className="text-[30px] leading-[1.05] font-extrabold tracking-[-0.03em]">
                {t.suggest.title[0]}
                <span className="accent-serif text-accent-dark">{t.suggest.title[1]}</span>
                {t.suggest.title[2]}
              </h3>
              <p className="mb-2 text-[15px] leading-relaxed text-fog">{t.suggest.body}</p>
              <SuggestForm t={t.suggest} lang={lang} />
            </div>
          </div>
        </section>

        {/* BLOG TEASER — BL-081: the 3 newest articles in this language, same visibility as /blog (drafts and scheduled
            articles never show on the live site). Re-rendered with the page (revalidate below). */}
        {posts.length > 0 && (
          <section id="blog" className={`${wrap} flex scroll-mt-4 flex-col gap-8 pb-16 md:gap-14 md:pb-28`}>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="flex flex-col gap-4">
                <p className="eyebrow text-muted">{t.teaser.eyebrow}</p>
                <h2 className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]">
                  {t.blog.title[0]}
                  <span className="accent-serif">{t.blog.title[1]}</span>
                </h2>
              </div>
              <p className="max-w-[400px] text-base leading-relaxed text-body">{t.teaser.body}</p>
            </div>
            <div className="flex flex-col gap-5">
              <ul className="flex flex-col border-b border-line">
                {posts.map(({ post }) => {
                  // The topic: the first tag that isn't the car itself ("E46" is on every article).
                  const topic = post.meta.tags.find((tag) => tag !== post.meta.configurator.tag);
                  return (
                    <li key={post.slug} className="grid gap-1.5 border-t border-line py-[18px] md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-baseline md:gap-6 md:py-6">
                      <span className="eyebrow text-[11px] text-muted">
                        {shortDate(post.meta.date, lang)}
                        {topic ? ` · ${topic}` : ""}
                      </span>
                      <Link href={`/${lang}/blog/${post.slug}`} className="text-lg leading-[1.25] font-semibold tracking-[-0.015em] hover:underline md:text-[22px]">
                        {post.meta.title}
                      </Link>
                      {E46_LIVE && (
                        <a href={E46_URL} className="text-sm font-semibold whitespace-nowrap text-accent hover:opacity-80">
                          {t.teaser.open} →
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Link href={`/${lang}/blog`} className="self-start font-semibold hover:opacity-70">
                {t.teaser.all} →
              </Link>
            </div>
          </section>
        )}
      </main>

      <SiteFooter lang={lang} />
      {E46_LIVE && <StickyStartBar href={E46_URL} label={t.hero.cta} />}
    </>
  );
}
