import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { aboutPath, ABOUT_TITLE, demuroAt } from "../lib/about";
import AboutContent from "../components/AboutContent";
import sitemap from "../app/sitemap";

// BL-108 (PO 2026-11-04): the About page, /en/about and /de/ueber-uns; the copy is the PO-approved text from the card, word for word.
const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
const html = (lang: "en" | "de") => renderToStaticMarkup(createElement(AboutContent, { lang }));
const text = (h: string) =>
  h.replace(/<span class="sr-only">[^<]*<\/span>/g, "").replace(/<\/(p|li|h2|figcaption)>/g, "\n").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
const lines = (h: string) => text(h).split("\n").map((l) => l.trim()).filter(Boolean);

const EN = [
  "Why we exist",
  "Zauber is German for magic. zauberlabs makes configurators for modern classics: the cars people still drive and love every day. Many people agree that, for some brands, the golden age lies in the past.",
  "\"When you drive a really good naturally aspirated performance car engine, you are reminded of what we've lost.\"",
  "— Doug DeMuro, on the E46 M3 Touring (22:42)",
  "So why not get excited about the car we already own? With a modern configurator of its own, we owners can play with its potential and imagine what it could become.",
  "We built the first one, E46BUILD, for the BMW E46, because we own one and wanted to see that for ours, rather than replacing it.",
  "Make it better, not different. You don't need a new car to get a new feeling. New headlights, the wheels you always wanted, the bumpers of a later year, sport seats, a better steering wheel: small changes that make your car more yours, while it stays the car you love.",
  "\"It feels factory, which I think is the greatest compliment you can give a build like this.\"",
  "— Doug DeMuro (20:38)",
  "A second life for good parts. Many of the best parts for your car already exist: genuine parts from cars that have reached the end of the road, sitting with sellers and on eBay. On your car they get a second life, and your car keeps driving with BMW quality instead of a copy.",
  "See what your car could be — and buy only what fits it.",
  "How we get our facts",
  "Whether a part fits your car is decided by BMW's own data: the parts catalogue (part numbers by body, model and production date) and BMW's price lists.",
  "A forum post or a seller's listing never decides a fit on its own. Where sources disagree or aren't clear, we say so, or we leave it out.",
  "The pictures show parts on the car to help you imagine them. What fits is decided by part numbers, not by pictures.",
  "Spotted a mistake? Write to hello@zauberlabs.de.",
];
const DE = [
  "Warum es uns gibt",
  "Zauber steckt schon im Namen. zauberlabs baut Konfiguratoren für moderne Klassiker: die Autos, die viele noch jeden Tag fahren und lieben. Viele sind sich einig: Für manche Marken liegt das goldene Zeitalter in der Vergangenheit.",
  "\"When you drive a really good naturally aspirated performance car engine, you are reminded of what we've lost.\"",
  "„Wenn man einen richtig guten Saugmotor fährt, wird einem bewusst, was wir verloren haben.“",
  "— Doug DeMuro über den E46 M3 Touring (22:42)",
  "Warum also nicht neu für das Auto brennen, das wir schon haben? Mit einem eigenen, modernen Konfigurator können wir Besitzer mit seinem Potenzial spielen und uns ausmalen, was aus ihm werden kann.",
  "Den ersten, E46BUILD, haben wir für den BMW E46 gebaut, weil wir selbst einen fahren und genau das für unseren sehen wollten, statt ihn zu ersetzen.",
  "Besser machen, nicht anders. Für ein neues Gefühl brauchst du kein neues Auto. Neue Scheinwerfer, die Felgen, die du schon immer wolltest, die Stoßstangen eines späteren Baujahrs, Sportsitze, ein besseres Lenkrad: kleine Änderungen, die dein Auto mehr zu deinem machen, und es bleibt das Auto, das du liebst.",
  "\"It feels factory, which I think is the greatest compliment you can give a build like this.\"",
  "„Er fühlt sich ab Werk an – das größte Kompliment, das man so einem Aufbau machen kann.“",
  "— Doug DeMuro (20:38)",
  "Ein zweites Leben für gute Teile. Viele der besten Teile für dein Auto gibt es schon: Originalteile aus Autos, deren Weg zu Ende ist, bei Händlern und auf eBay. An deinem Auto bekommen sie ein zweites Leben, und dein Auto fährt weiter mit BMW-Qualität statt mit einer Kopie.",
  "Sieh, was aus deinem Auto werden kann – und kauf nur, was passt.",
  "Woher unsere Fakten kommen",
  "Ob ein Teil an dein Auto passt, entscheiden BMWs eigene Daten: der Teilekatalog (Teilenummern nach Karosserie, Modell und Produktionsdatum) und BMWs Preislisten.",
  "Ein Forenbeitrag oder ein Verkaufsangebot allein entscheidet nie über die Passform. Wo Quellen sich widersprechen oder unklar sind, sagen wir das, oder wir lassen es weg.",
  "Die Bilder zeigen die Teile am Auto, damit du sie dir vorstellen kannst. Was passt, entscheiden die Teilenummern, nicht die Bilder.",
  "Fehler entdeckt? Schreib uns an hello@zauberlabs.de.",
];

