import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import ProviderPlaceholder from "@/components/shop/ProviderPlaceholder";
import { requireShopOpen } from "@/lib/shop-gate";

export const metadata = { title: "Widerrufsbelehrung — zauberlabs", robots: { index: false } };

/** BL-084 — skeleton for the withdrawal notice and the model form (plan § 3 #3). Text from the provider; hidden until launch. */
export default async function Widerrufsbelehrung({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireShopOpen();
  return (
    <LegalPage lang={lang} title="Widerrufsbelehrung">
      {lang === "en" && <p className="italic">This notice is provided in German.</p>}
      <ProviderPlaceholder>
        <p>Widerrufsrecht (14 Tage ab Erhalt der Ware) · Folgen des Widerrufs · Rücksendekosten · Muster-Widerrufsformular.</p>
      </ProviderPlaceholder>
      <p>
        Du kannst deinen Vertrag auch direkt online widerrufen: <Link href={`/${lang}/vertrag-widerrufen`} className="font-semibold text-ink underline">Vertrag widerrufen</Link>.
      </p>
    </LegalPage>
  );
}
