export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

const en = {
  meta: {
    title: "zauberlabs — configurators for the cars the factory forgot",
    description:
      "Independent car configurators for modern classics. See the upgrades on your exact car, then find parts that genuinely fit.",
  },
  nav: { configurators: "Configurators", next: "What’s next", suggest: "Suggest a car", blog: "Blog", open: "Open E46BUILD", comingSoon: "E46 configurator: coming soon", menu: "Menu" },
  // BL-081 (PO 2026-10-26): Rivian-style hero, headline option 2 (e46/docs/design/zauberlabs-rivian-landing). Only title[1]
  // gets the serif accent. `cta` is the phone sticky bar's label (BL-079); the hero buttons are `configure` and `readBlog`.
  hero: {
    live: "E46BUILD is live",
    liveSoon: "Coming soon · BMW 3 Series (E46)",
    title: ["See what your ", "E46 could be.", ""],
    line: "Pick your E46. See the parts on it. Buy only what fits.",
    cta: "Start with your E46",
    configure: "Configure your E46",
    readBlog: "Read the blog",
    ogAlt: "E46BUILD: a silver BMW E46 Coupé with the search bar reading “BMW E46 330Ci Coupe”",
    pickLead: "Which E46 do you drive?",
  },
  // BL-083 (PO 2026-10-27, option C "Take a closer look"): five E46BUILD categories, each with E46BUILD's own picture and one
  // line. The lines were fact-checked by the Editor against e46build master: wheels and seats use ONE stage picture for every
  // body, so those lines do not say "your car". PO 2026-10-27: every picture shows the part MOUNTED ON THE CAR ("we are selling
  // inspiration for a new mod"), never a part on its own; steering is E46BUILD's cockpit with the M Sport wheel laid on it.
  garage: {
    live: "live",
    soon: "coming soon",
    title: ["Take a ", "closer look."],
    cats: [
      { key: "headlights", label: "Headlights", line: "Halogen, xenon or bi-xenon, matched to your car’s build date.", img: "/images/closer-look/e46-headlight-stage-front.webp", alt: "Silver E46 head-on, with its headlights" },
      { key: "bumpers", label: "Bumpers", line: "Standard, M package or M3 bumpers, front and rear, on your body style.", img: "/images/closer-look/e46-bumper-look-front-sedan-touring-m-package.webp", alt: "E46 sedan with the M package front bumper" },
      { key: "wheels", label: "Wheels", line: "BMW factory wheels, swapped onto an E46 seen from the side.", img: "/images/closer-look/e46-wheel-stage-side.webp", alt: "Front wheel of a silver E46, seen from the side" },
      { key: "seats", label: "Seats", line: "Basic, sport or M3 seats, for your E46.", img: "/images/closer-look/e46-seat-stage-interior.webp", alt: "E46 interior with the front seats" },
      { key: "steering", label: "Steering wheels", line: "Standard, sport, M Sport or M3 steering wheels for your E46.", img: "/images/closer-look/e46-steering-stage-cockpit-m-sport.webp", alt: "E46 cockpit with an M Sport steering wheel" },
    ],
    pick: "Parts in E46BUILD", // accessible name of the category tab list
    cta: "Try it on your E46",
    startLabel: "Start with your body",
    open: "Open E46BUILD",
    // BL-081: the three "Why zauberlabs" titles as chips (their sentences are gone); BL-083: under the body tiles.
    values: ["Exact fit.", "Configure, don’t decode.", "Sellers that have it."],
    configure: (name: string) => `Configure the ${name}`, // BL-079: accessible name of a garage body tile
    bodies: [
      { name: "Sedan", years: "1998–2005", img: "/images/sedan.jpg", start: "sedan" },
      { name: "Touring", years: "1999–2005", img: "/images/touring.jpg", start: "touring" },
      { name: "Coupé", years: "1999–2006", img: "/images/coupe.jpg", start: "coupe" },
      { name: "Convertible", years: "2000–2006", img: "/images/convertible.jpg", start: "convertible" },
      { name: "Compact", years: "2001–2004", img: "/images/compact.jpg", start: "compact" },
      { name: "M3", years: "2000–2006", img: "/images/m3.jpg", start: "m3" },
    ],
    e46CardAlt: "E46 M3 Touring, the one-off prototype BMW built but never sold: a dream build",
  },
  // BL-081: one "What's next" block, the lineup (E46BUILD live, then the cars in the vote) next to the suggest form.
  next: {
    eyebrow: "What’s next",
    title: ["What’s next? ", "You decide."],
    body: "Tap a car to vote. The car with the most fans gets its configurator built next.",
  },
  vote: {
    label: "Configurators",
    live: "Live",
    liveNow: "Live now",
    soonLive: "Coming soon",
    model: "BMW 3 Series (E46)",
    soon: "Coming soon · in the vote",
    lead: "Most votes",
    open: "Open",
    total: "votes so far",
    aria: (name: string, n: number) => `Vote for ${name}, ${n} votes`,
    numberLocale: "en-US",
  },
  suggest: {
    eyebrow: "Not in the list?",
    title: ["Bring ", "yours.", ""],
    body: "Tell us what you drive. We check it and add it to the vote, and if its configurator gets built, you’ll hear first.",
    carLabel: "What do you drive?",
    carPlaceholder: "e.g. Mercedes W124 Estate, 1993",
    emailLabel: "Email (optional), to hear first",
    emailPlaceholder: "you@example.com",
    submit: "Add it to the vote",
    sending: "Sending…",
    thanks: "Thanks! Once we’ve reviewed it, it’ll show up in the vote above.",
    error: "Something went wrong. Please try again.",
  },
  blog: {
    metaTitle: "Blog — zauberlabs",
    metaDescription: "Research notes from the configurators: which part fits which car, from which date, and how sure we are.",
    eyebrow: "Blog · research notes",
    title: ["What fits, ", "and why."],
    intro: "What we learn while building the configurators: changeovers, part families, the traps. Every article names its sources and how sure we are.",
    empty: "No articles yet. The first ones are being written.",
    allArticles: "All articles",
    topics: "Topics",
    tagTitle: (tag: string) => `Articles about ${tag}`,
    tagMetaDescription: (tag: string) => `All zauberlabs research notes tagged ${tag}.`,
    readingTime: (n: number) => `${n} min read`,
    published: "Published",
    updated: "Updated",
    by: "By",
    englishOnly: "English only",
    germanOnly: "German only",
    fallbackNote: "This article is currently available in German only.",
    draft: "Draft — not for publication",
    scheduled: "Scheduled",
    scheduledBadge: (when: string) => `Scheduled · ${when}`,
    scheduledBanner: (when: string) => `Scheduled for ${when}. Not on the live site until then.`,
    photo: "Image",
    pathsRelativeTo: "Paths are relative to",
    sourcesTitle: "Sources & confidence",
    sourcesIntro: "Where this article comes from. Paths point into the E46BUILD research files.",
    sourcesPageTitle: "Sources & confidence",
    sourcesPageIntro: "Every article's sources in one place: what each claim rests on, and how sure we are. The small numbers in the articles link here.",
    sourcesPageMeta: "The sources behind every zauberlabs article, with how sure we are about each one.",
    sourcesCount: (n: number) => (n === 1 ? "1 source" : `${n} sources`),
    sourcesLineLink: "See the sources and how sure we are",
    sourcesArticles: "Articles",
    sourcesReadArticle: "Read the article",
    confidence: { HIGH: "High", MEDIUM: "Medium", LOW: "Low", NA: "n/a" } as Record<"HIGH" | "MEDIUM" | "LOW" | "NA", string>,
    confidenceAria: (level: string) => `Confidence: ${level}`,
    ctaEyebrow: "Try it on your car",
    ctaTitle: ["See it on ", "your exact car."],
    ctaBody: "Pick your model, year and body style in the configurator and get the part that fits it, with the OEM number and offers side by side.",
    ctaButton: (tag: string) => `Open ${tag}BUILD`,
    feedTitle: "zauberlabs Blog",
    feedLabel: "RSS feed",
    breadcrumbHome: "Home",
    backToBlog: "← All articles",
    opensNewTab: "(opens in a new tab)",
    prevArticle: "Previous article",
    nextArticle: "Next article",
    articleNav: "More articles",
  },
  // BL-081: the home page's blog teaser (the 3 newest articles). Title: blog.title.
  teaser: {
    eyebrow: "From the blog",
    body: "Research notes from building the configurators.",
    open: "Open E46BUILD",
    all: "All articles",
  },
  footer: {
    tagline: "Independent configurators for modern classics. Made by owners, for owners.",
    configurators: "Configurators",
    e46Soon: "E46BUILD — coming soon",
    next: ["Next: you decide", " → vote"], // BL-081: links to the What’s next block
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
    title: "zauberlabs — Konfiguratoren für die Autos, die das Werk vergessen hat",
    description:
      "Unabhängige Auto-Konfiguratoren für Youngtimer. Sieh die Umbauten an deinem exakten Auto und finde Teile, die wirklich passen.",
  },
  nav: { configurators: "Konfiguratoren", next: "Was kommt", suggest: "Auto vorschlagen", blog: "Blog", open: "E46BUILD öffnen", comingSoon: "E46-Konfigurator: bald verfügbar", menu: "Menü" },
  hero: {
    live: "E46BUILD ist live",
    liveSoon: "Demnächst · BMW 3er (E46)",
    title: ["Sieh, was dein ", "E46 sein kann.", ""],
    line: "Wähl deinen E46. Sieh die Teile daran. Kauf nur, was passt.",
    cta: "Starte mit deinem E46",
    configure: "E46 konfigurieren",
    readBlog: "Zum Blog",
    ogAlt: "E46BUILD: ein silbernes BMW E46 Coupé, in der Suchleiste steht „BMW E46 330Ci Coupe“",
    pickLead: "Welchen E46 fährst du?",
  },
  garage: {
    live: "live",
    soon: "bald verfügbar",
    title: ["Sieh ", "genauer hin."],
    // BL-083: DE copy by the Writer (2026-10-27); alt texts drafted by the Builder.
    cats: [
      { key: "headlights", label: "Scheinwerfer", line: "Halogen, Xenon oder Bi-Xenon, passend zum Baudatum deines E46.", img: "/images/closer-look/e46-headlight-stage-front.webp", alt: "Silberner E46 von vorn, mit seinen Scheinwerfern" },
      { key: "bumpers", label: "Stoßstangen", line: "Serie, M-Paket oder M3, vorne und hinten, passend zu deiner Karosserie.", img: "/images/closer-look/e46-bumper-look-front-sedan-touring-m-package.webp", alt: "E46-Limousine mit M-Paket-Frontstoßstange" },
      { key: "wheels", label: "Felgen", line: "BMW-Werksfelgen, direkt an einem E46 in der Seitenansicht.", img: "/images/closer-look/e46-wheel-stage-side.webp", alt: "Vorderrad eines silbernen E46 in der Seitenansicht" },
      { key: "seats", label: "Sitze", line: "Serie, Sport oder M3, für deinen E46.", img: "/images/closer-look/e46-seat-stage-interior.webp", alt: "E46-Innenraum mit den Vordersitzen" },
      { key: "steering", label: "Lenkräder", line: "Standard, Sport, M Sport oder M3 – Lenkräder für deinen E46.", img: "/images/closer-look/e46-steering-stage-cockpit-m-sport.webp", alt: "E46-Cockpit mit M-Sport-Lenkrad" },
    ],
    pick: "Teile in E46BUILD",
    cta: "Probier es an deinem E46 aus",
    startLabel: "Starte mit deiner Karosserie",
    open: "E46BUILD öffnen",
    values: ["Passgenau.", "Konfigurieren statt entschlüsseln.", "Händler, die es haben."],
    configure: (name: string) => `${name} konfigurieren`,
    bodies: [
      { name: "Limousine", years: "1998–2005", img: "/images/sedan.jpg", start: "sedan" },
      { name: "Touring", years: "1999–2005", img: "/images/touring.jpg", start: "touring" },
      { name: "Coupé", years: "1999–2006", img: "/images/coupe.jpg", start: "coupe" },
      { name: "Cabrio", years: "2000–2006", img: "/images/convertible.jpg", start: "convertible" },
      { name: "Compact", years: "2001–2004", img: "/images/compact.jpg", start: "compact" },
      { name: "M3", years: "2000–2006", img: "/images/m3.jpg", start: "m3" },
    ],
    e46CardAlt: "E46 M3 Touring: der Einzelprototyp, den BMW gebaut, aber nie verkauft hat – ein Traum-Build",
  },
  next: {
    eyebrow: "Was kommt als Nächstes",
    title: ["Was kommt als Nächstes? ", "Du entscheidest."],
    body: "Tippe auf ein Auto, um abzustimmen. Das Auto mit den meisten Fans bekommt als Nächstes seinen Konfigurator.",
  },
  vote: {
    label: "Konfiguratoren",
    live: "Live",
    liveNow: "Jetzt live",
    soonLive: "Demnächst",
    model: "BMW 3er (E46)",
    soon: "Demnächst · im Voting",
    lead: "Meiste Stimmen",
    open: "Öffnen",
    total: "Stimmen bisher",
    aria: (name: string, n: number) => `Für ${name} abstimmen, ${n} Stimmen`,
    numberLocale: "de-DE",
  },
  suggest: {
    eyebrow: "Nicht in der Liste?",
    title: ["Bring ", "deins", " mit."],
    body: "Sag uns, was du fährst. Wir prüfen es und nehmen es ins Voting auf, und wenn sein Konfigurator gebaut wird, erfährst du es zuerst.",
    carLabel: "Was fährst du?",
    carPlaceholder: "z. B. Mercedes W124 T-Modell, 1993",
    emailLabel: "E-Mail (optional), damit du es zuerst erfährst",
    emailPlaceholder: "du@beispiel.de",
    submit: "Ins Voting aufnehmen",
    sending: "Wird gesendet…",
    thanks: "Danke! Sobald wir ihn geprüft haben, erscheint er oben im Voting.",
    error: "Da ist etwas schiefgelaufen. Bitte versuch es noch einmal.",
  },
  blog: {
    metaTitle: "Blog — zauberlabs",
    metaDescription: "Notizen aus der Recherche für die Konfiguratoren: welches Teil an welches Auto passt, ab wann – und wie sicher wir uns sind.",
    eyebrow: "Blog · Recherche-Notizen",
    title: ["Was passt, ", "und warum."],
    intro: "Was wir beim Bau der Konfiguratoren lernen: Modellpflegen, Teilefamilien, die Fallen. Jeder Artikel nennt seine Quellen und wie sicher wir uns sind.",
    empty: "Noch keine Artikel. Die ersten werden gerade geschrieben.",
    allArticles: "Alle Artikel",
    topics: "Themen",
    tagTitle: (tag: string) => `Artikel zum Thema ${tag}`,
    tagMetaDescription: (tag: string) => `Alle zauberlabs-Recherche-Notizen zum Thema ${tag}.`,
    readingTime: (n: number) => `${n} Min. Lesezeit`,
    published: "Veröffentlicht",
    updated: "Aktualisiert",
    by: "Von",
    englishOnly: "nur Englisch",
    germanOnly: "nur Deutsch",
    fallbackNote: "Dieser Artikel ist bisher nur auf Englisch verfügbar.",
    draft: "Entwurf – nicht zur Veröffentlichung",
    scheduled: "Geplant",
    scheduledBadge: (when: string) => `Geplant · ${when}`,
    scheduledBanner: (when: string) => `Geplant für ${when}. Bis dahin nicht auf der Live-Seite.`,
    photo: "Bild",
    pathsRelativeTo: "Pfade relativ zu",
    sourcesTitle: "Quellen & Belastbarkeit",
    sourcesIntro: "Woher dieser Artikel kommt. Die Pfade zeigen in die Recherche-Dateien von E46BUILD.",
    sourcesPageTitle: "Quellen & Belastbarkeit",
    sourcesPageIntro: "Die Quellen aller Artikel an einem Ort: worauf jede Aussage beruht und wie sicher wir uns sind. Die kleinen Zahlen in den Artikeln verlinken hierher.",
    sourcesPageMeta: "Die Quellen hinter jedem zauberlabs-Artikel – und wie sicher wir uns bei jeder sind.",
    sourcesCount: (n: number) => (n === 1 ? "1 Quelle" : `${n} Quellen`),
    sourcesLineLink: "Quellen und Belastbarkeit ansehen",
    sourcesArticles: "Artikel",
    sourcesReadArticle: "Zum Artikel",
    confidence: { HIGH: "Hoch", MEDIUM: "Mittel", LOW: "Niedrig", NA: "n/a" } as Record<"HIGH" | "MEDIUM" | "LOW" | "NA", string>,
    confidenceAria: (level: string) => `Belastbarkeit: ${level}`,
    ctaEyebrow: "Probier es an deinem Auto",
    ctaTitle: ["Sieh es an ", "deinem exakten Auto."],
    ctaBody: "Wähle Modell, Baujahr und Karosserie im Konfigurator und bekomme das Teil, das passt – mit OE-Nummer und Angeboten im Vergleich.",
    ctaButton: (tag: string) => `${tag}BUILD öffnen`,
    feedTitle: "zauberlabs Blog",
    feedLabel: "RSS-Feed",
    breadcrumbHome: "Start",
    backToBlog: "← Alle Artikel",
    opensNewTab: "(öffnet in neuem Tab)",
    prevArticle: "Vorheriger Artikel",
    nextArticle: "Nächster Artikel",
    articleNav: "Weitere Artikel",
  },
  teaser: {
    eyebrow: "Aus dem Blog",
    body: "Notizen aus der Recherche für die Konfiguratoren.",
    open: "E46BUILD öffnen",
    all: "Alle Artikel",
  },
  footer: {
    tagline: "Unabhängige Konfiguratoren für Youngtimer. Von Besitzern, für Besitzer.",
    configurators: "Konfiguratoren",
    e46Soon: "E46BUILD – bald verfügbar",
    next: ["Als Nächstes: du entscheidest", " → abstimmen"],
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
/**
 * BL-064: open E46BUILD with a body pre-chosen. Contract with Agent 3 (E46BUILD entry param): `/?start=<value>`, values as in
 * garage.bodies[].start (sedan, touring, coupe, convertible, compact, m3).
 */
export const e46StartUrl = (start: string) => `${E46_URL.replace(/\/+$/, "")}/?start=${encodeURIComponent(start)}`;
// THE E46 SWITCH (PO decision 2026-10-02, BL-001): the configurator is not online yet, so every
// E46 button on the site and the article CTA show "coming soon" with no link.
// Going live is a one-line change: set NEXT_PUBLIC_E46_LIVE=1 on Vercel (or flip the fallback to true).
export const E46_LIVE = (process.env.NEXT_PUBLIC_E46_LIVE ?? "0") === "1";
export const CONTACT_EMAIL = "hello@zauberlabs.de";
