import { SITE } from "./legal/blocks";
import { OWNER } from "./legal-entity";
import { formatEuro } from "./shop-pricing";
import { berlinTime } from "./withdrawal-mail";

/**
 * BL-090 — the order confirmation e-mail: a designed HTML part in the zauberlabs look plus a plain-text alternative, both from
 * the same data (the paid Stripe session), in the language of the order. PO 2026-10-28: the body carries the order details and
 * LINKS to the AGB, the Widerrufsbelehrung and the withdrawal function; no legal text in the body and no attachment (links
 * only — the PO accepted that explicitly).
 */

/** The logo for mail clients: a hosted PNG (inline SVG is blocked by Gmail/Outlook); the text wordmark stands next to it. */
export const MAIL_LOGO = `${SITE}/email/spark.png`;

export type Order = {
  lang: "de" | "en";
  ref: string; // the PaymentIntent id (searchable in the Stripe dashboard)
  created: Date;
  email: string;
  name: string;
  items: { name: string; quantity: number; amount: number }[]; // amount = line total in cents, gross, before discounts
  shipping: number; // cents, gross (Stripe's shipping_cost.amount_total)
  total: number; // cents, gross (Stripe's amount_total; never recomputed)
  address: string[]; // name and address lines as Stripe collected them (country written out)
  country: string; // ISO code of the delivery country
};

/**
 * The difference between Stripe's total and items + shipping: a discount/promo code or any other adjustment (negative = less
 * to pay). Printed as its own line so the mail always adds up to the total Stripe charged.
 */
export const adjustmentOf = (o: Pick<Order, "items" | "shipping" | "total">) => o.total - (o.items.reduce((s, i) => s + i.amount, 0) + o.shipping);

/** The VAT included in a gross amount at 19 % (all prices are gross). */
export const vatIn = (gross: number) => Math.round((gross * 19) / 119);

