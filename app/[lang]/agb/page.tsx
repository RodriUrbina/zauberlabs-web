import LegalPage from "@/components/LegalPage";
import ProviderPlaceholder from "@/components/shop/ProviderPlaceholder";
import { requireShopOpen } from "@/lib/shop-gate";

export const metadata = { title: "AGB — zauberlabs", robots: { index: false } };

/** BL-084 — skeleton for the shop's terms (plan § 3 #2). The text comes from the legal-text provider; hidden until launch. */
export default async function Agb({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireShopOpen();
  return (
    <LegalPage lang={lang} title="Allgemeine Geschäftsbedingungen">
      {lang === "en" && <p className="italic">These terms are provided in German.</p>}
      <ProviderPlaceholder>
        <p>Geltungsbereich · Vertragspartner · Vertragsschluss (Bestellung über Stripe Checkout, Button „Bezahlen“) · Preise und Versandkosten · Lieferung · Zahlung · Eigentumsvorbehalt · Widerrufsrecht (siehe Widerrufsbelehrung) · Gewährleistung · Streitbeilegung.</p>
      </ProviderPlaceholder>
    </LegalPage>
  );
}
