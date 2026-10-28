import { OWNER } from "../legal-entity";
import type { Block } from "./blocks";

/**
 * BL-085 → BL-090 — Widerrufsbelehrung and Muster-Widerrufsformular, moved here unchanged from
 * app/[lang]/widerrufsbelehrung/page.tsx so the page and the order confirmation e-mail use one source. The statutory models
 * (Anlage 1 and 2 zu Art. 246a § 1 Abs. 2 EGBGB, filed as Art. 253 Anlage 1/2, "zuletzt geändert durch Art. 2 G v. 16.7.2026
 * I Nr. 212") word for word, with only the Gestaltungshinweise filled in (1 b, 2, 3 with our online function, 4, 5 a–c).
 * Keep the model's „Sie" and its „…/die Erbringung der folgenden Dienstleistung (*)" — editing the model risks its legal
 * protection. Not lawyer-reviewed.
 */
export const WITHDRAW_URL = { de: "https://www.zauberlabs.de/de/vertrag-widerrufen", en: "https://www.zauberlabs.de/en/vertrag-widerrufen" } as const;

export function widerruf(lang: "de" | "en"): { title: string; blocks: Block[] } {
  const o = OWNER;
  const us = `${o.name}, zauberlabs, ${o.street}, ${o.city}, ${o.country}`;
  if (lang === "en") {
    const url = WITHDRAW_URL.en;
    return {
      title: "Withdrawal notice",
      blocks: [
        { h2: "Right of withdrawal" },
        { p: ["You have the right to withdraw from this contract within fourteen days without giving any reason."] },
        { p: ["The withdrawal period is fourteen days from the day on which you, or a third party named by you other than the carrier, take possession of the goods."] },
        {
          p: [
            `To exercise your right of withdrawal, you must inform us (${us}, phone: ${o.phone}, e-mail: ${o.email}) of your decision to withdraw from this contract by an unequivocal statement (e.g. a letter sent by post or an e-mail). You may use the attached model withdrawal form, but it is not obligatory. You can also exercise your right of withdrawal online at `,
            { text: url, href: url },
            ' ("Vertrag widerrufen"). If you use this online function, we will send you, without delay and on a durable medium (e.g. by e-mail), a confirmation of receipt stating the content of your withdrawal and the date and time it was received.',
          ],
        },
        { p: ["To meet the withdrawal deadline, it is enough that you send your notice of withdrawal before the withdrawal period has expired."] },
        { h2: "Effects of withdrawal" },
        { p: ["If you withdraw from this contract, we will refund all payments received from you, including the costs of delivery (except for any extra costs resulting from your choice of a type of delivery other than the cheapest standard delivery we offer), without undue delay and in any event no later than fourteen days from the day on which we are informed of your withdrawal from this contract. We will make the refund using the same means of payment that you used for the original transaction, unless expressly agreed otherwise with you; in any event, you will not be charged any fees for the refund. We may withhold the refund until we have received the goods back or until you have supplied proof of having sent them back, whichever is earlier."] },
        { p: [`You must send back or hand over the goods to us (${us}) without undue delay and in any event no later than fourteen days from the day on which you tell us of your withdrawal from this contract. The deadline is met if you send the goods back before the period of fourteen days has expired.`] },
        { p: ["You bear the direct cost of returning the goods."] },
        { p: ["You are only liable for any loss in value of the goods if that loss results from handling them in a way that was not necessary to establish their nature, characteristics and functioning."] },
        { hr: true },
        { h2: "Model withdrawal form" },
        { p: ["(Complete and return this form only if you wish to withdraw from the contract.)"] },
        {
          lines: [
            [`– To ${us}, e-mail: ${o.email}:`],
            ["– I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*)/for the provision of the following service (*)"],
            ["– Ordered on (*)/received on (*)"],
            ["– Name of consumer(s)"],
            ["– Address of consumer(s)"],
            ["– Signature of consumer(s) (only if this form is notified on paper)"],
            ["– Date"],
          ],
        },
        { p: ["(*) Delete as appropriate."] },
      ],
    };
  }
  const url = WITHDRAW_URL.de;
  return {
    title: "Widerrufsbelehrung",
    blocks: [
      { h2: "Widerrufsrecht" },
      { p: ["Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen."] },
      { p: ["Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat."] },
      {
        p: [
          `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${us}, Telefon: ${o.phone}, E-Mail: ${o.email}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Sie können Ihr Widerrufsrecht auch online unter `,
          { text: url, href: url },
          " („Vertrag widerrufen“) ausüben. Wenn Sie diese Online-Funktion nutzen, übermitteln wir Ihnen auf einem dauerhaften Datenträger (z. B. durch eine E-Mail) unverzüglich eine Eingangsbestätigung mit Informationen zum Inhalt der Widerrufserklärung sowie dem Datum und der Uhrzeit ihres Eingangs.",
        ],
      },
      { p: ["Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden."] },
      { h2: "Folgen des Widerrufs" },
      { p: ["Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet. Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist."] },
      { p: [`Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns (${us}) zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.`] },
      { p: ["Sie tragen die unmittelbaren Kosten der Rücksendung der Waren."] },
      { p: ["Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist."] },
      { hr: true },
      { h2: "Muster-Widerrufsformular" },
      { p: ["(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)"] },
      {
        lines: [
          [`– An ${us}, E-Mail: ${o.email}:`],
          ["– Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)"],
          ["– Bestellt am (*)/erhalten am (*)"],
          ["– Name des/der Verbraucher(s)"],
          ["– Anschrift des/der Verbraucher(s)"],
          ["– Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)"],
          ["– Datum"],
        ],
      },
      { p: ["(*) Unzutreffendes streichen."] },
    ],
  };
}
