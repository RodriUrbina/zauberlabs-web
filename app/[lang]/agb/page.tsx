import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { BindingNote, Clause } from "@/components/shop/LegalBits";
import { OWNER } from "@/lib/legal-entity";
import { requireShopOpen } from "@/lib/shop-gate";

export const metadata = { title: "AGB — zauberlabs", robots: { index: false } };

/**
 * BL-085 — the fan shop's terms. Text drafted by the Writer (e46 docs/copy/bl085-shop-legal-texts.md § 1), with the PO's
 * decisions of 2026-10-27 and the Editor's resolutions filled in; self-drafted, not lawyer-reviewed. German is binding; /en
 * shows the convenience translation. Hidden until launch (lib/shop-flag.ts).
 */
export default async function Agb({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireShopOpen();
  const o = OWNER;
  if (lang === "en") {
    return (
      <LegalPage lang={lang} title="Terms and conditions" titleLang="en">
        <BindingNote deHref="/de/agb" />
        <p className="font-semibold text-ink">Terms and conditions for the zauberlabs fan shop</p>
        <p>As of: 27 October 2026</p>
        <Clause title="§ 1 Scope and seller">
          <p>(1) These terms apply to all orders in the fan shop on zauberlabs.de.</p>
          <p>(2) Your contract partner is {o.name}, sole trader under the zauberlabs brand, {o.street}, {o.city}, {o.country}, e-mail: {o.email}, phone: {o.phone}, VAT ID: {o.vatId} (&quot;we&quot;).</p>
          <p>(3) A consumer is any natural person who enters into a transaction for purposes mainly outside their trade, business or profession (§ 13 BGB).</p>
        </Clause>
        <Clause title="§ 2 How the contract is made">
          <p>(1) The stickers shown in the shop are not a binding offer but an invitation to order.</p>
          <p>(2) You put stickers in the cart, choose your delivery country and click &quot;Continue to payment&quot;. You are then taken to the payment page of our payment provider Stripe. There you enter your name, e-mail address, delivery address and payment details, and you see all items, the shipping cost and the total.</p>
          <p>(3) By clicking &quot;Pay&quot; you make a binding offer to buy the items in your cart.</p>
          <p>(4) The contract is made as soon as your payment succeeds. We confirm this on the confirmation page, and Stripe sends you a receipt by e-mail.</p>
          <p>(5) You correct input errors before sending: in the cart (change quantities, remove items) and on Stripe&apos;s payment page. &quot;Back&quot;, or cancelling the payment, returns you to the shop with your cart unchanged.</p>
          <p>(6) The contract language is German.</p>
          <p>(7) We do not store the contract text separately. You receive the order details with Stripe&apos;s receipt by e-mail. You can open, print or save these terms on this page at any time.</p>
        </Clause>
        <Clause title="§ 3 Prices and shipping">
          <p>(1) All prices are final prices in euro and include 19 % VAT.</p>
          <p>(2) We sell glossy die-cut vinyl stickers in four designs, about 5 × 2.5 cm, printed in Germany. Details are on the product page.</p>
          <p>(3) One sticker costs €4.90. Any three stickers together cost €12.90; a set of all 4 designs costs €16.90. The cart works out the cheapest split automatically.</p>
          <p>(4) Shipping is added:</p>
          <ul className="list-disc pl-5">
            <li>Germany: €1.90; free from a goods value of €15.00.</li>
            <li>Other EU member states: €6.90.</li>
          </ul>
          <p>(5) We deliver within the European Union only. See <Link href="/en/versand-zahlung" className="underline">&quot;Shipping &amp; payment&quot;</Link> for details.</p>
        </Clause>
        <Clause title="§ 4 Delivery">
          <p>(1) We deliver to the delivery address you enter on the payment page.</p>
          <p>(2) Delivery takes 3–5 working days within Germany and 7–14 working days to other EU countries, after payment is received. Within Germany we ship by Deutsche Post (letter), to other EU countries by DHL (small parcel).</p>
        </Clause>
        <Clause title="§ 5 Payment">
          <p>(1) You pay on Stripe&apos;s payment page (Stripe Payments Europe, Ltd., Dublin, Ireland). The methods are card, PayPal, Klarna, Apple Pay and Google Pay; the payment step shows which are offered for your order.</p>
          <p>(2) The price is due when the contract is made.</p>
        </Clause>
        <Clause title="§ 6 Retention of title">
          <p>The goods remain our property until paid in full.</p>
        </Clause>
        <Clause title="§ 7 Right of withdrawal">
          <p>As a consumer you have a right of withdrawal; see our <Link href="/en/widerrufsbelehrung" className="underline">withdrawal notice</Link>. You can withdraw online with the &quot;Withdraw from contract&quot; function (<Link href="/en/vertrag-widerrufen" className="underline">&quot;Vertrag widerrufen&quot;</Link>). If you withdraw, you bear the direct cost of returning the goods.</p>
        </Clause>
        <Clause title="§ 8 Warranty">
          <p>(1) The statutory rules on defects apply.</p>
          <p>(2) We give no additional guarantee.</p>
        </Clause>
        <Clause title="§ 9 Dispute resolution">
          <p>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
        </Clause>
        <Clause title="§ 10 Applicable law">
          <p>German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. If you are a consumer, this choice of law applies only insofar as it does not deprive you of the protection of the mandatory provisions of the country where you habitually reside.</p>
        </Clause>
      </LegalPage>
    );
  }
  return (
    <LegalPage lang={lang} title="Allgemeine Geschäftsbedingungen">
      <p className="font-semibold text-ink">Allgemeine Geschäftsbedingungen für den zauberlabs Fan-Shop</p>
      <p>Stand: 27. Oktober 2026</p>
      <Clause title="§ 1 Geltungsbereich und Vertragspartner">
        <p>(1) Diese Bedingungen gelten für alle Bestellungen im Fan-Shop auf zauberlabs.de.</p>
        <p>(2) Dein Vertragspartner ist {o.name}, Einzelunternehmer unter der Marke zauberlabs, {o.street}, {o.city}, {o.country}, E-Mail: {o.email}, Telefon: {o.phone}, USt-IdNr.: {o.vatId} („wir“).</p>
        <p>(3) Verbraucher im Sinne dieser Bedingungen ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können (§ 13 BGB).</p>
      </Clause>
      <Clause title="§ 2 Vertragsschluss">
        <p>(1) Die Darstellung der Sticker im Shop ist kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Bestellung.</p>
        <p>(2) Du legst Sticker in den Warenkorb, wählst dein Lieferland und klickst auf „Weiter zur Zahlung“. Du wirst dann auf die Zahlungsseite unseres Zahlungsdienstleisters Stripe weitergeleitet. Dort gibst du Name, E-Mail-Adresse, Lieferadresse und Zahlungsdaten ein und siehst alle Artikel, die Versandkosten und den Gesamtpreis.</p>
        <p>(3) Mit dem Klick auf den Button „Bezahlen“ gibst du ein verbindliches Angebot zum Kauf der Artikel im Warenkorb ab.</p>
        <p>(4) Der Kaufvertrag kommt zustande, sobald deine Zahlung erfolgreich ist. Wir bestätigen dir das auf der Bestätigungsseite, und Stripe schickt dir einen Beleg per E-Mail.</p>
        <p>(5) Eingabefehler korrigierst du vor dem Absenden: im Warenkorb (Menge ändern, Artikel entfernen) und auf der Zahlungsseite von Stripe. Mit „Zurück“ bzw. dem Abbrechen der Zahlung kehrst du mit unverändertem Warenkorb in den Shop zurück.</p>
        <p>(6) Vertragssprache ist Deutsch.</p>
        <p>(7) Den Vertragstext speichern wir nicht gesondert. Die Bestelldaten erhältst du mit dem Beleg von Stripe per E-Mail. Diese Bedingungen kannst du jederzeit auf dieser Seite aufrufen, ausdrucken oder speichern.</p>
      </Clause>
      <Clause title="§ 3 Preise und Versandkosten">
        <p>(1) Alle Preise sind Endpreise in Euro und enthalten die gesetzliche Umsatzsteuer von 19 %.</p>
        <p>(2) Wir verkaufen glänzende, konturgeschnittene Vinyl-Sticker in vier Motiven, ca. 5 × 2,5 cm groß, gedruckt in Deutschland. Die Einzelheiten stehen auf der Produktseite.</p>
        <p>(3) Ein Sticker kostet 4,90 €. Drei beliebige Sticker kosten zusammen 12,90 €, ein Satz aus allen 4 Motiven 16,90 €. Der Warenkorb berechnet automatisch die günstigste Aufteilung.</p>
        <p>(4) Hinzu kommen Versandkosten:</p>
        <ul className="list-disc pl-5">
          <li>Deutschland: 1,90 €; versandkostenfrei ab einem Warenwert von 15,00 €.</li>
          <li>Andere Mitgliedstaaten der Europäischen Union: 6,90 €.</li>
        </ul>
        <p>(5) Wir liefern nur innerhalb der Europäischen Union. Die Einzelheiten stehen unter <Link href="/de/versand-zahlung" className="underline">„Versand &amp; Zahlung“</Link>.</p>
      </Clause>
      <Clause title="§ 4 Lieferung">
        <p>(1) Wir liefern an die Lieferadresse, die du auf der Zahlungsseite angibst.</p>
        <p>(2) Die Lieferzeit beträgt nach Zahlungseingang in Deutschland 3–5 Werktage, in andere EU-Länder 7–14 Werktage. In Deutschland verschicken wir mit der Deutschen Post (Brief), in andere EU-Länder mit DHL (Päckchen).</p>
      </Clause>
      <Clause title="§ 5 Zahlung">
        <p>(1) Du bezahlst über die Zahlungsseite von Stripe (Stripe Payments Europe, Ltd., Dublin, Irland). Zur Verfügung stehen Kreditkarte, PayPal, Klarna, Apple Pay und Google Pay; welche Zahlungsarten im Einzelfall angeboten werden, siehst du im Bezahlschritt.</p>
        <p>(2) Der Kaufpreis ist mit Vertragsschluss sofort fällig.</p>
      </Clause>
      <Clause title="§ 6 Eigentumsvorbehalt">
        <p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.</p>
      </Clause>
      <Clause title="§ 7 Widerrufsrecht">
        <p>Als Verbraucher hast du ein Widerrufsrecht. Die Einzelheiten stehen in unserer <Link href="/de/widerrufsbelehrung" className="underline">Widerrufsbelehrung</Link>. Du kannst online über die Funktion <Link href="/de/vertrag-widerrufen" className="underline">„Vertrag widerrufen“</Link> widerrufen. Im Fall des Widerrufs trägst du die unmittelbaren Kosten der Rücksendung.</p>
      </Clause>
      <Clause title="§ 8 Gewährleistung">
        <p>(1) Es gilt das gesetzliche Mängelhaftungsrecht.</p>
        <p>(2) Eine zusätzliche Garantie geben wir nicht.</p>
      </Clause>
      <Clause title="§ 9 Streitbeilegung">
        <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </Clause>
      <Clause title="§ 10 Anwendbares Recht">
        <p>Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Bist du Verbraucher, gilt diese Rechtswahl nur, soweit dir dadurch nicht der Schutz entzogen wird, den dir zwingende Vorschriften des Staates gewähren, in dem du deinen gewöhnlichen Aufenthalt hast.</p>
      </Clause>
    </LegalPage>
  );
}