describe("About page (BL-108)", () => {
  test("paths and titles: /en/about, /de/ueber-uns", () => {
    assert.equal(aboutPath("en"), "/en/about");
    assert.equal(aboutPath("de"), "/de/ueber-uns");
    assert.deepEqual(ABOUT_TITLE, { en: "About zauberlabs", de: "Über zauberlabs" });
  });

  test("the copy is the approved text, word for word, in order (EN and DE)", () => {
    assert.deepEqual(lines(html("en")), EN);
    assert.deepEqual(lines(html("de")), DE);
    assert.match(html("en"), /<em lang="de">Zauber<\/em> is German for magic/);
    assert.match(html("en"), /<strong>Make it better, not different\.<\/strong>/);
    assert.match(html("de"), /<strong>Besser machen, nicht anders\.<\/strong>/);
  });

  test("quotes: blockquotes in English, the attribution links the video at the timestamp in a new tab; no embed", () => {
    assert.equal(demuroAt(1362), "https://www.youtube.com/watch?v=fmw_yxxcdPw&t=1362s");
    assert.equal(demuroAt(1238), "https://www.youtube.com/watch?v=fmw_yxxcdPw&t=1238s");
    for (const lang of ["en", "de"] as const) {
      const h = html(lang);
      assert.equal(h.match(/<blockquote lang="en"/g)?.length, 2, lang);
      const links = [...h.matchAll(/<a href="(https:\/\/www\.youtube\.com[^"]*)" target="_blank" rel="noopener">/g)].map((m) => m[1].replaceAll("&amp;", "&"));
      assert.deepEqual(links, [demuroAt(1362), demuroAt(1238)], lang);
      assert.ok(h.includes(lang === "de" ? "(öffnet in neuem Tab)" : "(opens in a new tab)"));
      assert.ok(!/iframe|youtube-nocookie|embed|<img|<video/i.test(h), lang);
    }
    // German translation underneath, in German, smaller type
    assert.match(html("de"), /<p lang="de" class="mt-3 font-sans text-\[16px\][^"]*">„Wenn man/);
    assert.ok(!html("en").includes('lang="de" class'), "English page: no translation");
  });

  test("routes: each path only in its language; hreflang pair, canonical, switch to the twin", () => {
    for (const [dir, l] of [["about", "en"], ["ueber-uns", "de"]] as const) {
      const r = read("app", "[lang]", dir, "page.tsx");
      assert.match(r, /export const dynamicParams = false;/);
      assert.match(r, new RegExp(`return \\[\\{ lang: "${l}" \\}\\];`));
      assert.match(r, new RegExp(`only="${l}"`));
    }
    const p = read("components", "AboutPage.tsx");
    assert.match(p, /if \(!isLocale\(lang\) \|\| lang !== only\) notFound\(\);/);
    assert.match(p, /canonical: `\$\{SITE_URL\}\$\{aboutPath\(only\)\}`, languages: Object\.fromEntries\(LOCALES\.map\(\(l\) => \[l, `\$\{SITE_URL\}\$\{aboutPath\(l\)\}`\]\)\)/);
    assert.match(p, /<BlogHeader lang=\{lang\} otherHref=\{aboutPath\(other\)\} blogLabel=\{false\} \/>/, "no Blog label on the About page (PO 2026-11-04)");
    const h = read("components", "blog", "BlogHeader.tsx");
    assert.match(h, /blogLabel = true/, "blog pages keep it");
    assert.match(h, /\{blogLabel && \(\s*<>\s*<span aria-hidden="true" className="hidden h-5 w-px bg-line sm:block" \/>\s*<Link href=\{`\/\$\{lang\}\/blog`\}/);
    assert.match(p, /<SiteFooter lang=\{lang\} otherHref=\{aboutPath\(other\)\} homePath=\{`\/\$\{lang\}`\} \/>/);
  });

  test("sitemap lists both, each with the other as its language alternate", () => {
    const entries = sitemap().filter((e) => /\/(about|ueber-uns)$/.test(e.url));
    assert.deepEqual(entries.map((e) => e.url), ["https://www.zauberlabs.de/de/ueber-uns", "https://www.zauberlabs.de/en/about"]);
    for (const e of entries) assert.deepEqual(e.alternates?.languages, { de: "https://www.zauberlabs.de/de/ueber-uns", en: "https://www.zauberlabs.de/en/about" });
  });

  test("footer: About → the About page; nothing else in the footer changed", () => {
    const f = read("components", "SiteFooter.tsx");
    assert.match(f, /<Link href=\{aboutPath\(lang\)\} className="hover:text-paper">\{t\.footer\.about\}<\/Link>/);
    assert.ok(!f.includes("#garage"));
    assert.match(f, /<a href=\{`\$\{homePath\}#suggest`\} className="hover:text-paper">\{t\.nav\.suggest\}<\/a>/);
  });
});
