import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Datenschutz — Zauberlabs", robots: { index: false } };

/*
 * ─── FILL IN BEFORE PUBLISHING ────────────────────────────────────────────
 * Replace every [PLACEHOLDER]. Written for what this site actually does today:
 * Vercel hosting, self-hosted fonts, Upstash Redis for votes/suggestions, one
 * vote cookie, cookieless Vercel Web Analytics (Abschnitt 5, BL-008), no other tracking, no newsletter tool.
 * E46BUILD configurator at e46.zauberlabs.de (BL-031 draft, facts from e46 master 63cf51e): website + API on Vercel
 * (functions fra1, edge delivery; API request log = method, URL incl. random car ID, host, client IP + port, no UA, in
 * Vercel runtime logs), Neon Postgres (Neon, LLC — a Databricks company) via the Vercel Marketplace (Frankfurt, AWS
 * eu-central-1): car record with random ID + optional label, attributes/answers, build items with seller-offer snapshot;
 * free-text box parsed in memory, not stored; no account/name/email/IP/cookie ID stored; no cookies, no web storage;
 * Vercel Web Analytics (see Abschnitt 5), no other tracking; self-hosted fonts; links to external sellers.
 * If you add another analytics tool, a newsletter tool, embeds or ads, this page must be updated.
 * Boilerplate only, not legal advice — have it checked if you're unsure.
 */
const C = {
  name: "Alvaro Hernandez",
  street: "Anton-Wilhelm-Amo-Straße 50",
  city: "10117 Berlin",
  email: "hello@zauberlabs.de",
  vatId: "DE452363836",
  // Supervisory authority of YOUR federal state, e.g. Hessen → "Der Hessische Beauftragte für Datenschutz und Informationsfreiheit"
  authority: "Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin (www.datenschutz-berlin.de)",
  updated: "Oktober 2026",
};

