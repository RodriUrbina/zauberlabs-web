import type { Metadata } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import { dictionaries, isLocale, LOCALES } from "@/lib/i18n";
import "../globals.css";

// Self-hosted (SIL Open Font License) — no requests to Google, which keeps the GDPR story simple.
const archivo = localFont({
  src: [
    { path: "../fonts/archivo-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/archivo-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/archivo-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/archivo-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/archivo-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
});
const instrument = localFont({
  src: [
    { path: "../fonts/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "../fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = dictionaries[lang];
  return {
    metadataBase: new URL("https://www.zauberlabs.de"),
    title: t.meta.title,
    description: t.meta.description,
    alternates: { canonical: `/${lang}`, languages: { de: "/de", en: "/en" } },
    openGraph: { title: t.meta.title, description: t.meta.description, images: ["/images/hero.jpg"], locale: lang === "de" ? "de_DE" : "en_US", type: "website" },
  };
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={`${archivo.variable} ${instrument.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
