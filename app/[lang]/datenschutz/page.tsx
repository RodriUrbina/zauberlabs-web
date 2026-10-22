import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Datenschutz — zauberlabs", robots: { index: false } };

/*
 * ─── FILL IN BEFORE PUBLISHING ────────────────────────────────────────────
 * Replace every [PLACEHOLDER]. Written for what this site actually does today:
 * Vercel hosting, self-hosted fonts, Upstash Redis for votes/suggestions, one
 * vote cookie, cookieless Vercel Web Analytics (Abschnitt 5, BL-008), no other tracking, no newsletter tool.
 * E46BUILD configurator at e46.zauberlabs.de (BL-031, PO-approved 2026-10-07; facts from e46 master 63cf51e): website + API on Vercel
 * (functions fra1, edge delivery; API request log = method, URL incl. random car ID, host, client IP + port, no UA, in
 * Vercel runtime logs), Neon Postgres (Neon, LLC — a Databricks company) via the Vercel Marketplace (Frankfurt, AWS
 * eu-central-1): car record with random ID + optional label, attributes/answers, build items with seller-offer snapshot;
 * free-text box parsed in memory, not stored; no account/name/email/IP/cookie ID stored; no cookies, no web storage;
 * Vercel Web Analytics (see Abschnitt 5), no other tracking; self-hosted fonts; links to external sellers.
 * BL-043 (E46 T-078, PO-approved 2026-10-12): optional E46BUILD owner accounts — email, passwordless sign-in link (15 min), session cookie
 * (60 days, no IP/UA stored), keyed-hash rate limits, sign-in emails via Brevo (Abschnitt 12). Accounts off until this text is live.
 * BL-044 (PO decision 2026-10-14): E46BUILD reads the visitor's country from Vercel's x-vercel-ip-country header to show which
 * sellers deliver there; not stored (Abschnitt 10). Must be live before the next e46build production promotion.
 * BL-050: one Vercel Web Analytics custom event, "configurator_click" with only { configurator }, described in Abschnitt 5.
 * BL-051: own anonymous statistics (Abschnitt 6): daily counters in Upstash, salted daily hash only inside a HyperLogLog.
 * BL-052 (E46 T-106): optional seller notices for signed-in owners — part, build, delivery country (detected from the IP, not confirmed by the owner), date; the PO emails owners by hand
 * from hello@zauberlabs.de (no automatic notifier, no Brevo); stopped ones deleted at once, open ones after 12 months (Abschnitt 10).
 * T-108.1 (E46 API 367d665): the operator sees email, part, build label, request day and country on a protected admin page, only
 * where a seller now delivers there; nothing new collected, copied, cached, logged or shared; emailed + marked → kept 30 days, then deleted.
 * BL-061 (DRAFT): eBay Partner Network links in E46BUILD (Abschnitt 14); we set no cookies and store no clicks for them.
 * BL-062 (eBay listings, T-102.5): server-side Browse API with part numbers + delivery country only; cache ≤ 3 h; images via our proxy (Abschnitt 14).
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
        nutzen wir Vercel Web Analytics (Abschnitt 5) und eine eigene Zählung (Abschnitt 6); beide arbeiten ohne Cookies. Darüber hinaus setzen wir keine Tracking- oder
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
        technischen Zugriffsprotokolle verarbeitet Vercel für uns und speichert sie für die Dauer der Log-Aufbewahrung von Vercel (derzeit
        höchstens 1 Tag). Rechtsgrundlage ist auch hier Art. 6 Abs. 1 lit. f DSGVO (Sicherheit und Betrieb).
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
        Außerdem zählen wir, wie oft ein Link zu einem unserer Konfiguratoren (z. B. E46BUILD) angeklickt wird: Dabei wird ein Ereignis an Vercel Web
        Analytics übermittelt, das nur den Namen des Konfigurators enthält, zusammen mit denselben Angaben wie bei einem Seitenaufruf.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, die Nutzung unserer Website zu verstehen und sie zu verbessern). Da
        der Dienst keine Cookies setzt, ist dafür keine Einwilligung nach § 25 TDDDG erforderlich. Es gilt der mit Vercel geschlossene Vertrag zur Auftragsverarbeitung (siehe Abschnitt 3). Weitere Informationen:
        https://vercel.com/docs/analytics/privacy-policy
      </p>

      {/* BL-051 — own anonymous statistics (PO decision 2026-10-19, option A: daily salted hash in a HyperLogLog, salt deleted
          after 24 h, 13-month retention). Text as drafted by the Builder and approved in principle by the PO; the § 25 TDDDG
          question is with the lawyer brief and deliberately not stated here. Code: app/api/m, lib/metrics*.ts. */}
      <h2>6. Eigene Reichweitenmessung</h2>
      <p>
        Zusätzlich zu Vercel Web Analytics zählen wir selbst, wie unsere Artikel gelesen werden. Beim Aufruf eines Artikels sendet dein Browser
        eine kurze Meldung an unseren Server: welcher Artikel in welcher Sprache aufgerufen wurde und von welcher Website du kamst – nur deren
        Domainname, z. B. google.com. Beim Verlassen der Seite meldet er, wie lange der Artikel ungefähr aktiv angezeigt wurde und ob du bis zum
        Ende gelesen hast. Klicks auf Links zu unseren Konfiguratoren zählen wir ebenso. Dein ungefähres Land, das unser Hoster aus deiner
        IP-Adresse ableitet, zählen wir getrennt von allen anderen Angaben. Gibst du eine Stimme im Community-Voting ab, zählen wir außerdem pro
        Tag, für welches Auto abgestimmt wurde, von welcher Website du auf unsere Seite gekommen bist (nur der Domainname) und – getrennt davon –
        dein ungefähres Land; diese Zähler sind nicht mit der zufälligen Kennung aus Abschnitt 7 verknüpft.
      </p>
      <p>
        Gespeichert werden ausschließlich Tageszähler (z. B. „Artikel X: 42 Aufrufe“) bei unserem Datenbank-Dienstleister (Abschnitt 9); Daten
        einzelner Besucher legen wir nicht ab, und wir setzen keine Cookies und speichern nichts in deinem Browser. Um mehrfache Aufrufe desselben
        Lesers an einem Tag nur einmal zu zählen, bilden wir aus deiner IP-Adresse, der Kennung deines Browsers und einem täglich wechselnden
        Zufallswert einen Hash-Wert. Er fließt nur in eine statistische Zählstruktur ein, aus der er sich nicht zurückgewinnen lässt; der
        Zufallswert wird nach 24 Stunden gelöscht. Dafür speichern wir deine IP-Adresse nicht. Die Tageszähler löschen wir nach 13 Monaten.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, zu verstehen, welche Artikel gelesen werden, und sie zu
        verbessern).
      </p>

      <h2>7. Community-Voting</h2>
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

      <h2>8. Autovorschläge</h2>
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

      <h2>9. Datenbank-Dienstleister</h2>
      <p>
        Abstimmungen, Vorschläge und die Tageszähler unserer eigenen Reichweitenmessung (Abschnitt 6) werden bei Upstash, Inc. (USA) in einem Rechenzentrum in Frankfurt am Main gespeichert. Mit Upstash besteht
        ein Vertrag zur Auftragsverarbeitung; soweit ein Zugriff aus den USA möglich ist, erfolgt er auf Grundlage der EU-Standardvertragsklauseln.
        Weitere Informationen: https://upstash.com
      </p>

      {/* BL-031 — E46BUILD configurator. Facts from the e46 code (master 63cf51e) and the Neon/Databricks privacy notice (2026-10-06).
          Wording approved by the PO 2026-10-07: Vercel plan Pro without Observability Plus → runtime-log retention 1 day
          (https://vercel.com/docs/logs/runtime, 2026-08-28: Hobby 1 h, Pro 1 day, Pro + Observability Plus 30 days, Enterprise 3 days);
          Neon DPA with SCCs accepted; records kept indefinitely without personal reference (the planned 30-day cleanup, E46 T-066, was
          cancelled by the PO). */}
      <h2>10. E46BUILD-Konfigurator (e46.zauberlabs.de)</h2>
      <p>
        Unser Konfigurator E46BUILD läuft unter e46.zauberlabs.de. Ohne Konto und ohne Anmeldung kannst du dort dein Auto beschreiben und eine
        Konfiguration zusammenstellen. Im Feld „Beschreibe dein Auto“ kannst du frei tippen (z. B. „2001 325i Touring“); dieser Text wird an unseren
        Server geschickt, dort nur im Arbeitsspeicher in Vorschläge für Karosserie, Modell und Baujahr zerlegt und nicht gespeichert. Gespeichert
        werden nur die Angaben, die du bestätigst oder aus Listen auswählst: Karosserieform, Modell, Baujahr und deine Antworten auf Passform-Fragen
        (z. B. die Scheinwerferform), sowie die Teile, die du in deine Konfiguration legst – je Teil das Produkt und ein Abbild des gewählten
        Händlerangebots (Händlername, Link zum Angebot, Preis). Jede Konfiguration erhält dafür eine zufällige Kennung und optional eine Bezeichnung,
        die du selbst vergibst. Wir verwenden dein ungefähres Land, das unser Hoster aus deiner IP-Adresse ableitet, nur um anzuzeigen, welche
        Verkäufer zu dir liefern. Dafür speichern wir deine IP-Adresse nicht, und dein Land nur, wenn du eine Benachrichtigung über einen
        Verkäufer anforderst (siehe unten).
      </p>
      <p>
        Bei Konfigurationen ohne Konto werden kein Name, keine E-Mail-Adresse, keine IP-Adresse, keine Cookie-Kennung und kein Freigabelink
        gespeichert; die zufällige Kennung existiert nur im Speicher deiner geöffneten Seite. Konfigurationen ohne Konto bewahren wir ohne
        Personenbezug auf, um zu verstehen, was Besitzer konfigurieren und kaufen möchten, und um den Dienst zu
        verbessern – so lange, wie sie für diesen Zweck erforderlich sind. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am
        Betrieb und an der Verbesserung des Konfigurators). Ohne Konto ist ein Bezug zu deiner Person nur vorübergehend möglich: Für höchstens einen Tag enthält
        das Zugriffsprotokoll des Hostings (Abschnitt 3) deine IP-Adresse zusammen mit der zufälligen Kennung in der aufgerufenen Adresse; nach Ablauf
        dieser Log-Aufbewahrung lassen sich die Datensätze keiner Person mehr zuordnen – es sei denn, du trägst selbst personenbezogene Angaben in die
        Bezeichnung ein. Die Konfigurationen liegen in unserer Datenbank (Abschnitt 11).
      </p>
      <p>
        Ohne Konto setzt E46BUILD keine Cookies und legt nichts im lokalen Speicher deines Browsers ab; für ein Konto siehe den folgenden Absatz. Zur
        Reichweitenmessung nutzt auch e46.zauberlabs.de Vercel Web Analytics – ohne Cookies, nur zusammengefasste Seitenaufrufe und Besucherzahlen;
        es gilt Abschnitt 5. Darüber hinaus setzt E46BUILD keine Tracking- oder Analyse-Tools ein. Schriftarten werden lokal ausgeliefert; es findet
        keine Verbindung zu Google Fonts statt. Angebote im Konfigurator verlinken auf die Websites externer Händler; sobald du einem solchen Link
        folgst, gelten deren Datenschutzbestimmungen (Abschnitt 14).
      </p>

      {/* BL-043 — owner accounts (E46 card T-078). Text from e46build docs/legal/t078-lawyer-review.md § 6, adjusted per the
          Coordinator's brief and approved by the PO on 2026-10-12 (T-078.6b live in production a5ad73d; Brevo DPA in place).
          E46BUILD accounts are switched on in production only once this text is live. */}
      <p>
        <strong>Konto (optional): Konfigurationen speichern.</strong> Den Konfigurator kannst du ohne Konto nutzen. Nur wenn du eine Konfiguration
        speichern möchtest („Meinen Build speichern“), legst du ein Konto an. Dafür verarbeiten wir deine E-Mail-Adresse: Wir senden dir einen
        einmaligen Anmeldelink (gültig 15 Minuten) und verknüpfen deine gespeicherten Konfigurationen mit deinem Konto, damit du sie auf jedem Gerät
        wieder öffnen kannst. Ein Passwort gibt es nicht. Solange du angemeldet bist, werden neue Konfigurationen automatisch in deinem Konto
        gespeichert.
      </p>
      <p>
        Für die Anmeldung setzen wir ein technisch notwendiges Cookie, das dich bis zu 60 Tage angemeldet hält (bei Nutzung verlängert) und beim
        Abmelden oder Löschen des Kontos entfernt wird. Zu deinem Konto und zur Anmeldung speichern wir weder IP-Adresse noch Browserkennung. Um
        Missbrauch der Anmelde-E-Mails zu verhindern, zählen wir Anfragen je E-Mail-Adresse und je IP-Adresse; dabei speichern wir nur einen mit einem
        geheimen Schlüssel gebildeten Prüfwert (Hash), nicht die Adresse selbst, und löschen ihn in der Regel nach etwa einem Tag.
      </p>
      <p>
        Die Anmelde-E-Mails versenden wir über Brevo als Auftragsverarbeiter (Abschnitt 12); Absender ist hello@zauberlabs.de. Sie enthalten nur den
        Anmeldelink – keine Werbung. Brevo kann technisch erfassen, ob eine Anmelde-E-Mail geöffnet und ob der Link darin angeklickt wurde; diese
        Angaben nutzen wir nicht.
      </p>
      <p>
        Rechtsgrundlage für Konto, Anmeldung und gespeicherte Konfigurationen ist Art. 6 Abs. 1 lit. b DSGVO, für den Missbrauchsschutz Art. 6 Abs. 1
        lit. f DSGVO. Deine Daten bleiben gespeichert, bis du dein Konto löschst. Auf der Seite „Meine Builds“ kannst du jederzeit deine Daten
        herunterladen, einzelne Konfigurationen aus deinem Konto entfernen oder dein Konto löschen. Beim Löschen entfernen wir deine E-Mail-Adresse und
        alle Anmeldedaten; deine Konfigurationen bleiben ohne Bezug zu dir und ohne von dir eingegebene Freitexte erhalten (siehe oben). Die Daten liegen
        in unserer Datenbank (Abschnitt 11).
      </p>
      {/* BL-052 — E46 T-106 "Notify me when a seller is found". Based on the draft in e46build docs/plans/t106-notify-when-seller-found.md § 6
          (master 889252d), shortened, with the PO's facts of 2026-10-19. Lawyer question Q17 (service message vs. advertising) is open. */}
      <p>
        <strong>Benachrichtigung, wenn ein Verkäufer gefunden ist (optional).</strong> Gibt es für ein passendes Teil noch keinen Verkäufer, kannst
        du dich mit deinem Konto benachrichtigen lassen. Dafür speichern wir zu deinem Konto, für welche Konfiguration und welches Teil du
        benachrichtigt werden möchtest, das Land, in das geliefert werden soll (wie oben beschrieben aus deiner IP-Adresse abgeleitet, falls erkannt), und das Datum.
        Gibt es einen Verkäufer, der das Teil anbietet und in dieses Land liefert, sehen nur wir als Betreiber auf einer geschützten Admin-Seite deine
        E-Mail-Adresse, das Teil, die Bezeichnung deiner Konfiguration, den Tag deiner Anfrage und das Land, um dir von hello@zauberlabs.de eine E-Mail
        zu schreiben. Dafür erheben wir keine weiteren Daten; nichts davon wird kopiert, zwischengespeichert, protokolliert oder an Dritte weitergegeben.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Du kannst Benachrichtigungen jederzeit auf „Meine Builds“ beenden.
        Beendest du eine Benachrichtigung, löschen wir sie sofort. Offene Benachrichtigungen enden nach 12 Monaten und werden dann gelöscht. Nachdem wir dir
        geschrieben haben, bleibt die Benachrichtigung noch 30 Tage gespeichert, damit du auf „Meine Builds“ siehst, dass ein Verkäufer gefunden wurde, und wird dann gelöscht.
        Beim Löschen deines Kontos oder beim Entfernen der Konfiguration aus deinem Konto löschen wir sie sofort. Es bleibt nur eine anonyme Zählung ohne
        Bezug zu dir. Deine Benachrichtigungen sind Teil deines Datenexports.
      </p>

      <h2>11. Datenbank-Dienstleister für E46BUILD (Neon)</h2>
      <p>
        Die Daten des Konfigurators (Abschnitt 10) werden bei Neon, LLC (USA; ein Unternehmen von Databricks, Inc.) gespeichert, eingerichtet über den
        Vercel Marketplace, in einem Rechenzentrum in Frankfurt am Main (AWS-Region eu-central-1). Mit Neon besteht ein Vertrag zur Auftragsverarbeitung
        einschließlich der EU-Standardvertragsklauseln; Databricks, Inc. und Neon, LLC sind zudem nach dem EU-US Data Privacy Framework zertifiziert.
        Weitere Informationen:
        https://www.databricks.com/legal/privacynotice
      </p>

      <h2>12. E-Mail-Versand für E46BUILD (Brevo)</h2>
      <p>
        Die Anmelde-E-Mails für E46BUILD-Konten (Abschnitt 10) versenden wir über Brevo (Paris, Frankreich) als Auftragsverarbeiter. Dabei verarbeitet
        Brevo deine E-Mail-Adresse, den Betreff und den Anmeldelink. Mit Brevo besteht ein Vertrag zur Auftragsverarbeitung.
      </p>

      <h2>13. Kontakt per E-Mail</h2>
      <p>
        Wenn du uns per E-Mail kontaktierst, verarbeiten wir deine Angaben zur Bearbeitung deiner Anfrage (Art. 6 Abs. 1 lit. b bzw. f DSGVO)
        und löschen sie, sobald sie nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten bestehen.
      </p>

      <h2>14. Externe Links</h2>
      <p>
        Unsere Konfiguratoren verlinken auf externe Händler und Plattformen. Erst wenn du einen solchen Link anklickst, verlässt du unsere
        Website; ab dann gelten die Datenschutzbestimmungen des jeweiligen Anbieters.
      </p>
      {/* BL-061 (DRAFT; release together with E46BUILD T-123) — adapted from e46build
          docs/plans/t091-6-epn-phase1.md § 6 (branch agent-2/T-091.6-epn-plan, 0c7b09e), du form; updated 2026-10-21 for T-123 (eBay
          SEARCH links on part pages). EPN privacy-notice URL supplied by the PO (agents may not open eBay pages). The consent question is in
          the lawyer brief. */}
      <p>
        <strong>eBay Partner Network.</strong> Auf den Teile-Seiten von E46BUILD führen einige Links zu einer passenden Suche auf eBay. Diese Links
        enthalten eine Kennung des eBay Partner Network (eBay Partner Network, Inc., USA), damit eBay einen Kauf unserem Angebot zuordnen kann; wir
        erhalten dafür unter Umständen eine Provision, der Preis ändert sich für dich nicht. Wir selbst setzen dafür keine Cookies und speichern keine
        Klicks auf diese Links. Erst wenn du einen solchen Link anklickst, verarbeitet eBay auf seinen Seiten Daten (z. B. Cookies, Klick- und
        Kaufdaten) nach seinen eigenen Bestimmungen; siehe den Datenschutzhinweis des eBay Partner Network:
        https://partnernetwork.ebay.com/page/network-agreement#privacy-notice. Informationen zum Widerspruch findest du im Datenschutzhinweis des eBay
        Partner Network (Link oben).
      </p>
      {/* BL-062 (Coordinator 2026-10-22; e46build T-102.5, apps/api/src/ebay/browse.ts on master 4392b212, read-only): live eBay
          listings via the Browse API, server-side; part numbers + delivery country only; cache ≤ 3 h, never shown after 6 h;
          images via our proxy; affiliate links. */}
      <p>
        <strong>eBay-Angebote in E46BUILD.</strong> Für manche Teile (zunächst Felgen) zeigt E46BUILD zusätzlich aktuelle Angebote von eBay, die zu
        deinem Auto passen. Dafür fragt unser Server – nicht dein Browser – die Programmierschnittstelle von eBay ab und übermittelt dabei nur unsere
        BMW-Teilenummern und das Lieferland. Das Land leitet unser Hoster aus deiner IP-Adresse ab (siehe Abschnitt 10); deine IP-Adresse selbst,
        Cookies oder Kontodaten werden nicht an eBay übermittelt. Die Ergebnisse speichern wir auf unserem Server höchstens 3 Stunden zwischen, und
        Angebote, die älter als 6 Stunden sind, zeigen wir nie an. Den Namen des Verkäufers zeigen wir nur an. Die Bilder der Angebote laden wir über
        unseren eigenen Server, sodass dein Browser beim Ansehen der Seite keine Verbindung zu eBay aufnimmt. Jedes Angebot verlinkt mit einem Link des
        eBay Partner Network zu eBay; erst wenn du ihn anklickst, setzt eBay eigene Cookies (siehe oben).
      </p>

      <h2>15. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) sowie auf Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Eine erteilte
        Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen. Schreib uns dazu einfach an {C.email}. Hast du ein E46BUILD-Konto,
        kannst du auf der Seite „Meine Builds“ jederzeit selbst deine Daten herunterladen, einzelne Konfigurationen aus deinem Konto entfernen oder dein
        Konto löschen (Abschnitt 10).
      </p>
      <p>
        Außerdem hast du das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, zum Beispiel bei: {C.authority}.
      </p>

      <h2>16. Aktualität</h2>
      <p>Stand: {C.updated}. Wir passen diese Erklärung an, wenn sich unsere Website oder die Rechtslage ändert.</p>
    </LegalPage>
  );
}
