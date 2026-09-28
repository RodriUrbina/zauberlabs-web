export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

const en = {
  meta: {
    title: "Zauberlabs — configurators for the cars the factory forgot",
    description:
      "Independent car configurators for modern classics. See the upgrades on your exact car, then find parts that genuinely fit.",
  },
  nav: { configurators: "Configurators", how: "How it works", principles: "Principles", suggest: "Suggest a car", open: "Open E46BUILD", menu: "Menu" },
  hero: {
    eyebrow: "Independent configurators · for modern classics",
    title: ["Configurators for the cars ", "the factory forgot."],
    body: "Manufacturers stopped configuring these cars decades ago. We build the configurator again — pick your exact car, see the upgrades on it, then find the parts that genuinely fit from the sellers you already use.",
    ctaPrimary: "Explore configurators",
    ctaSecondary: "Suggest the next car",
    live: "Now live · 01",
    cardLine: ["Sedan, Touring, Coupé — ", "the E46 you’ve always pictured."],
    heroAlt: "Silver BMW E46 M3 Touring in a dark studio",
  },
  ticker: ["E46BUILD — live", "Community vote — live", "Your car? Suggest it"],
  tickerRight: "“Exact fit” means confirmed. Never a guess.",
  garage: {
    eyebrow: "The garage",
    title: ["One car. ", "Done properly."],
    body: "Each configurator is a standalone site, built around a single model and every body style it came in. We only open the next one when the last one fits.",
    e46Label: "01 · Live · BMW 3 Series (E46)",
    e46Body: "Headlights, bumpers, wheels, seats and steering wheels — shown on your E46, matched to its production date, with OEM part numbers and offers side by side.",
    open: "Open configurator",
    bodies: [
      { name: "Sedan", years: "1998–2005", img: "/images/sedan.jpg" },
      { name: "Touring", years: "1999–2005", img: "/images/touring.jpg" },
      { name: "Coupé", years: "1999–2006", img: "/images/coupe.jpg" },
    ],
    saltAlt: "Silver E46 Touring on a salt flat",
    nextLabel: "03 · Open slot",
    nextTitle: "Your car could be next.",
    nextCta: "Suggest another model",
  },
  vote: {
    label: "02 · Community vote",
    live: "Live",
    title: ["Which car is ", "next?"],
    body: "Tap a car to vote. The one with the most fans gets built next.",
    total: "votes so far",
    add: "+ Add a car",
    aria: (name: string, n: number) => `Vote for ${name}, ${n} votes`,
    numberLocale: "en-US",
  },
  how: {
    eyebrow: "How every configurator works",
    title: ["Different cars. ", "Same promise."],
    body: "No catalogue codes, no forum archaeology. You pick by picture; the fitment engine does the paperwork.",
    steps: [
      { k: "01 — Describe it", t: "Talk like an owner.", b: "Model, year, body, colour — typed the way you’d tell a friend. We work out the rest and only ask what we need.", sample: "330d Touring, 2003, M Sport" },
      { k: "02 — See it", t: "Choose with your eyes.", b: "Headlights, bumpers, wheels, interiors — every option shown on your body style before you spend a cent.", chips: ["Headlights", "Bumpers", "Wheels", "Seats"] },
      { k: "03 — Fit it", t: "Buy the exact part — elsewhere.", b: "You get the OEM part number for your car and offers from external sellers, side by side. We never sell or stock parts.", part: "[OEM part no.]", fit: "✓ Exact fit" },
    ],
  },
  principles: {
    eyebrow: "Why Zauberlabs",
    title: ["A little ", "Zauber", ", a lot of part numbers."],
    items: [
      { t: "Exact fit, or we ask.", b: "Matched to production date, trim and side. If we can’t confirm it, we say so — never a guess." },
      { t: "Part numbers, not “universal”.", b: "Every recommendation carries a real OEM or manufacturer reference you can check anywhere." },
      { t: "Independent by design.", b: "Not affiliated with any manufacturer. We link to the sellers you already trust and compare them openly." },
    ],
  },
  suggest: {
    eyebrow: "What should we build next?",
    title: ["Which car did the factory ", "forget?"],
    body: "Tell us the model you own or love. The most-requested car becomes the next configurator — and you’ll hear first.",
    carLabel: "Your car, in your words",
    carPlaceholder: "e.g. Mercedes W124 Estate, 1993",
    emailLabel: "Email (optional)",
    emailPlaceholder: "you@example.com",
    submit: "Put it on the list",
    sending: "Sending…",
    thanks: "Thanks — it’s on the list.",
    error: "Something went wrong. Please try again.",
  },
  footer: {
    tagline: "Independent configurators for modern classics. Made by owners, for owners.",
    configurators: "Configurators",
    next: "[Next model] — soon",
    studio: "Studio",
    about: "About",
    legal: "Legal",
    impressum: "Impressum",
    privacy: "Privacy policy",
    disclaimer: "Independent — not affiliated with BMW AG or any vehicle manufacturer. Trademarks belong to their owners.",
  },
};

