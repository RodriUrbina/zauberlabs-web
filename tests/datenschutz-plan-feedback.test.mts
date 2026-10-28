import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// JSX joins source lines with one space, so compare with whitespace collapsed.
const ds = fs.readFileSync(path.join(process.cwd(), "app", "[lang]", "datenschutz", "page.tsx"), "utf8").replace(/\s+/g, " ");

describe("Datenschutz § 10: plan feedback (BL-098, E46 T-196)", () => {
  test("the new paragraph, word for word, sits between the 'Ohne Konto setzt' paragraph and the account paragraph", () => {
    const para =
      "<strong>Rückmeldung zu deinem Plan (optional).</strong> Auf der Seite „Mein E46-Plan“ kannst du den Konfigurator mit 1 bis 5 Sternen bewerten, aus festen Themen auswählen, was du dir als Nächstes wünschst, und eine kurze Notiz (höchstens 200 Zeichen) hinzufügen. Wir speichern deine Bewertung, die gewählten Themen und deine Notiz nur zusammen mit der zufälligen Kennung der Konfiguration – ohne Namen, E-Mail-Adresse oder IP-Adresse – und nutzen sie nur, um zu entscheiden, was wir verbessern und als Nächstes ergänzen. Bitte schreib keine persönlichen Angaben in die Notiz. Die Rückmeldungen bewahren wir so lange auf wie die Konfiguration (siehe oben), auch wenn du dein Konto löschst oder die Konfiguration aus deinem Konto entfernst; sie haben dann keinen Bezug mehr zu dir. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Verbesserung des Konfigurators).";
    const at = ds.indexOf(para);
    assert.ok(at > 0, "paragraph present verbatim");
    assert.ok(ds.indexOf("Ohne Konto setzt E46BUILD keine Cookies") < at && at < ds.indexOf("<strong>Konto (optional): Konfigurationen speichern.</strong>"));
  });
  test("the account paragraph names the one exception", () => {
    assert.ok(ds.includes("deine Konfigurationen bleiben ohne Bezug zu dir und ohne von dir eingegebene Freitexte erhalten (siehe oben) – mit Ausnahme der Notiz in einer Rückmeldung zu deinem Plan, die ebenfalls ohne Bezug zu dir erhalten bleibt."));
  });
});
