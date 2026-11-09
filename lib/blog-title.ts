/**
 * BL-126 (PO 2026-11-09, "Yes, all articles") — an article's h1 in the title code (components/Title.tsx, BL-111): a bold lead
 * and the accent in the orange italic serif. Only the visible h1; <title>, meta, og:title, feed and sitemap keep the plain title.
 *
 * Where the accent starts, first rule that applies:
 *   1. the first colon (outside quotes): "One cover for every Sedan and Touring: | the genuine E46 M front bumper"
 *   2. no colon, a question first: "Genuine or replica? | How to read an E46 wheel listing"
 *   3. else the last ", " / " – " / " — ": "The wheel that fits an E46, | unless the E46 is American"
 *   4. else the last three words: "What four genuine E46 wheels really | cost in 2026"
 * The lead keeps its punctuation and the space before the accent; the accent is trimmed.
 * TITLE_ACCENTS overrides the rules for a title the PO split by hand (it wins over every rule).
 */

/** Hand-picked accents, by the exact title (PO 2026-11-09 for the wheels-cost article; rule 4 split it as "…really | cost in 2026"). */
export const TITLE_ACCENTS: Readonly<Record<string, string>> = {
  "What four genuine E46 wheels really cost in 2026": "really cost in 2026",
  "Was vier originale E46-Felgen 2026 wirklich kosten": "2026 wirklich kosten",
};

export function splitTitle(title: string): { lead: string; accent: string } {
  const t = title.trim();
  const manual = TITLE_ACCENTS[t];
  if (manual && t.endsWith(manual)) return cut(t, t.length - manual.length);
  const colon = firstOutsideQuotes(t, ":");
  if (colon > 0 && t.slice(colon + 1).trim()) return cut(t, colon + 1);
  const question = firstOutsideQuotes(t, "?");
  if (question > 0 && t.slice(question + 1).trim()) return cut(t, question + 1);
  const breaks = [t.lastIndexOf(", "), t.lastIndexOf(" – "), t.lastIndexOf(" — ")];
  const last = Math.max(...breaks);
  if (last > 0) return cut(t, t[last] === "," ? last + 1 : last + 2);
  const words = t.split(" ");
  if (words.length > 3) return cut(t, t.length - words.slice(-3).join(" ").length);
  return { lead: "", accent: t };
}

function cut(t: string, at: number) {
  const accent = t.slice(at).trim();
  return { lead: `${t.slice(0, at).trimEnd()} `, accent };
}

/** Index of the first `ch` not inside „…“, "…" or “…” quotes (so a colon in a quoted phrase is not a split point), or -1. */
function firstOutsideQuotes(t: string, ch: string): number {
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === "„" || (c === "“" && depth === 0)) depth++; // „ opens (German); “ opens only when not closing a „
    else if ((c === "“" || c === "”") && depth > 0) depth--;
    else if (c === '"') depth = depth > 0 ? depth - 1 : depth + 1;
    else if (c === ch && depth === 0) return i;
  }
  return -1;
}
