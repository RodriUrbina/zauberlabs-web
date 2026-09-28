import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/i18n";

export const metadata = { title: "Datenschutz — Zauberlabs", robots: { index: false } };

// Draft only. Replace with a reviewed privacy policy before launch.
export default async function Datenschutz({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <LegalPage lang={lang} title="Datenschutzerklärung">
      <p>[ENTWURF – vor dem Livegang prüfen lassen]</p>
      <h2>Verantwortlicher</h2>
      <p>[NAME, ANSCHRIFT], E-Mail: {CONTACT_EMAIL}</p>
      <h2>Hosting</h2>
      <p>Diese Website wird bei Vercel Inc. gehostet. Beim Aufruf werden technisch notwendige Server-Logdaten verarbeitet.</p>
      <h2>Schriften</h2>
      <p>Schriften werden lokal von unserem Server ausgeliefert; es findet keine Verbindung zu Google-Servern statt.</p>
      <h2>Community-Voting</h2>
      <p>
        Wenn du abstimmst, speichern wir ein zufälliges Cookie („zl_vid“), damit jede Person pro Auto nur einmal abstimmen kann. Zum Schutz vor
        Missbrauch wird deine IP-Adresse kurzzeitig nur in gehashter Form verarbeitet. Speicherung bei Upstash (Redis).
      </p>
      <h2>Autovorschläge</h2>
      <p>Wenn du uns ein Auto vorschlägst, speichern wir den Text und – falls angegeben – deine E-Mail-Adresse, um dich zu benachrichtigen.</p>
      <h2>Deine Rechte</h2>
      <p>Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit. Schreib uns an {CONTACT_EMAIL}.</p>
    </LegalPage>
  );
}
