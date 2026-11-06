import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/blog";
import { dictionaries, isLocale, LOCALES, type Locale } from "@/lib/i18n";
import { SHOP_LAUNCHED } from "@/lib/shop-flag";
import { e46Href, FROM, linkTiles } from "@/lib/instagram/links";
import { readQueue } from "@/lib/instagram/queue";
import { Arrow } from "@/components/Icons";
import BlogHeader from "@/components/blog/BlogHeader";
import SiteFooter from "@/components/SiteFooter";
import Title from "@/components/Title";

// BL-118 (PO 2026-11-06): the link-in-bio page for Instagram. Re-rendered like the blog, so a post's tile appears once its time has come.
export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const COPY = {
  en: {
    title: "zauberlabs on Instagram",
    description: "Our latest Instagram posts and where they lead: E46BUILD, the blog and the shop.",
    headline: ["zauberlabs ", "on Instagram."],
    line: "Tap a post to see more.",
    latest: "Latest posts",
    soon: "Coming up",
  },
  de: {
    title: "zauberlabs auf Instagram",
    description: "Unsere neuesten Instagram-Beiträge und wohin sie führen: E46BUILD, der Blog und der Shop.",
    headline: ["zauberlabs ", "auf Instagram."],
    line: "Tippe auf einen Beitrag, um mehr zu sehen.",
    latest: "Neueste Beiträge",
    soon: "Demnächst",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    metadataBase: new URL(SITE_URL),
    title: COPY[lang].title,
    description: COPY[lang].description,
    alternates: { canonical: `${SITE_URL}/${lang}/links`, languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/links`])) },
  };
}

export default async function LinksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = COPY[lang];
  const t = dictionaries[lang];
  const other: Locale = lang === "de" ? "en" : "de";
  const tiles = linkTiles(readQueue().posts, lang, Date.now());
  const upcoming = tiles.length > 0 && tiles.every((x) => x.scheduled);
  const pill = "flex h-12 items-center justify-center gap-1.5 rounded-full px-4 text-[15px] font-semibold";
  return (
    <div className="min-h-screen">
      <BlogHeader lang={lang} otherHref={`/${other}/links`} blogLabel={false} />
      {/* Every link carries from=instagram; the E46BUILD links count as configurator_click with place "links" (BL-116). */}
      <main data-click-place="links" className="mx-auto w-full max-w-[720px] px-5 py-8 md:py-12">
        <Title as="h1" lead={c.headline[0]} accent={c.headline[1]} className="text-[34px] leading-[1.02] font-extrabold tracking-[-0.035em] md:text-[44px]" />
        <p className="mt-3 text-base text-body">{c.line}</p>
        <nav aria-label={c.title} className="mt-6 grid grid-cols-3 gap-2">
          <a href={e46Href(lang)} className={`${pill} bg-ink text-paper hover:bg-black`}>
            E46BUILD <Arrow className="size-4" />
          </a>
          <Link href={`/${lang}/blog?${FROM}`} className={`${pill} border border-line text-ink hover:border-ink`}>
            {t.nav.blog}
          </Link>
          {SHOP_LAUNCHED ? (
            <Link href={`/${lang}/shop?${FROM}`} className={`${pill} border border-line text-ink hover:border-ink`}>
              {t.nav.shop}
            </Link>
          ) : (
            <Link href={`/${lang}?${FROM}`} className={`${pill} border border-line text-ink hover:border-ink`}>
              zauberlabs
            </Link>
          )}
        </nav>
        {tiles.length > 0 && (
          <section className="mt-10" aria-labelledby="links-posts">
            <h2 id="links-posts" className="eyebrow text-muted">{upcoming ? c.soon : c.latest}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {tiles.map((tile, i) => (
                <li key={tile.id}>
                  <a href={tile.href} className="group flex flex-col overflow-hidden rounded-[14px] border border-[#e3ddd3] bg-white hover:border-ink">
                    <Image
                      src={tile.img}
                      alt={tile.alt}
                      width={1080}
                      height={1350}
                      sizes="(min-width: 768px) 224px, calc(50vw - 26px)"
                      priority={i < 2}
                      className="aspect-[4/5] w-full object-cover"
                    />
                    <span className="px-3 py-2.5 text-[14px] leading-snug font-semibold text-ink group-hover:underline">{tile.headline}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter lang={lang} otherHref={`/${other}/links`} homePath={`/${lang}`} />
    </div>
  );
}
