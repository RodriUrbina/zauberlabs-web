import type { Metadata } from "next";
import AboutPage, { aboutMetadata } from "@/components/AboutPage";

// BL-108: the German About page (/de/ueber-uns); the English one is /en/about.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ lang: "de" }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return aboutMetadata((await params).lang, "de");
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  return <AboutPage lang={(await params).lang} only="de" />;
}
