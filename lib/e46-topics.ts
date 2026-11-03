import type { Locale } from "./i18n";

/**
 * BL-106 — the E46BUILD topic pages linked in the footer ("Popular topics"). Taken once from https://e46.zauberlabs.de/sitemap.xml
 * on 2026-11-03: every page below answered 200 in both languages. Link text is the page's own <h1> (for the body-style pages, just the body's name). Paths are relative to E46_URL;
 * German pages link the /de counterpart (BL-105). Update by hand when E46BUILD adds or renames a page.
 */
export type E46Topic = { en: { path: string; label: string }; de: { path: string; label: string } };
export type E46TopicGroup = { key: string; label: Record<Locale, string>; pages: E46Topic[] };

const page = (enPath: string, enLabel: string, dePath: string, deLabel: string): E46Topic => ({
  en: { path: enPath, label: enLabel },
  de: { path: dePath, label: deLabel },
});

export const E46_TOPIC_GROUPS: E46TopicGroup[] = [
  {
    key: "bodies",
    label: { en: "Body styles", de: "Karosserien" },
    pages: [
      page("/e46-sedan", "E46 Sedan", "/de/e46-limousine", "E46 Limousine"),
      page("/e46-touring", "E46 Touring", "/de/e46-touring", "E46 Touring"),
      page("/e46-coupe", "E46 Coupé", "/de/e46-coupe", "E46 Coupé"),
      page("/e46-convertible", "E46 Convertible", "/de/e46-cabrio", "E46 Cabrio"),
      page("/e46-compact", "E46 Compact", "/de/e46-compact", "E46 Compact"),
      page("/e46-m3", "E46 M3", "/de/e46-m3", "E46 M3"),
    ],
  },
  {
    key: "packages",
    label: { en: "Packages", de: "Pakete" },
    pages: [
      page("/looks/m-sport-ii", "BMW M Sport package II on the E46", "/de/looks/m-sportpaket-ii", "M Sportpaket II am E46"),
      page("/packages/clubsport", "E46 Clubsport package (768)", "/de/pakete/clubsport", "E46 Ausstattungspaket Clubsport (768)"),
      page("/packages/edition-sport", "E46 Edition Sport (724)", "/de/pakete/edition-sport", "E46 Edition Sport (724)"),
      page("/packages/edition-exclusive", "E46 Edition Exclusive (723)", "/de/pakete/edition-exclusive", "E46 Edition Exclusive (723)"),
      page("/packages/edition-lifestyle", "E46 Edition Lifestyle (722)", "/de/pakete/edition-lifestyle", "E46 Edition Lifestyle (722)"),
      page("/packages/m3-competition", "E46 M3 Competition package (7MA)", "/de/pakete/m3-competition", "E46 M3 Competition Paket (7MA)"),
    ],
  },
  {
    key: "conversions",
    label: { en: "Conversions", de: "Umbauten" },
    pages: [
      page("/facelift-conversion", "E46 facelift conversion", "/de/facelift-umbau", "E46 Facelift Umbau"),
      page("/headlights/facelift", "E46 facelift headlights", "/de/scheinwerfer/facelift", "E46 Facelift Scheinwerfer"),
      page("/headlights/bi-xenon", "E46 bi-xenon headlights", "/de/scheinwerfer/bi-xenon", "E46 Bi-Xenon Scheinwerfer"),
      page("/wheels", "BMW wheels for the E46", "/de/felgen", "BMW Felgen für den E46"),
      page("/wheels/style-68m", "BMW Style 68M on the E46", "/de/felgen/style-68m", "BMW Styling 68M am E46"),
      page("/wheels/m3-wheels", "M3 wheels on a non-M E46", "/de/felgen/m3-felgen", "M3 Felgen am normalen E46"),
      page("/bumpers/m-package", "M package bumpers for the E46", "/de/stossstangen/m-paket", "M Paket Stoßstangen für den E46"),
      page("/seats/sport-seats", "E46 sport seats, per body", "/de/sitze/sportsitze", "E46 Sportsitze je Karosserie"),
      page("/steering-wheels/multifunction", "E46 multifunction steering wheel retrofit", "/de/lenkraeder/multifunktion", "E46 Multifunktionslenkrad nachrüsten"),
      page("/steering-wheels/m3-alcantara", "M3 Alcantara steering wheel on a normal E46", "/de/lenkraeder/m3-alcantara", "M3 Alcantara Lenkrad am normalen E46"),
    ],
  },
  {
    key: "guides",
    label: { en: "Mod guides", de: "Ratgeber" },
    pages: [
      page("/guides", "Mod guides for the BMW E46", "/de/ratgeber", "Ratgeber für den BMW E46"),
      page("/guides/headlights", "New headlights for your E46", "/de/ratgeber/scheinwerfer", "Neue Scheinwerfer für deinen E46"),
      page("/guides/wheels", "New wheels for your E46", "/de/ratgeber/felgen", "Neue Felgen für deinen E46"),
      page("/guides/bumpers", "New bumpers for your E46", "/de/ratgeber/stossstangen", "Neue Stoßstangen für deinen E46"),
      page("/guides/seats", "New seats for your E46", "/de/ratgeber/sitze", "Neue Sitze für deinen E46"),
      page("/guides/steering-wheel", "A new steering wheel for your E46", "/de/ratgeber/lenkrad", "Ein neues Lenkrad für deinen E46"),
    ],
  },
];

/** English path → German path for every topic page (used by BL-105's localizeE46Href). */
export const E46_DE_PATHS: Record<string, string> = Object.fromEntries(
  E46_TOPIC_GROUPS.flatMap((g) => g.pages.map((p) => [p.en.path, p.de.path])),
);