const COPY = {
  de: {
    subject: (ref: string) => `Deine Bestellung bei zauberlabs (${ref})`,
    thanks: "Danke für deinen Kauf!",
    intro: "hier ist deine Bestellung.", // follows „Hallo …," on the next line
    hello: (name: string) => (name ? `Hallo ${name},` : "Hallo,"),
    date: "Bestelldatum",
    ref: "Bestellnummer",
    order: "Deine Bestellung",
    shipping: "Versand",
    free: "kostenlos",
    adjustment: "Rabatt/Anpassung",
    total: "Gesamt",
    vat: (v: string) => `inkl. 19 % MwSt.: ${v}`,
    address: "Lieferadresse",
    delivery: "Lieferzeit",
    deliveryDe: "3–5 Werktage nach Zahlungseingang (Deutsche Post, Brief)",
    deliveryEu: "7–14 Werktage nach Zahlungseingang (DHL Päckchen)",
    legal: "Unsere AGB und die Widerrufsbelehrung:",
    agb: "AGB",
    widerruf: "Widerrufsbelehrung",
    withdraw: "Vertrag widerrufen",
    questions: "Fragen? Antworte einfach auf diese E-Mail.",
    fans: "Von E46-Fans für E46-Fans – danke, dass du dabei bist.",
    vatId: "USt-IdNr.",
  },
  en: {
    subject: (ref: string) => `Your zauberlabs order (${ref})`,
    thanks: "Thanks for your purchase!",
    intro: "here is your order.",
    hello: (name: string) => (name ? `Hello ${name},` : "Hello,"),
    date: "Order date",
    ref: "Order number",
    order: "Your order",
    shipping: "Shipping",
    free: "free",
    adjustment: "Discount/adjustment",
    total: "Total",
    vat: (v: string) => `incl. 19 % VAT: ${v}`,
    address: "Delivery address",
    delivery: "Delivery time",
    deliveryDe: "3–5 working days after payment (Deutsche Post, letter)",
    deliveryEu: "7–14 working days after payment (DHL small parcel)",
    legal: "Our terms and withdrawal information:",
    agb: "Terms",
    widerruf: "Withdrawal information",
    withdraw: "Withdraw from contract",
    questions: "Questions? Just reply to this e-mail.",
    fans: "From one E46 fan to another – thanks for being part of it.",
    vatId: "VAT ID",
  },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Everything both parts show, computed once, so the HTML and the text can never disagree. */
function facts(o: Order) {
  const c = COPY[o.lang];
  const eur = (n: number) => formatEuro(n, o.lang);
  const adj = adjustmentOf(o);
  const when = o.lang === "de" ? berlinTime(o.created) : `${o.created.toLocaleString("en-GB", { timeZone: "Europe/Berlin", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} (German time)`;
  return {
    c,
    when,
    lines: o.items.map((i) => ({ label: `${i.quantity} × ${i.name}`, amount: eur(i.amount) })),
    shipping: o.shipping === 0 ? c.free : eur(o.shipping),
    adjustment: adj === 0 ? null : `${adj < 0 ? "−" : "+"}${eur(Math.abs(adj))}`,
    total: eur(o.total),
    vat: c.vat(eur(vatIn(o.total))),
    delivery: o.country === "DE" ? c.deliveryDe : c.deliveryEu,
    links: {
      agb: `${SITE}/${o.lang}/agb`,
      widerruf: `${SITE}/${o.lang}/widerrufsbelehrung`,
      withdraw: `${SITE}/${o.lang}/vertrag-widerrufen`,
    },
  };
}

export function orderText(o: Order): string {
  const f = facts(o);
  const c = f.c;
  return [
    c.thanks,
    "",
    c.hello(o.name),
    c.intro,
    "",
    `${c.date}: ${f.when}`,
    `${c.ref}: ${o.ref}`,
    "",
    `${c.order}:`,
    ...f.lines.map((l) => `- ${l.label} — ${l.amount}`),
    `${c.shipping}: ${f.shipping}`,
    ...(f.adjustment ? [`${c.adjustment}: ${f.adjustment}`] : []),
    `${c.total}: ${f.total} (${f.vat})`,
    "",
    `${c.address}:`,
    ...o.address,
    "",
    `${c.delivery}: ${f.delivery}`,
    "",
    c.legal,
    `${c.agb}: ${f.links.agb}`,
    `${c.widerruf}: ${f.links.widerruf}`,
    `${c.withdraw}: ${f.links.withdraw}`,
    "",
    c.questions,
    "",
    c.fans,
    "",
    "zauberlabs",
    `${OWNER.name} · ${OWNER.street}, ${OWNER.city}, ${OWNER.country}`,
    `${OWNER.email} · ${OWNER.phone} · ${c.vatId} ${OWNER.vatId}`,
    "",
  ].join("\n");
}

/** Table-based, inline-styled HTML (≤ 600 px, readable on phones and with images blocked). Colours from app/globals.css. */
export function orderHtml(o: Order, logoUrl = MAIL_LOGO): string {
  const f = facts(o);
  const c = f.c;
  const PAPER = "#f4f1ec", IVORY = "#eeebe5", INK = "#0e0e10", BODY = "#3a3833", MUTED = "#5b5852", LINE = "#cfc9be", ACCENT = "#c4441c";
  const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const SERIF = "Georgia, 'Times New Roman', serif";
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;font:${strong ? "700" : "400"} 15px/1.45 ${SANS};color:${INK};">${label}</td><td align="right" style="padding:6px 0 6px 16px;font:${strong ? "700" : "400"} 15px/1.45 ${SANS};color:${INK};white-space:nowrap;">${value}</td></tr>`;
  const label = (t: string) => `<p style="margin:0 0 6px;font:600 11px/1.4 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:${MUTED};">${esc(t)}</p>`;
  const link = (href: string, text: string) => `<a href="${href}" style="color:${ACCENT};text-decoration:underline;">${esc(text)}</a>`;
  return `<!doctype html>
<html lang="${o.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(c.subject(o.ref))}</title></head>
<body style="margin:0;padding:0;background:${IVORY};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${PAPER};border:1px solid ${LINE};border-radius:16px;">
<tr><td style="padding:24px 28px 8px;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle;padding-right:8px;"><img src="${logoUrl}" width="24" height="24" alt="" style="display:block;border:0;"></td>
    <td style="vertical-align:middle;font:800 22px/1 ${SANS};letter-spacing:-.02em;color:${INK};">zauber<span style="font-weight:400;">labs</span></td>
  </tr></table>
</td></tr>
<tr><td style="padding:20px 28px 4px;">
  <h1 style="margin:0;font:800 30px/1.1 ${SANS};letter-spacing:-.03em;color:${INK};">${esc(c.thanks.replace(/!$/, ""))}<span style="font:italic 400 30px/1.1 ${SERIF};color:${ACCENT};">!</span></h1>
  <p style="margin:14px 0 0;font:400 16px/1.5 ${SANS};color:${BODY};">${esc(c.hello(o.name))}<br>${esc(c.intro)}</p>
</td></tr>
<tr><td style="padding:20px 28px 0;">
  <p style="margin:0;font:400 14px/1.6 ${SANS};color:${MUTED};">${esc(c.date)}: ${esc(f.when)}<br>${esc(c.ref)}: <span style="font-family:Menlo, Consolas, monospace;color:${INK};">${esc(o.ref)}</span></p>
</td></tr>
<tr><td style="padding:20px 28px 0;">
  ${label(c.order)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">
    ${f.lines.map((l) => row(esc(l.label), esc(l.amount))).join("\n    ")}
    ${row(esc(c.shipping), esc(f.shipping))}
    ${f.adjustment ? row(esc(c.adjustment), esc(f.adjustment)) : ""}
    <tr><td colspan="2" style="border-top:1px solid ${LINE};font-size:0;line-height:0;">&nbsp;</td></tr>
    ${row(esc(c.total), esc(f.total), true)}
    <tr><td colspan="2" align="right" style="padding:0 0 4px;font:400 13px/1.4 ${SANS};color:${MUTED};">${esc(f.vat)}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:20px 28px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td valign="top" style="padding:0 12px 0 0;width:50%;">${label(c.address)}<p style="margin:0;font:400 15px/1.5 ${SANS};color:${INK};">${o.address.map(esc).join("<br>")}</p></td>
    <td valign="top" style="width:50%;">${label(c.delivery)}<p style="margin:0;font:400 15px/1.5 ${SANS};color:${INK};">${esc(f.delivery)}</p></td>
  </tr></table>
</td></tr>
<tr><td style="padding:24px 28px 0;">
  <p style="margin:0;font:400 15px/1.6 ${SANS};color:${BODY};">${esc(c.legal)} ${link(f.links.agb, c.agb)} · ${link(f.links.widerruf, c.widerruf)}</p>
  <p style="margin:10px 0 0;font:600 15px/1.6 ${SANS};">${link(f.links.withdraw, c.withdraw)}</p>
</td></tr>
<tr><td style="padding:24px 28px 0;">
  <p style="margin:0;font:400 15px/1.6 ${SANS};color:${BODY};">${esc(c.questions)}</p>
  <p style="margin:14px 0 0;font:italic 400 17px/1.5 ${SERIF};color:${INK};">${esc(c.fans)}</p>
</td></tr>
<tr><td style="padding:24px 28px 28px;">
  <p style="margin:0;padding-top:16px;border-top:1px solid ${LINE};font:400 12px/1.6 ${SANS};color:${MUTED};">zauberlabs · ${esc(OWNER.name)} · ${esc(OWNER.street)}, ${esc(OWNER.city)}, ${esc(OWNER.country)}<br>${esc(OWNER.email)} · ${esc(OWNER.phone)} · ${esc(c.vatId)} ${esc(OWNER.vatId)}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** The whole mail: subject, plain text and HTML. */
export function orderMail(o: Order, logoUrl = MAIL_LOGO): { subject: string; text: string; html: string } {
  return { subject: COPY[o.lang].subject(o.ref), text: orderText(o), html: orderHtml(o, logoUrl) };
}
