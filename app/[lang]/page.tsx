import Link from "next/link";
import { notFound } from "next/navigation";
import { dictionaries, E46_LIVE, e46SectionUrl, e46Url, isLocale, type Locale } from "@/lib/i18n";
import { Arrow, Wordmark } from "@/components/Icons";
import VoteCard from "@/components/VoteCard";
import SuggestForm from "@/components/SuggestForm";
import HomeHero from "@/components/HomeHero";
import SiteFooter from "@/components/SiteFooter";
import { getBlog } from "@/lib/blog";
import StickyStartBar from "@/components/StickyStartBar";
import { SHOP_LAUNCHED } from "@/lib/shop-flag";
import CloserLook from "@/components/CloserLook";
import Title from "@/components/Title";

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
            {/* BL-086 (PO 2026-10-27): the shop in the desktop nav, only once it is launched (lib/shop-flag.ts). Phones: it
                replaces "Blog" in the header (below). */}
            {SHOP_LAUNCHED && <Link href={`/${lang}/shop`} className="hover:opacity-70">{t.nav.shop}</Link>}
          </nav>
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* BL-079: phones get "Blog" and a compact E46BUILD button (the nav and the full button start at sm/lg). Below 375 px
                there is no room for "Blog" next to the wordmark; the sticky bar still leads into E46BUILD there. */}
            {/* BL-086 (PO 2026-10-27, option a): with the shop launched, "Shop" takes this place on phones ("Blog" stays in the
                hero's "Read the blog" button and the footer); without it, "Blog" as before. */}
            {/* BL-102 (PO 2026-10-30): below 412 px "Shop" touches the wordmark (0 px gap at 375, 6 px at 390), so it shows from
                412 px (28 px gap); smaller phones get no link here (PO, option c: "Blog" touched it the same way) and reach the shop
                through the footer. */}
            {SHOP_LAUNCHED ? (
              <Link href={`/${lang}/shop`} className="py-3 text-sm font-medium hover:opacity-70 max-[412px]:hidden sm:hidden">{t.nav.shop}</Link>
            ) : (
              <Link href={`/${lang}/blog`} className="py-3 text-sm font-medium hover:opacity-70 max-[374px]:hidden sm:hidden">{t.nav.blog}</Link>
            )}
            <div className="font-mono text-xs tracking-[0.08em] whitespace-nowrap text-muted">
              {lang === "en" ? <span className="text-ink">EN</span> : <Link href="/en" hrefLang="en" className="px-1 py-3 hover:text-ink">EN</Link>}
              {" / "}
              {lang === "de" ? <span className="text-ink">DE</span> : <Link href="/de" hrefLang="de" className="px-1 py-3 hover:text-ink">DE</Link>}
            </div>
            {E46_LIVE ? (
              <>
                <a href={e46Url(lang)} aria-label={t.nav.open} className="flex h-10 items-center rounded-full bg-ink px-3 text-[13px] font-semibold text-paper hover:bg-black sm:hidden">
                  E46BUILD
                </a>
                <a href={e46Url(lang)} className="hidden h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-black sm:flex">
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

        {/* GARAGE — BL-083 (PO 2026-10-27, option C "Take a closer look"): the E46BUILD categories (six since BL-124) with E46BUILD's own
            pictures. The M3 Touring photo stays in the hero only. BL-114 (PO 2026-11-04, "just delete this part"): the block under
            the panel is gone: the "pick the body style" heading, the six body tiles (BL-079), the three value chips (BL-081) and the
            "Open E46BUILD" button. The body pills under the hero (BL-064) and the header button stay. */}
        <section id="garage" className={`${wrap} flex scroll-mt-4 flex-col py-16 md:py-28`}>
          {/* BL-115 (PO 2026-11-04): the side text opposite the title, same slot and style as What's next and the blog teaser. */}
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <p className="eyebrow flex items-center gap-2 text-muted">
                <span aria-hidden="true" className={`size-2 rounded-full ${E46_LIVE ? "bg-[#1f9d63]" : "border border-muted"}`} />
                <span className="font-bold text-ink">
                  E46<span className="text-[#5d6fd6]">BUILD</span>
                </span>
                <span aria-hidden="true">·</span>
                {E46_LIVE ? t.garage.live : t.garage.soon}
              </p>
              <Title lead={t.garage.title[0]} accent={t.garage.title[1]} className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]" />
            </div>
            <p className="max-w-[400px] text-base leading-relaxed text-body">{t.garage.body}</p>
          </div>

          <div className="mt-7 md:mt-10">
            <CloserLook cats={t.garage.cats} pick={t.garage.pick} auto={t.garage.auto} cta={t.garage.cta} hrefs={E46_LIVE ? t.garage.cats.map((c) => e46SectionUrl(c.key, lang)) : null} soon={t.nav.comingSoon} />
          </div>
        </section>

        {/* WHAT'S NEXT — BL-081: one block for the vote (lineup) and the suggest form. Replaces the vote card, the orange
            "Open slot" card and the separate suggest section. The phone sticky bar (BL-079) hides while this block reaches the bottom of the screen. */}
        <section id="next" data-sticky-cta-hide className={`${wrap} flex scroll-mt-4 flex-col gap-8 pb-16 md:gap-14 md:pb-28`}>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              {/* BL-107: the accent ("Du entscheidest." / "You decide.") wraps as a whole, never between its words. */}
              <Title eyebrow={t.next.eyebrow} lead={t.next.title[0]} accent={t.next.title[1]} keepAccentTogether className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]" />
            </div>
            <p className="max-w-[400px] text-base leading-relaxed text-body">{t.next.body}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <VoteCard lang={lang} />
            <div id="suggest" className="flex scroll-mt-4 flex-col gap-2.5 rounded-3xl bg-ink p-5 text-paper md:p-8">
              <Title
                as="h3"
                tone="dark"
                eyebrow={t.suggest.eyebrow}
                eyebrowClassName="text-[11px] text-[#A9A6A0]"
                lead={t.suggest.title[0]}
                accent={t.suggest.title[1]}
                tail={t.suggest.title[2]}
                className="text-[30px] leading-[1.05] font-extrabold tracking-[-0.03em]"
              />
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
                <Title eyebrow={t.teaser.eyebrow} lead={t.blog.title[0]} accent={t.blog.title[1]} className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]" />
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
                        <a href={e46Url(lang)} data-click-place="blog-teaser" className="text-sm font-semibold whitespace-nowrap text-accent hover:opacity-80">
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
      {E46_LIVE && <StickyStartBar href={e46Url(lang)} label={t.hero.cta} />}
    </>
  );
}
