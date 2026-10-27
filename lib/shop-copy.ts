import type { Locale } from "./i18n";

/** BL-084 — fan shop copy (plan § 5 "Shop page design"). DE drafted by the Builder; the Writer checks it before launch. */
const en = {
  metaTitle: "Shop — zauberlabs",
  eyebrow: "Shop — 01",
  title: ["Your E46, ", "as a sticker."],
  sub: "Die-cut outdoor vinyl, 12 cm, printed in Germany.",
  price: "€4.90",
  vatNote: "incl. VAT, plus shipping",
  add: "Add to cart",
  added: "In cart",
  details: "Details",
  gpsr: { manufacturer: "Manufacturer", material: "Material and size", care: "Care and safety", sku: "Product no." },
  bundles: {
    three: ["Any 3", "Pick any three stickers; the price applies by itself in the cart."],
    all: ["All 9", "One of each design."],
    addAll: "Add all 9",
  },
  facts: "Shipping DE €1.90 · free from €15 · EU €6.90 — Card · PayPal · Klarna · Apple Pay",
  cart: {
    open: "Cart",
    stickers: (n: number) => (n === 1 ? "1 sticker" : `${n} stickers`),
    checkout: "Checkout",
    title: "Your cart",
    empty: "Your cart is empty.",
    close: "Close",
    remove: "Remove",
    less: "One less",
    more: "One more",
    groups: { all: "All 9", three: "Any 3", single: "Single" },
    subtotal: "Stickers",
    shipping: "Shipping",
    free: "free",
    total: "Total",
    country: "Ship to",
    pay: "Continue to payment",
    paying: "One moment…",
    error: "The payment page could not be opened. Please try again.",
    note: "You pay on Stripe's secure page. Prices incl. VAT.",
  },
  success: { title: ["Thank you. ", "Your order is in."], body: "You'll get a receipt from Stripe by e-mail. We'll pack your stickers and post them to you.", back: "Back to the shop" },
  cancel: { title: ["Payment ", "cancelled."], body: "Nothing was charged. Your cart is still here.", back: "Back to the shop" },
  shippingLink: "Shipping & payment",
};

const de: typeof en = {
  metaTitle: "Shop — zauberlabs",
  eyebrow: "Shop — 01",
  title: ["Dein E46, ", "als Sticker."],
  sub: "Konturgeschnittenes Outdoor-Vinyl, 12 cm, gedruckt in Deutschland.",
  price: "4,90 €",
  vatNote: "inkl. MwSt., zzgl. Versand",
  add: "In den Warenkorb",
  added: "Im Warenkorb",
  details: "Details",
  gpsr: { manufacturer: "Hersteller", material: "Material und Größe", care: "Pflege und Sicherheit", sku: "Artikelnr." },
  bundles: {
    three: ["Beliebige 3", "Wähl drei beliebige Sticker; der Preis gilt im Warenkorb automatisch."],
    all: ["Alle 9", "Jedes Motiv einmal."],
    addAll: "Alle 9 hinzufügen",
  },
  facts: "Versand DE 1,90 € · frei ab 15 € · EU 6,90 € — Karte · PayPal · Klarna · Apple Pay",
  cart: {
    open: "Warenkorb",
    stickers: (n: number) => (n === 1 ? "1 Sticker" : `${n} Sticker`),
    checkout: "Zur Kasse",
    title: "Dein Warenkorb",
    empty: "Dein Warenkorb ist leer.",
    close: "Schließen",
    remove: "Entfernen",
    less: "Einen weniger",
    more: "Einen mehr",
    groups: { all: "Alle 9", three: "Beliebige 3", single: "Einzeln" },
    subtotal: "Sticker",
    shipping: "Versand",
    free: "kostenlos",
    total: "Gesamt",
    country: "Lieferland",
    pay: "Weiter zur Zahlung",
    paying: "Einen Moment …",
    error: "Die Zahlungsseite konnte nicht geöffnet werden. Bitte versuch es noch einmal.",
    note: "Du bezahlst auf der sicheren Seite von Stripe. Preise inkl. MwSt.",
  },
  success: { title: ["Danke. ", "Deine Bestellung ist da."], body: "Stripe schickt dir die Quittung per E-Mail. Wir packen deine Sticker und schicken sie dir per Post.", back: "Zurück zum Shop" },
  cancel: { title: ["Zahlung ", "abgebrochen."], body: "Es wurde nichts belastet. Dein Warenkorb ist noch da.", back: "Zurück zum Shop" },
  shippingLink: "Versand & Zahlung",
};

export const shopCopy: Record<Locale, typeof en> = { en, de };
export type ShopCopy = typeof en;

/** Country names for the shipping selector, in the page language. */
export const countryName = (code: string, lang: Locale) => new Intl.DisplayNames([lang === "de" ? "de-DE" : "en-GB"], { type: "region" }).of(code) ?? code;
