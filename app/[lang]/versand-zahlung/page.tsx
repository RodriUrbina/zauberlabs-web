import LegalPage from "@/components/LegalPage";
import ProviderPlaceholder from "@/components/shop/ProviderPlaceholder";
import { formatEuro } from "@/lib/shop-pricing";
import { SHIPPING } from "@/lib/shop-products";
import { requireShopOpen } from "@/lib/shop-gate";

export const metadata = { title: "Versand & Zahlung — zauberlabs", robots: { index: false } };

/**
 * BL-084 — shipping and payment (plan § 3 #5). Costs come from lib/shop-products.ts, so this page and the checkout never
 * disagree. Delivery times and the final wording are the PO's; hidden until launch.
 */
export default async function VersandZahlung({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireShopOpen();
  const eur = (c: number) => formatEuro(c, "de");
  return (
    <LegalPage lang={lang} title="Versand & Zahlung">
      {lang === "en" && <p className="italic">This page is provided in German.</p>}
      <h2>Versandkosten</h2>
      <ul className="list-disc pl-5">
        <li>Deutschland (Deutsche Post, Brief): {eur(SHIPPING.de)}, versandkostenfrei ab einem Warenwert von {eur(SHIPPING.deFreeFrom)}.</li>
        <li>Andere EU-Länder (DHL Päckchen): {eur(SHIPPING.eu)}.</li>
        <li>Länder außerhalb der EU beliefern wir derzeit nicht.</li>
      </ul>
      <p>Alle Preise sind Endpreise inkl. 19 % MwSt., zzgl. Versandkosten.</p>
      <h2>Lieferzeit</h2>
      <ProviderPlaceholder>
        <p>Lieferzeit Deutschland und EU (vom PO festzulegen, z. B. „Versand innerhalb von X Werktagen nach Zahlungseingang“).</p>
      </ProviderPlaceholder>
      <h2>Zahlung</h2>
      <p>
        Du bezahlst auf der Zahlungsseite unseres Zahlungsdienstleisters Stripe. Je nach Freischaltung stehen Kreditkarte, Apple Pay, Google Pay,
        PayPal und Klarna zur Verfügung; die verfügbaren Zahlungsarten siehst du im Bezahlschritt.
      </p>
    </LegalPage>
  );
}
