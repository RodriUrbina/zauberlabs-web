import type { Metadata } from "next";
import AboutPage, { aboutMetadata } from "@/components/AboutPage";

// BL-108: the English About page (/en/about); the German one is /de/ueber-uns.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ lang: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return aboutMetadata((await params).lang, "en");
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return <AboutPage lang={(await params).lang} only="en" />;
}
