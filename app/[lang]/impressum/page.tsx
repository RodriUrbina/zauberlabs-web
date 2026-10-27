import LegalPage from "@/components/LegalPage";
import { OWNER } from "@/lib/legal-entity";
import Link from "next/link";
import { SHOP_LAUNCHED } from "@/lib/shop-flag";

export const metadata = { title: "Impressum — zauberlabs", robots: { index: false } };

/*
 * ─── FILL IN BEFORE PUBLISHING ────────────────────────────────────────────
 * Replace every [PLACEHOLDER]. Delete blocks marked "optional" that don't apply.
 * Boilerplate only, not legal advice — have it checked if you're unsure.
 */

export default async function Impressum({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <LegalPage lang={lang} title="Impressum">
      {lang === "en" && <p className="italic">This legal notice is provided in German, as required for German websites.</p>}

      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {OWNER.name}
        <br />
        {OWNER.street}
        <br />
        {OWNER.city}
        <br />
        {OWNER.country}
      </p>
      {OWNER.representative && <p>Vertreten durch: {OWNER.representative}</p>}
      {OWNER.register && <p>Registereintrag: {OWNER.register}</p>}

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a className="underline" href={`mailto:${OWNER.email}`}>{OWNER.email}</a>
        <br />
        Telefon: {OWNER.phone}
      </p>

      {OWNER.vatId && (
        <>
          <h2>Umsatzsteuer-ID</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: {OWNER.vatId}</p>
        </>
      )}

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        {OWNER.name}
        <br />
        {OWNER.street}, {OWNER.city}
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte – insbesondere
        von Passform- und Teileangaben – können wir jedoch keine Gewähr übernehmen. Maßgeblich sind stets die Angaben des jeweiligen Herstellers bzw.
        Verkäufers. Als Diensteanbieter sind wir für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Unsere Konfiguratoren verlinken auf Angebote externer Händler und Plattformen, auf deren Inhalte wir keinen Einfluss haben. Für diese
        fremden Inhalte ist stets der jeweilige Anbieter oder Betreiber verantwortlich.{" "}
        {/* BL-085 (flag-only; plan § 6): with the fan shop launched, the old sentence would be untrue, so it names the shop. */}
        {SHOP_LAUNCHED ? (
          <>
            Kaufverträge über Teile, die du über Links in unseren Konfiguratoren findest, kommen ausschließlich zwischen dir und dem jeweiligen Händler zustande;
            diese Teile verkaufen wir nicht. Artikel aus unserem Fan-Shop verkaufen wir selbst (Angaben oben); dafür gelten unsere{" "}
            <Link href={`/${lang}/agb`} className="underline">AGB</Link>.
          </>
        ) : (
          "Kaufverträge kommen ausschließlich zwischen dir und dem jeweiligen Händler zustande; wir verkaufen keine Teile."
        )}{" "}
        Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.
      </p>

      {/* optional — keep only if the configurators use affiliate links (e.g. eBay Partner Network) */}
      <h2>Hinweis zu Partnerlinks</h2>
      <p>
        Einige Links zu externen Händlern können sogenannte Affiliate-Links sein. Kaufst du über einen solchen Link, erhalten wir unter Umständen
        eine Provision. Für dich ändert sich der Preis dadurch nicht. Als Partner im eBay Partner Network verdienen wir an qualifizierten Käufen.
      </p>

      <h2>Marken</h2>
      <p>
        zauberlabs ist ein unabhängiges Angebot und steht in keiner Verbindung zur BMW AG oder einem anderen Fahrzeughersteller. Alle genannten
        Marken, Modellbezeichnungen und Logos sind Eigentum ihrer jeweiligen Inhaber und werden nur zur Beschreibung der Fahrzeuge verwendet.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung und
        Verbreitung außerhalb der Grenzen des Urheberrechts bedürfen unserer schriftlichen Zustimmung.
      </p>
    </LegalPage>
  );
}
