import LegalPage from "@/components/LegalPage";
import { BindingNote } from "@/components/shop/LegalBits";
import { formatEuro } from "@/lib/shop-pricing";
import { SHIPPING } from "@/lib/shop-products";
import { requireShopOpen } from "@/lib/shop-gate";

export const metadata = { title: "Versand & Zahlung — zauberlabs", robots: { index: false } };

/**
 * BL-085 — shipping and payment. Text from the Writer's draft (e46 docs/copy/bl085-shop-legal-texts.md § 3) with the PO's
 * decisions of 2026-10-27; the costs are rendered from lib/shop-products.ts, so this page and the checkout never disagree.
 * German is binding. Hidden until launch.
 */
export default async function VersandZahlung({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireShopOpen();
  if (lang === "en") {
    const eur = (c: number) => formatEuro(c, "en");
    return (
      <LegalPage lang={lang} title="Shipping & payment" titleLang="en">
        <BindingNote deHref="/de/versand-zahlung" />
        <h2>Where we deliver</h2>
        <p>We deliver to Germany and all other member states of the European Union. We do not currently deliver outside the EU.</p>
        <h2>Shipping costs</h2>
        <ul className="list-disc pl-5">
          <li>Germany (Deutsche Post, letter): {eur(SHIPPING.de)}; free from a goods value of {eur(SHIPPING.deFreeFrom)}.</li>
          <li>Other EU countries (DHL small parcel): {eur(SHIPPING.eu)}.</li>
        </ul>
        <p>All prices are final prices incl. 19 % VAT, plus shipping. You see the shipping cost in the cart and on the payment page before you order.</p>
        <h2>Delivery time</h2>
        <p>Delivery takes 3–5 working days within Germany and 7–14 working days to other EU countries, after payment is received.</p>
        <h2>Payment</h2>
        <p>
          You pay on the payment page of our payment provider Stripe (Stripe Payments Europe, Ltd., Dublin, Ireland). The methods are card, PayPal, Klarna, Apple Pay
          and Google Pay; the payment step shows which are offered for your order. Payment is due when you order.
        </p>
      </LegalPage>
    );
  }
  const eur = (c: number) => formatEuro(c, "de");
  return (
    <LegalPage lang={lang} title="Versand & Zahlung">
      <h2>Liefergebiet</h2>
      <p>Wir liefern nach Deutschland und in alle anderen Mitgliedstaaten der Europäischen Union. Länder außerhalb der EU beliefern wir derzeit nicht.</p>
      <h2>Versandkosten</h2>
      <ul className="list-disc pl-5">
        <li>Deutschland (Deutsche Post, Brief): {eur(SHIPPING.de)}; versandkostenfrei ab einem Warenwert von {eur(SHIPPING.deFreeFrom)}.</li>
        <li>Andere EU-Länder (DHL Päckchen): {eur(SHIPPING.eu)}.</li>
      </ul>
      <p>Alle Preise sind Endpreise inkl. 19 % MwSt., zzgl. Versandkosten. Die Versandkosten siehst du im Warenkorb und auf der Zahlungsseite, bevor du bestellst.</p>
      <h2>Lieferzeit</h2>
      <p>Die Lieferzeit beträgt nach Zahlungseingang in Deutschland 3–5 Werktage, in andere EU-Länder 7–14 Werktage.</p>
      <h2>Zahlung</h2>
      <p>
        Du bezahlst auf der Zahlungsseite unseres Zahlungsdienstleisters Stripe (Stripe Payments Europe, Ltd., Dublin, Irland). Zur Verfügung stehen Kreditkarte,
        PayPal, Klarna, Apple Pay und Google Pay; welche Zahlungsarten für deine Bestellung angeboten werden, siehst du im Bezahlschritt. Der Betrag ist mit der
        Bestellung sofort fällig.
      </p>
    </LegalPage>
  );
}
