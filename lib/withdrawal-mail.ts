import { OWNER } from "./legal-entity";

/** BL-085 — the withdrawal declaration's fields (max lengths) and the confirmation of receipt (§ 356a Abs. 4 BGB). */
export const FIELDS = { name: 200, email: 200, order: 200, orderedAt: 40, items: 1000 } as const;
export type Declaration = Record<keyof typeof FIELDS, string>;

/** "2026-10-27" (the form's date field) → "27.10.2026"; anything else is shown as typed. */
export const germanDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
};

/** "27.10.2026, 15:04 Uhr" in German time. */
export const berlinTime = (d: Date) =>
  `${d.toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })} Uhr (deutsche Zeit)`;

/** The confirmation of receipt (German, like the withdrawal notice), plain text. */
export function confirmationText(d: Declaration, receivedAt: Date): string {
  return [
    `Hallo ${d.name},`,
    "",
    "wir haben deinen Widerruf erhalten. Das ist die Eingangsbestätigung nach § 356a BGB.",
    "",
    `Eingegangen am: ${berlinTime(receivedAt)}`,
    "",
    "Inhalt deiner Widerrufserklärung:",
    `- Name: ${d.name}`,
    `- E-Mail-Adresse: ${d.email}`,
    `- Bestellnummer oder Belegnummer: ${d.order}`,
    `- Bestellt am: ${germanDate(d.orderedAt) || "(nicht angegeben)"}`,
    `- Widerrufene Artikel: ${d.items || "die ganze Bestellung"}`,
    "",
    "Wie es weitergeht: Schick die Sticker bitte innerhalb von 14 Tagen an uns zurück. Die Einzelheiten stehen in der Widerrufsbelehrung: https://www.zauberlabs.de/de/widerrufsbelehrung",
    "",
    `${OWNER.name}, zauberlabs`,
    `${OWNER.street}, ${OWNER.city}, ${OWNER.country}`,
    OWNER.email,
  ].join("\n");
}