export default async function Datenschutz({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <LegalPage lang={lang} title="Datenschutzerklärung">
      {lang === "en" && <p className="italic">This privacy policy is provided in German.</p>}

      <h2>1. Verantwortlicher</h2>
      <p>
        {C.name}, {C.street}, {C.city}, Deutschland
        <br />
        E-Mail: <a className="underline" href={`mailto:${C.email}`}>{C.email}</a>
        <br />
        Umsatzsteuer-Identifikationsnummer: {C.vatId}
      </p>

      <h2>2. Überblick</h2>
      <p>
        Wir verarbeiten personenbezogene Daten nur, soweit es für den Betrieb dieser Website und ihrer Funktionen nötig ist. Zur Reichweitenmessung
        nutzen wir ausschließlich Vercel Web Analytics, das ohne Cookies arbeitet (Abschnitt 5). Darüber hinaus setzen wir keine Tracking- oder
        Werbe-Tools ein und verkaufen keine Daten.
      </p>

      <h2>3. Hosting und Server-Logfiles</h2>
      <p>
        Diese Website wird bei Vercel Inc. (USA) gehostet. Die Serverfunktionen dieser Website (Abstimmung, Vorschläge) laufen in Frankfurt am Main
        (Vercel-Region „fra1“); statische Seiten liefert Vercel über sein weltweites Netz aus Zwischenspeichern aus. Dasselbe gilt für unseren
        Konfigurator E46BUILD unter e46.zauberlabs.de: Website und Programmierschnittstelle (API) laufen ebenfalls bei Vercel, die Serverfunktionen
        in Frankfurt am Main (Region „fra1“), die Auslieferung über Vercels weltweites Netz. Beim Aufruf der Seiten verarbeitet Vercel
        technisch notwendige Daten, insbesondere IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Referrer sowie Browser- und
        Betriebssysteminformationen. Dies ist erforderlich, um die Website auszuliefern, ihre Sicherheit zu gewährleisten und Missbrauch
        abzuwehren. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb).
      </p>
      <p>
        Mit Vercel besteht ein Vertrag zur Auftragsverarbeitung. Eine Übermittlung in die USA ist möglich; sie erfolgt auf Grundlage des
        EU-US Data Privacy Framework bzw. der EU-Standardvertragsklauseln. Weitere Informationen: https://vercel.com/legal/privacy-policy
      </p>
      <p>
        Die Programmierschnittstelle (API) von E46BUILD schreibt zusätzlich ein eigenes Zugriffsprotokoll: je Anfrage Methode, aufgerufene Adresse
        (einschließlich der zufälligen Kennung einer Konfiguration), Host sowie IP-Adresse und Port des Aufrufers – ohne Browserkennung. Diese
        Protokolle liegen in den Laufzeit-Logs von Vercel; die Aufbewahrungsdauer richtet sich nach dem Vercel-Tarif [PO to confirm: Dauer].
        Rechtsgrundlage ist auch hier Art. 6 Abs. 1 lit. f DSGVO (Sicherheit und Betrieb).
      </p>

      <h2>4. Schriftarten</h2>
      <p>Alle Schriftarten werden lokal von unserem Server ausgeliefert. Es findet keine Verbindung zu Servern von Google oder anderen Drittanbietern statt.</p>

      {/* BL-008 — wording drafted from https://vercel.com/docs/analytics/privacy-policy (version of 2026-06-26): no cookies,
          visitors grouped by a hash built from the request and discarded after 24 h, aggregated data only, no cross-site tracking. */}
      <h2>5. Reichweitenmessung (Vercel Web Analytics)</h2>
      <p>
        Um zu verstehen, welche Seiten gelesen werden, nutzen wir Vercel Web Analytics, einen Dienst der Vercel Inc. (USA), die auch unsere Website
        hostet. Der Dienst setzt keine Cookies. Bei jedem Seitenaufruf werden erfasst: Zeitpunkt, aufgerufene
        Seite und verweisende Seite (Referrer), gefilterte URL-Parameter, ungefährer Standort (Land, Region, Stadt), Betriebssystem und Browser
        jeweils mit Version, Gerätetyp (Desktop, Tablet oder Mobil) sowie die Version des Analyse-Skripts. Mehrere Aufrufe desselben Besuchs werden über einen aus der Anfrage gebildeten Hash-Wert
        zusammengefasst, der nach 24 Stunden verworfen wird; deine IP-Adresse wird nicht zusammen mit diesen Daten gespeichert, und eine Wiedererkennung über andere
        Websites hinweg oder eine Zuordnung zu deiner Person ist nicht möglich. Wir sehen ausschließlich zusammengefasste Statistiken.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, die Nutzung unserer Website zu verstehen und sie zu verbessern). Da
        der Dienst keine Cookies setzt, ist dafür keine Einwilligung nach § 25 TDDDG erforderlich. Es gilt der mit Vercel geschlossene Vertrag zur Auftragsverarbeitung (siehe Abschnitt 3). Weitere Informationen:
        https://vercel.com/docs/analytics/privacy-policy
      </p>

      <h2>6. Community-Voting</h2>
      <p>
        Du kannst abstimmen, welches Auto wir als Nächstes umsetzen. Damit jede Person pro Auto nur einmal abstimmen kann, setzen wir beim
        Abstimmen ein Cookie namens „zl_vid“ mit einer zufälligen Kennung (Speicherdauer: 12 Monate). Es enthält keine Angaben zu deiner Person
        und wird nicht für Tracking verwendet. Das Cookie ist für die von dir ausdrücklich gewünschte Abstimmfunktion unbedingt erforderlich
        (§ 25 Abs. 2 Nr. 2 TDDDG); die weitere Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Dieselbe zufällige Kennung
        speichern wir außerdem auf unserem Server zu jedem Auto, für das du abgestimmt hast, ohne Ablaufdatum – nur so können wir Doppelstimmen
        verhindern; deiner Person lässt sie sich nicht zuordnen.
      </p>
      <p>
        Zum Schutz vor Missbrauch (z. B. automatisierten Massenabstimmungen) wird deine IP-Adresse ausschließlich in gehashter (unkenntlich gemachter) Form
        verarbeitet und nach spätestens 10 Minuten gelöscht. Rückschlüsse auf deine Person sind uns dadurch nicht möglich. Rechtsgrundlage ist
        Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h2>7. Autovorschläge</h2>
      <p>
        Wenn du uns über das Formular ein Auto vorschlägst, speichern wir deinen Text und – nur falls du sie angibst – deine E-Mail-Adresse, um
        dich zu informieren, wenn wir dieses Auto umsetzen. Zusammen mit dem Vorschlag speichern wir außerdem die Sprache der Seite (Deutsch oder
        Englisch) und den Zeitpunkt des Vorschlags. Die Angabe der E-Mail-Adresse ist freiwillig; Rechtsgrundlage ist deine Einwilligung
        (Art. 6 Abs. 1 lit. a DSGVO). Du kannst sie jederzeit per E-Mail an {C.email} widerrufen; wir löschen deine Adresse dann umgehend,
        spätestens jedoch, wenn der Zweck entfallen ist.
      </p>
      <p>
        Vorschläge werden erst nach unserer Prüfung veröffentlicht, und zwar nur als Name des Fahrzeugmodells im Community-Voting – ohne
        Bezug zu deiner Person und niemals zusammen mit deiner E-Mail-Adresse.
      </p>

      <h2>8. Datenbank-Dienstleister</h2>
      <p>
        Abstimmungen und Vorschläge werden bei Upstash, Inc. (USA) in einem Rechenzentrum in Frankfurt am Main gespeichert. Mit Upstash besteht
        ein Vertrag zur Auftragsverarbeitung; soweit ein Zugriff aus den USA möglich ist, erfolgt er auf Grundlage der EU-Standardvertragsklauseln.
        Weitere Informationen: https://upstash.com
      </p>

      {/* BL-031 DRAFT — E46BUILD configurator. Facts from the e46 code (master 63cf51e) and Neon/Databricks legal pages (2026-10-06).
          Items marked [PO to confirm] are not asserted; the PO verifies them before merge. */}
      <h2>9. E46BUILD-Konfigurator (e46.zauberlabs.de)</h2>
      <p>
        Unser Konfigurator E46BUILD läuft unter e46.zauberlabs.de. Ohne Konto und ohne Anmeldung kannst du dort dein Auto beschreiben und eine
        Konfiguration zusammenstellen. Im Feld „Beschreibe dein Auto“ kannst du frei tippen (z. B. „2001 325i Touring“); dieser Text wird an unseren
        Server geschickt, dort nur im Arbeitsspeicher in Vorschläge für Karosserie, Modell und Baujahr zerlegt und nicht gespeichert. Gespeichert
        werden nur die Angaben, die du bestätigst oder aus Listen auswählst: Karosserieform, Modell, Baujahr und deine Antworten auf Passform-Fragen
        (z. B. die Scheinwerferform), sowie die Teile, die du in deine Konfiguration legst – je Teil das Produkt und ein Abbild des gewählten
        Händlerangebots (Händlername, Link zum Angebot, Preis). Jede Konfiguration erhält dafür eine zufällige Kennung und optional eine Bezeichnung,
        die du selbst vergibst.
      </p>
      <p>
        Mit der Konfiguration werden kein Konto, kein Name, keine E-Mail-Adresse, keine IP-Adresse, keine Cookie-Kennung und kein Freigabelink
        gespeichert; die zufällige Kennung existiert nur im Speicher deiner geöffneten Seite. Ein Bezug zu deiner Person entsteht dadurch nicht, es sei
        denn, du trägst selbst personenbezogene Angaben in die Bezeichnung ein. Die Konfigurationen liegen in unserer Datenbank (Abschnitt 10) und
        werden gespeichert, bis sie gelöscht werden; sie sind nicht mit einer Person verknüpft [PO to confirm: Formulierung und Löschkonzept].
        Technische Zugriffsdaten fallen beim Hosting an (Abschnitt 3). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am
        Betrieb und an der Verbesserung des Konfigurators).
      </p>
      <p>
        E46BUILD verwendet keine Nutzerkonten und keinen Anmeldedienst, setzt keine Cookies und legt nichts im lokalen Speicher deines Browsers ab. Zur
        Reichweitenmessung nutzt auch e46.zauberlabs.de Vercel Web Analytics – ohne Cookies, nur zusammengefasste Seitenaufrufe und Besucherzahlen;
        es gilt Abschnitt 5. Darüber hinaus setzt E46BUILD keine Tracking- oder Analyse-Tools ein. Schriftarten werden lokal ausgeliefert; es findet
        keine Verbindung zu Google Fonts statt. Angebote im Konfigurator verlinken auf die Websites externer Händler; sobald du einem solchen Link
        folgst, gelten deren Datenschutzbestimmungen (Abschnitt 12).
      </p>

      <h2>10. Datenbank-Dienstleister für E46BUILD (Neon)</h2>
      <p>
        Die Daten des Konfigurators (Abschnitt 9) werden bei Neon, LLC (USA; ein Unternehmen von Databricks, Inc.) gespeichert, eingerichtet über den
        Vercel Marketplace, in einem Rechenzentrum in Frankfurt am Main (AWS-Region eu-central-1). Databricks, Inc. und Neon, LLC sind nach dem EU-US
        Data Privacy Framework zertifiziert; für Kunden bietet Databricks einen Vertrag zur Auftragsverarbeitung mit EU-Standardvertragsklauseln an
        [PO to confirm: Annahme des AVV für unser Konto – automatisch über den Vercel Marketplace oder in der Neon-Konsole]. Weitere Informationen:
        https://www.databricks.com/legal/privacynotice
      </p>

      <h2>11. Kontakt per E-Mail</h2>
      <p>
        Wenn du uns per E-Mail kontaktierst, verarbeiten wir deine Angaben zur Bearbeitung deiner Anfrage (Art. 6 Abs. 1 lit. b bzw. f DSGVO)
        und löschen sie, sobald sie nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten bestehen.
      </p>

      <h2>12. Externe Links</h2>
      <p>
        Unsere Konfiguratoren verlinken auf externe Händler und Plattformen. Erst wenn du einen solchen Link anklickst, verlässt du unsere
        Website; ab dann gelten die Datenschutzbestimmungen des jeweiligen Anbieters.
      </p>

      <h2>13. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) sowie auf Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Eine erteilte
        Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen. Schreib uns dazu einfach an {C.email}.
      </p>
      <p>
        Außerdem hast du das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, zum Beispiel bei: {C.authority}.
      </p>

      <h2>14. Aktualität</h2>
      <p>Stand: {C.updated}. Wir passen diese Erklärung an, wenn sich unsere Website oder die Rechtslage ändert.</p>
    </LegalPage>
  );
}
