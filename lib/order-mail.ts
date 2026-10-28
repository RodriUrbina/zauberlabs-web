import { agb } from "./legal/agb";
import { blocksText, clausesText } from "./legal/blocks";
import { widerruf, WITHDRAW_URL } from "./legal/widerruf";
import { OWNER } from "./legal-entity";
import { formatEuro } from "./shop-pricing";
import { berlinTime } from "./withdrawal-mail";

/**
 * BL-090 — the order confirmation e-mail (§ 312f BGB: the contract confirmation on a durable medium, with the full terms and
 * the withdrawal notice). Everything comes from the paid Stripe session; the AGB and the Widerrufsbelehrung are rendered from
 * lib/legal/*, the same source as the live pages, so the e-mail and the pages cannot drift. German is binding; the English
 * e-mail is a convenience translation and says so. Plain text: it survives every mail client and prints as it reads.
 */
export type Order = {
  lang: "de" | "en";
  ref: string; // the PaymentIntent id (searchable in the Stripe dashboard)
  created: Date;
  email: string;
  name: string;
  items: { name: string; quantity: number; amount: number }[]; // amount = line total in cents, gross, before discounts
  shipping: number; // cents, gross (Stripe's shipping_cost.amount_total)
  total: number; // cents, gross (Stripe's amount_total; never recomputed)
  address: string[]; // name and address lines as Stripe collected them
  country: string; // ISO code of the delivery country
};

/**
 * The difference between Stripe's total and items + shipping: a discount/promo code or any other adjustment (negative = less
 * to pay). Printed as its own line so the mail always adds up to the total Stripe charged.
 */
export const adjustmentOf = (o: Pick<Order, "items" | "shipping" | "total">) => o.total - (o.items.reduce((s, i) => s + i.amount, 0) + o.shipping);

/** The VAT included in a gross amount at 19 % (all prices are gross). */
export const vatIn = (gross: number) => Math.round((gross * 19) / 119);

export function orderMail(o: Order): { subject: string; text: string } {
  const de = o.lang === "de";
  const eur = (c: number) => formatEuro(c, o.lang);
  const when = de ? berlinTime(o.created) : `${o.created.toLocaleString("en-GB", { timeZone: "Europe/Berlin", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} (German time)`;
  const delivery = o.country === "DE"
    ? de ? "3–5 Werktage nach Zahlungseingang (Deutsche Post, Brief)" : "3–5 working days after payment (Deutsche Post, letter)"
    : de ? "7–14 Werktage nach Zahlungseingang (DHL Päckchen)" : "7–14 working days after payment (DHL small parcel)";
  const items = o.items.map((i) => `- ${i.quantity} × ${i.name} — ${eur(i.amount)}`);
  const adj = adjustmentOf(o);
  const adjLine = adj === 0 ? [] : [`${de ? "Rabatt/Anpassung" : "Discount/adjustment"}: ${adj < 0 ? "−" : "+"}${eur(Math.abs(adj))}`];
  const terms = agb(o.lang);
  const notice = widerruf(o.lang);
  const rule = "────────────────────────────────────────";

  const head = de
    ? [
        `Hallo ${o.name},`,
        "",
        "danke für deine Bestellung bei zauberlabs. Mit dieser E-Mail bestätigen wir dir den Kaufvertrag. Unten findest du unsere AGB und die Widerrufsbelehrung mit dem Muster-Widerrufsformular.",
        "",
        `Bestelldatum: ${when}`,
        `Bestellnummer: ${o.ref}`,
        "",
        "Deine Bestellung:",
        ...items,
        `Versand: ${o.shipping === 0 ? "kostenlos" : eur(o.shipping)}`,
        ...adjLine,
        `Gesamt: ${eur(o.total)} (inkl. 19 % MwSt.: ${eur(vatIn(o.total))})`,
        "",
        "Lieferadresse:",
        ...o.address,
        "",
        `Lieferzeit: ${delivery}`,
        "",
        `Widerruf: Du kannst den Vertrag innerhalb von 14 Tagen widerrufen, auch online unter ${WITHDRAW_URL.de} („Vertrag widerrufen“). Die Einzelheiten stehen in der Widerrufsbelehrung unten.`,
        "",
        "Fragen? Antworte einfach auf diese E-Mail.",
        "",
        `${OWNER.name}, zauberlabs`,
        `${OWNER.street}, ${OWNER.city}, ${OWNER.country}`,
        `${OWNER.email} · ${OWNER.phone} · USt-IdNr. ${OWNER.vatId}`,
      ]
    : [
        `Hello ${o.name},`,
        "",
        "thank you for your order at zauberlabs. This e-mail confirms your purchase contract. Below are our terms and conditions and the withdrawal notice with the model withdrawal form.",
        "Note: this English text is a convenience translation; only the German text is binding (https://www.zauberlabs.de/de/agb, https://www.zauberlabs.de/de/widerrufsbelehrung).",
        "",
        `Order date: ${when}`,
        `Order number: ${o.ref}`,
        "",
        "Your order:",
        ...items,
        `Shipping: ${o.shipping === 0 ? "free" : eur(o.shipping)}`,
        ...adjLine,
        `Total: ${eur(o.total)} (incl. 19 % VAT: ${eur(vatIn(o.total))})`,
        "",
        "Delivery address:",
        ...o.address,
        "",
        `Delivery time: ${delivery}`,
        "",
        `Withdrawal: you can withdraw from the contract within 14 days, also online at ${WITHDRAW_URL.en} ("Vertrag widerrufen"). The details are in the withdrawal notice below.`,
        "",
        "Questions? Just reply to this e-mail.",
        "",
        `${OWNER.name}, zauberlabs`,
        `${OWNER.street}, ${OWNER.city}, ${OWNER.country}`,
        `${OWNER.email} · ${OWNER.phone} · VAT ID ${OWNER.vatId}`,
      ];

  const text = [
    ...head,
    "",
    rule,
    terms.title.toUpperCase(),
    "",
    blocksText(terms.intro),
    "",
    clausesText(terms.clauses),
    "",
    rule,
    notice.title.toUpperCase(),
    "",
    blocksText(notice.blocks),
    "",
  ].join("\n");
  return { subject: de ? `Deine Bestellung bei zauberlabs (${o.ref})` : `Your zauberlabs order (${o.ref})`, text };
}
