import LegalPage from "@/components/LegalPage";
import LegalBlocks from "@/components/shop/LegalBlocks";
import { BindingNote } from "@/components/shop/LegalBits";
import { widerruf } from "@/lib/legal/widerruf";
import { requireShopOpen } from "@/lib/shop-gate";

export const metadata = { title: "Widerrufsbelehrung — zauberlabs", robots: { index: false } };

/**
 * BL-085 — Widerrufsbelehrung and Muster-Widerrufsformular (the statutory models, word for word). BL-090: the text lives in
 * lib/legal/widerruf.ts, shared with the order confirmation e-mail. Hidden until launch.
 */
export default async function Widerrufsbelehrung({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireShopOpen();
  const t = widerruf(lang === "en" ? "en" : "de");
  return (
    <LegalPage lang={lang} title={t.title} titleLang={lang === "en" ? "en" : "de"}>
      {lang === "en" && <BindingNote deHref="/de/widerrufsbelehrung" />}
      <LegalBlocks blocks={t.blocks} />
    </LegalPage>
  );
}
