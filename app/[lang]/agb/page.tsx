import LegalPage from "@/components/LegalPage";
import LegalBlocks from "@/components/shop/LegalBlocks";
import { BindingNote, Clause } from "@/components/shop/LegalBits";
import { agb } from "@/lib/legal/agb";
import { requireShopOpen } from "@/lib/shop-gate";

export const metadata = { title: "AGB — zauberlabs", robots: { index: false } };

/**
 * BL-085 — the fan shop's terms. BL-090: the text lives in lib/legal/agb.ts, shared with the order confirmation e-mail
 * (lib/order-mail.ts), so both always say the same. German is binding; /en shows the convenience translation. Hidden until
 * launch (lib/shop-flag.ts).
 */
export default async function Agb({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireShopOpen();
  const t = agb(lang === "en" ? "en" : "de");
  return (
    <LegalPage lang={lang} title={t.title} titleLang={lang === "en" ? "en" : "de"}>
      {lang === "en" && <BindingNote deHref="/de/agb" />}
      <LegalBlocks blocks={t.intro} />
      {t.clauses.map((c) => (
        <Clause key={c.title} title={c.title}>
          <LegalBlocks blocks={c.blocks} />
        </Clause>
      ))}
    </LegalPage>
  );
}
