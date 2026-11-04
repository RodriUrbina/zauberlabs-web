import { CONTACT_EMAIL, dictionaries, type Locale } from "@/lib/i18n";
import { demuroAt } from "@/lib/about";

/**
 * BL-108 — the About page text (PO-approved copy of 2026-11-04, word for word; change it only with the PO).
 * The quotes stay in English on both pages; German pages show the translation underneath in smaller type.
 * The attribution links to the video at the timestamp in a new tab; the video is not embedded.
 */
function Quote({ lang, text, translation, by, seconds }: { lang: Locale; text: string; translation?: string; by: string; seconds: number }) {
  return (
    <figure className="my-10">
      <blockquote lang="en" className="my-0">
        <p>{text}</p>
        {translation && (
          <p lang="de" className="mt-3 font-sans text-[16px] leading-relaxed text-body not-italic">
            {translation}
          </p>
        )}
      </blockquote>
      <figcaption className="mt-3 pl-[1.1em] text-[15px]">
        —{" "}
        <a href={demuroAt(seconds)} target="_blank" rel="noopener">
          {by}
          <span className="sr-only"> {dictionaries[lang].blog.opensNewTab}</span>
        </a>
      </figcaption>
    </figure>
  );
}

const mail = (
  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
);

function En() {
  return (
    <>
      <h2>Why we exist</h2>
      <p>
        <em lang="de">Zauber</em> is German for magic. zauberlabs makes configurators for modern classics: the cars people still drive and love every day. Many people agree that, for some
        brands, the golden age lies in the past.
      </p>
      <Quote lang="en" text={"\"When you drive a really good naturally aspirated performance car engine, you are reminded of what we've lost.\""} by="Doug DeMuro, on the E46 M3 Touring (22:42)" seconds={1362} />
      <p>So why not get excited about the car we already own? With a modern configurator of its own, we owners can play with its potential and imagine what it could become.</p>
      <p>We built the first one, E46BUILD, for the BMW E46, because we own one and wanted to see that for ours, rather than replacing it.</p>
      <p>
        <strong>Make it better, not different.</strong> You don&apos;t need a new car to get a new feeling. Other headlights, the wheels you always wanted, the bumpers of a later year, sport
        seats, a better steering wheel: small changes that make your car more yours, while it stays the car you love.
      </p>
      <Quote lang="en" text={"\"It feels factory, which I think is the greatest compliment you can give a build like this.\""} by="Doug DeMuro (20:38)" seconds={1238} />
      <p>
        <strong>A second life for good parts.</strong> Many of the best parts for your car already exist: genuine parts from cars that have reached the end of the road, sitting with sellers
        and on eBay. On your car they get a second life, and your car keeps driving with BMW quality instead of a copy.
      </p>
      <p>
        <strong>See what your car could be — and buy only what fits it.</strong>
      </p>
      <h2>How we get our facts</h2>
      <ul>
        <li>Whether a part fits your car is decided by BMW&apos;s own data: the parts catalogue (part numbers by body, model and production date) and BMW&apos;s price lists.</li>
        <li>A forum post or a seller&apos;s listing never decides a fit on its own. Where sources disagree or aren&apos;t clear, we say so, or we leave it out.</li>
        <li>The pictures show parts on the car to help you imagine them. What fits is decided by part numbers, not by pictures.</li>
        <li>Spotted a mistake? Write to {mail}.</li>
      </ul>
    </>
  );
}

function De() {
  return (
    <>
      <h2>Warum es uns gibt</h2>
      <p>
        <em>Zauber</em> steckt schon im Namen. zauberlabs baut Konfiguratoren für moderne Klassiker: die Autos, die viele noch jeden Tag fahren und lieben. Viele sind sich einig: Für manche
        Marken liegt das goldene Zeitalter in der Vergangenheit.
      </p>
      <Quote
        lang="de"
        text={"\"When you drive a really good naturally aspirated performance car engine, you are reminded of what we've lost.\""}
        translation="„Wenn man einen richtig guten Saugmotor fährt, wird einem bewusst, was wir verloren haben.“"
        by="Doug DeMuro über den E46 M3 Touring (22:42)"
        seconds={1362}
      />
      <p>
        Warum also nicht neu für das Auto brennen, das wir schon haben? Mit einem eigenen, modernen Konfigurator können wir Besitzer mit seinem Potenzial spielen und uns ausmalen, was aus ihm
        werden kann.
      </p>
      <p>Den ersten, E46BUILD, haben wir für den BMW E46 gebaut, weil wir selbst einen fahren und genau das für unseren sehen wollten, statt ihn zu ersetzen.</p>
      <p>
        <strong>Besser machen, nicht anders.</strong> Für ein neues Gefühl brauchst du kein neues Auto. Andere Scheinwerfer, die Felgen, die du schon immer wolltest, die Stoßstangen eines
        späteren Baujahrs, Sportsitze, ein besseres Lenkrad: kleine Änderungen, die dein Auto mehr zu deinem machen, und es bleibt das Auto, das du liebst.
      </p>
      <Quote
        lang="de"
        text={"\"It feels factory, which I think is the greatest compliment you can give a build like this.\""}
        translation="„Er fühlt sich ab Werk an – das größte Kompliment, das man so einem Aufbau machen kann.“"
        by="Doug DeMuro (20:38)"
        seconds={1238}
      />
      <p>
        <strong>Ein zweites Leben für gute Teile.</strong> Viele der besten Teile für dein Auto gibt es schon: Originalteile aus Autos, deren Weg zu Ende ist, bei Händlern und auf eBay. An
        deinem Auto bekommen sie ein zweites Leben, und dein Auto fährt weiter mit BMW-Qualität statt mit einer Kopie.
      </p>
      <p>
        <strong>Sieh, was aus deinem Auto werden kann – und kauf nur, was passt.</strong>
      </p>
      <h2>Woher unsere Fakten kommen</h2>
      <ul>
        <li>Ob ein Teil an dein Auto passt, entscheiden BMWs eigene Daten: der Teilekatalog (Teilenummern nach Karosserie, Modell und Produktionsdatum) und BMWs Preislisten.</li>
        <li>Ein Forenbeitrag oder ein Verkaufsangebot allein entscheidet nie über die Passform. Wo Quellen sich widersprechen oder unklar sind, sagen wir das, oder wir lassen es weg.</li>
        <li>Die Bilder zeigen die Teile am Auto, damit du sie dir vorstellen kannst. Was passt, entscheiden die Teilenummern, nicht die Bilder.</li>
        <li>Fehler entdeckt? Schreib uns an {mail}.</li>
      </ul>
    </>
  );
}

export default function AboutContent({ lang }: { lang: Locale }) {
  return lang === "de" ? <De /> : <En />;
}