export type Dict = typeof en;

const de: Dict = {
  meta: {
    title: "Zauberlabs — Konfiguratoren für die Autos, die das Werk vergessen hat",
    description:
      "Unabhängige Auto-Konfiguratoren für Youngtimer. Sieh die Umbauten an deinem exakten Auto und finde Teile, die wirklich passen.",
  },
  nav: { configurators: "Konfiguratoren", how: "So funktioniert’s", principles: "Prinzipien", suggest: "Auto vorschlagen", open: "E46BUILD öffnen", menu: "Menü" },
  hero: {
    eyebrow: "Unabhängige Konfiguratoren · für Youngtimer",
    title: ["Konfiguratoren für die Autos, ", "die das Werk vergessen hat."],
    body: "Die Hersteller haben diese Autos vor Jahrzehnten aus ihren Konfiguratoren gestrichen. Wir bauen sie neu – wähle dein exaktes Auto, sieh die Umbauten direkt daran und finde die Teile, die wirklich passen, bei den Händlern, die du ohnehin nutzt.",
    ctaPrimary: "Konfiguratoren entdecken",
    ctaSecondary: "Nächstes Auto vorschlagen",
    live: "Jetzt live · 01",
    cardLine: ["Limousine, Touring, Coupé — ", "der E46, wie du ihn dir immer vorgestellt hast."],
    heroAlt: "Silberner BMW E46 M3 Touring im dunklen Studio",
  },
  ticker: ["E46BUILD — live", "Community-Voting — live", "Dein Auto? Schlag es vor"],
  tickerRight: "„Passgenau“ heißt bestätigt. Nie geraten.",
  garage: {
    eyebrow: "Die Garage",
    title: ["Ein Auto. ", "Richtig gemacht."],
    body: "Jeder Konfigurator ist eine eigene Website – gebaut um ein einziges Modell und jede Karosserievariante, die es gab. Den nächsten starten wir erst, wenn der letzte passt.",
    e46Label: "01 · Live · BMW 3er (E46)",
    e46Body: "Scheinwerfer, Stoßstangen, Felgen, Sitze und Lenkräder – direkt an deinem E46 gezeigt, abgestimmt aufs Produktionsdatum, mit OE-Teilenummern und Angeboten im Vergleich.",
    open: "Konfigurator öffnen",
    bodies: [
      { name: "Limousine", years: "1998–2005", img: "/images/sedan.jpg" },
      { name: "Touring", years: "1999–2005", img: "/images/touring.jpg" },
      { name: "Coupé", years: "1999–2006", img: "/images/coupe.jpg" },
    ],
    saltAlt: "Silberner E46 Touring auf einem Salzsee",
    nextLabel: "03 · Freier Platz",
    nextTitle: "Dein Auto könnte das nächste sein.",
    nextCta: "Anderes Modell vorschlagen",
  },
  vote: {
    label: "02 · Community-Voting",
    live: "Live",
    title: ["Welches Auto kommt ", "als Nächstes?"],
    body: "Tippe auf ein Auto, um abzustimmen. Das mit den meisten Fans bauen wir als Nächstes.",
    total: "Stimmen bisher",
    add: "+ Auto hinzufügen",
    aria: (name: string, n: number) => `Für ${name} abstimmen, ${n} Stimmen`,
    numberLocale: "de-DE",
  },
  how: {
    eyebrow: "So funktioniert jeder Konfigurator",
    title: ["Andere Autos. ", "Dasselbe Versprechen."],
    body: "Keine Katalogcodes, keine Forums-Archäologie. Du wählst nach Bild – die Passform-Engine erledigt den Papierkram.",
    steps: [
      { k: "01 — Beschreiben", t: "Sprich wie ein Schrauber.", b: "Modell, Baujahr, Karosserie, Farbe – so, wie du es einem Kumpel erzählen würdest. Den Rest ermitteln wir und fragen nur, was wir wirklich brauchen.", sample: "330d Touring, 2003, M-Paket" },
      { k: "02 — Ansehen", t: "Wähle mit den Augen.", b: "Scheinwerfer, Stoßstangen, Felgen, Innenraum – jede Option an deiner Karosserie, bevor du einen Cent ausgibst.", chips: ["Scheinwerfer", "Stoßstangen", "Felgen", "Sitze"] },
      { k: "03 — Verbauen", t: "Das exakte Teil kaufen – woanders.", b: "Du bekommst die OE-Teilenummer für dein Auto und Angebote externer Händler im Vergleich. Wir verkaufen und lagern keine Teile.", part: "[OE-Teilenr.]", fit: "✓ Passgenau" },
    ],
  },
  principles: {
    eyebrow: "Warum Zauberlabs",
    title: ["Ein bisschen ", "Zauber", ", jede Menge Teilenummern."],
    items: [
      { t: "Passgenau – oder wir fragen nach.", b: "Abgestimmt auf Produktionsdatum, Ausstattung und Einbauseite. Können wir es nicht bestätigen, sagen wir es – geraten wird nie." },
      { t: "Teilenummern statt „universal“.", b: "Jede Empfehlung hat eine echte OE- oder Herstellernummer, die du überall prüfen kannst." },
      { t: "Unabhängig aus Prinzip.", b: "Mit keinem Hersteller verbunden. Wir verlinken Händler, denen du schon vertraust, und vergleichen sie offen." },
    ],
  },
  suggest: {
    eyebrow: "Was bauen wir als Nächstes?",
    title: ["Welches Auto hat das Werk ", "vergessen?"],
    body: "Nenn uns das Modell, das du fährst oder liebst. Das meistgewünschte Auto wird der nächste Konfigurator – und du erfährst es zuerst.",
    carLabel: "Dein Auto, in deinen Worten",
    carPlaceholder: "z. B. Mercedes W124 T-Modell, 1993",
    emailLabel: "E-Mail (optional)",
    emailPlaceholder: "du@beispiel.de",
    submit: "Auf die Liste setzen",
    sending: "Wird gesendet…",
    thanks: "Danke – es steht auf der Liste.",
    error: "Da ist etwas schiefgelaufen. Bitte versuch es noch einmal.",
  },
  footer: {
    tagline: "Unabhängige Konfiguratoren für Youngtimer. Von Besitzern, für Besitzer.",
    configurators: "Konfiguratoren",
    next: "[Nächstes Modell] – bald",
    studio: "Studio",
    about: "Über uns",
    legal: "Rechtliches",
    impressum: "Impressum",
    privacy: "Datenschutz",
    disclaimer: "Unabhängig – nicht mit der BMW AG oder einem anderen Fahrzeughersteller verbunden. Marken gehören ihren jeweiligen Inhabern.",
  },
};

export const dictionaries: Record<Locale, Dict> = { en, de };

// Where the E46 configurator lives. Change once the subdomain is set up.
export const E46_URL = process.env.NEXT_PUBLIC_E46_URL ?? "https://e46.zauberlabs.de";
export const CONTACT_EMAIL = "hello@zauberlabs.de";
