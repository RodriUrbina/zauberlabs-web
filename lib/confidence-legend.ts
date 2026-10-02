import type { Locale } from "./i18n";

/**
 * The ONE site-level HIGH / MEDIUM / LOW legend shown under every "Sources & confidence" box.
 * PO decision 2026-10-02 (BL-001): articles carry no legend of their own; this text is the only one.
 *
 * Definition source (read-only): e46build master docs/research/research-evidence-index.md —
 *   "HIGH = two mirrors agree at part number + date level; MEDIUM = one mirror; LOW = non-catalogue source only"
 * plus the PO's addition: a BMW-authored document read in full = HIGH.
 * MEDIUM wording widened per the Editor's review of PR #5, PO-approved 2026-10-02.
 * Editor: review this text here; nowhere else.
 */
export const CONFIDENCE_LEGEND: Record<Locale, { title: string; items: { level: "HIGH" | "MEDIUM" | "LOW" | "NA"; text: string }[] }> = {
  en: {
    title: "How sure we are",
    items: [
      { level: "HIGH", text: "A BMW-authored document read in full, or two independent parts-catalogue mirrors that agree at part-number and date level." },
      { level: "MEDIUM", text: "A single parts-catalogue mirror, or an official or reference text (a BMW document, a regulation, an encyclopaedia) that we could only read second-hand or that no catalogue page confirms directly." },
      { level: "LOW", text: "A non-catalogue source only (forums, retailers). Shown as an indication, never as fact." },
      { level: "NA", text: "An internal summary of the sources above; it carries no grade of its own." },
    ],
  },
  de: {
    title: "Wie sicher wir sind",
    items: [
      { level: "HIGH", text: "Ein vollständig gelesenes BMW-eigenes Dokument oder zwei unabhängige Teilekatalog-Spiegel, die auf Teilenummer- und Datumsebene übereinstimmen." },
      { level: "MEDIUM", text: "Ein einzelner Teilekatalog-Spiegel oder ein offizieller oder Referenztext (ein BMW-Dokument, eine Vorschrift, eine Enzyklopädie), den wir nur aus zweiter Hand lesen konnten oder den keine Katalogseite direkt bestätigt." },
      { level: "LOW", text: "Nur eine Quelle außerhalb des Katalogs (Foren, Händler). Als Hinweis gezeigt, nie als Tatsache." },
      { level: "NA", text: "Eine interne Zusammenfassung der obigen Quellen; sie trägt keine eigene Einstufung." },
    ],
  },
};
