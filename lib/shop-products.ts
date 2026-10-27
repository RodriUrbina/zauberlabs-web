import type { Locale } from "./i18n";
import { OWNER } from "./legal-entity";

/**
 * BL-084 — the fan shop's catalogue (plan: e46 docs/plans/fan-shop.md § 5). Nine die-cut E46 decals, the PO's AI designs
 * (e46 docs/GTM/, made web-ready by scripts/make-shop-images.mjs). Prices are gross in euro cents, incl. 19 % MwSt.
 * BL-085 (PO 2026-10-27, launch): only four designs are on sale (`available`); the other five stay here, switched off, and
 * are left out of the page, the cart, the pricing and the checkout. `size` is the printed sticker in cm (width × height).
 * BL-085.1 (PO 2026-10-27): the printed Touring is the plain blue one ("decal touring no lines.png"), not the striped one.
 */

export type ProductId =
  | "coupe-blue"
  | "m3-yellow"
  | "sedan-red-no-m"
  | "sedan-red"
  | "sedan-silver"
  | "convertible-grey"
  | "convertible-black"
  | "touring-blue-no-stripes"
  | "touring-blue-stripes";

export type Product = {
  id: ProductId;
  /** SKU, the GPSR product identifier. */
  sku: string;
  image: string;
  name: Record<Locale, string>;
  variant: Record<Locale, string>;
  available: boolean;
  size?: { w: number; h: number };
  /** BL-089: the BMW paint name, shown on the card, in the details and on the Stripe receipt. */
  colour?: Record<Locale, string>;
};

/**
 * BL-089 (PO 2026-10-27) — BMW colour names of the designs on sale, in ONE place so a corrected spelling is a one-line change.
 * Final names (PO 2026-10-27), from the Writer's sourcing; DE blue as in BMW's 2006 German release („Laguna-seca Blau").
 */
const COLOURS = {
  japanRed: { en: "Japan Red", de: "Japanrot" },
  lagunaSecaBlue: { en: "Laguna Seca Blue", de: "Laguna-seca Blau" },
  jetBlack: { en: "Jet Black", de: "Jetschwarz" },
  phoenixYellow: { en: "Phoenix Yellow", de: "Phönixgelb" },
} satisfies Record<string, Record<Locale, string>>;

export const PRODUCTS: readonly Product[] = [
  { id: "sedan-silver", sku: "ZL-E46-01", image: "/shop/sedan-silver.webp", name: { en: "Sedan", de: "Limousine" }, variant: { en: "Silver", de: "Silber" }, available: false },
  { id: "sedan-red", sku: "ZL-E46-02", image: "/shop/sedan-red.webp", name: { en: "Sedan", de: "Limousine" }, variant: { en: "Red", de: "Rot" }, available: true, size: { w: 5.2, h: 2.5 }, colour: COLOURS.japanRed },
  { id: "sedan-red-no-m", sku: "ZL-E46-03", image: "/shop/sedan-red-no-m.webp", name: { en: "Sedan", de: "Limousine" }, variant: { en: "Red, standard bumper", de: "Rot, Serienstoßstange" }, available: false },
  { id: "touring-blue-stripes", sku: "ZL-E46-04", image: "/shop/touring-blue-stripes.webp", name: { en: "Touring", de: "Touring" }, variant: { en: "Blue, with stripes", de: "Blau, mit Streifen" }, available: false },
  { id: "touring-blue-no-stripes", sku: "ZL-E46-05", image: "/shop/touring-blue-no-stripes.webp", name: { en: "Touring", de: "Touring" }, variant: { en: "Blue", de: "Blau" }, available: true, size: { w: 5.1, h: 2.5 }, colour: COLOURS.lagunaSecaBlue },
  { id: "coupe-blue", sku: "ZL-E46-06", image: "/shop/coupe-blue.webp", name: { en: "Coupé", de: "Coupé" }, variant: { en: "Blue, big e46 logo", de: "Blau, großes e46-Logo" }, available: false },
  { id: "convertible-grey", sku: "ZL-E46-07", image: "/shop/convertible-grey.webp", name: { en: "Convertible", de: "Cabrio" }, variant: { en: "Grey", de: "Grau" }, available: false },
  { id: "convertible-black", sku: "ZL-E46-08", image: "/shop/convertible-black.webp", name: { en: "Convertible", de: "Cabrio" }, variant: { en: "Black", de: "Schwarz" }, available: true, size: { w: 5.2, h: 2.5 }, colour: COLOURS.jetBlack },
  { id: "m3-yellow", sku: "ZL-E46-09", image: "/shop/m3-yellow.webp", name: { en: "M3", de: "M3" }, variant: { en: "Yellow", de: "Gelb" }, available: true, size: { w: 5.4, h: 2.5 }, colour: COLOURS.phoenixYellow },
];

export const productById = (id: string): Product | undefined => PRODUCTS.find((p) => p.id === id);
/** The designs on sale; everything customer-facing uses this list. */
export const AVAILABLE: readonly Product[] = PRODUCTS.filter((p) => p.available);
export const availableById = (id: string): Product | undefined => AVAILABLE.find((p) => p.id === id);

/** Prices in cents, gross. `all` = one of each available design (BL-085: 4 designs, €16.90). */
export const PRICES = { single: 490, three: 1290, all: 1690 } as const;

/** Shipping in cents, gross. Germany: letter, free from €15 of goods. Other EU countries: small parcel. No US (phase 1). */
export const SHIPPING = { de: 190, deFreeFrom: 1500, eu: 690 } as const;

/** Countries we ship to: Germany plus the other EU member states (ISO 3166-1 alpha-2, as Stripe expects). */
export const SHIP_COUNTRIES = [
  "DE", "AT", "BE", "BG", "CY", "CZ", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU",
  "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
] as const;
export type ShipCountry = (typeof SHIP_COUNTRIES)[number];
export const isShipCountry = (c: string): c is ShipCountry => (SHIP_COUNTRIES as readonly string[]).includes(c);

/**
 * GPSR product information (plan § 3 #8): manufacturer (we sell under our own name, so that is us), postal address, e-mail,
 * the product identifier (SKU) and warnings. BL-085: material from the printer order (glossy vinyl, die-cut); the size is per
 * product (`size`), as printed.
 */
export const GPSR = {
  manufacturer: { name: `${OWNER.name} (zauberlabs)`, address: `${OWNER.street}, ${OWNER.city}, ${OWNER.country}`, email: OWNER.email },
  material: { en: "Glossy vinyl sticker, die-cut", de: "Glänzender Vinyl-Sticker, konturgeschnitten" },
  printed: { en: "Printed in Germany.", de: "Gedruckt in Deutschland." },
  care: {
    en: "Apply to a clean, dry, grease-free and smooth surface at 10–30 °C. Not suitable for children under 3: small parts. Not a toy.",
    de: "Auf eine saubere, trockene, fettfreie und glatte Fläche bei 10–30 °C kleben. Nicht für Kinder unter 3 Jahren geeignet: Kleinteile. Kein Spielzeug.",
  },
} as const;
