import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/i18n";

export const metadata = { title: "Impressum — Zauberlabs", robots: { index: false } };

// TODO: fill in real details before launch (§ 5 DDG). Have this checked by a lawyer.
export default async function Impressum({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <LegalPage lang={lang} title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        [VOLLSTÄNDIGER NAME / FIRMA]
        <br />
        [STRASSE UND HAUSNUMMER]
        <br />
        [PLZ ORT]
        <br />
        Deutschland
      </p>
      <h2>Kontakt</h2>
      <p>E-Mail: {CONTACT_EMAIL}</p>
      <h2>Verantwortlich für den Inhalt</h2>
      <p>[NAME, ANSCHRIFT]</p>
      <h2>Hinweis</h2>
      <p>
        Zauberlabs ist unabhängig und steht in keiner Verbindung zur BMW AG oder einem anderen Fahrzeughersteller. Alle genannten Marken gehören
        ihren jeweiligen Inhabern.
      </p>
    </LegalPage>
  );
}
