import { Fragment } from "react";
import type { CiteGroup } from "@/lib/remark-cite";
import type { Locale } from "@/lib/i18n";

/**
 * Inline evidence mark ([S4, HIGH] / [S9, MEDIUM; S11, MEDIUM for …] in the article), rendered Wikipedia-style
 * (BL-023, PO decision 2026-10-03): superscript source numbers only — "⁴" or "⁹,¹¹" — each linking to the entry in
 * the Sources box. No grade, no colour, no qualifier in the text; ids, grade and qualifier live in the link's tooltip.
 * The MDX mark syntax, the front matter and the Sources box are unchanged.
 */
export default function Cite({ groups, lang = "en" }: { groups: string | CiteGroup[]; lang?: Locale }) {
  const list: CiteGroup[] = typeof groups === "string" ? safeParse(groups) : groups;
  const refs = flatten(list);
  if (!refs.length) return null;
  const word = lang === "de" ? "Quelle" : "Source";
  return (
    <sup className="cite">
      {refs.map((r, i) => (
        <Fragment key={r.id}>
          {i > 0 && ","}
          <a href={`#src-${r.id.toLowerCase()}`} title={r.tooltip} aria-label={`${word} ${r.number}${r.tooltip ? `: ${r.tooltip}` : ""}`}>
            {r.number}
          </a>
        </Fragment>
      ))}
    </sup>
  );
}

type Ref = { id: string; number: string; tooltip: string };

/** One reference per source id, in order of appearance, deduplicated; the tooltip carries the whole group's information. */
function flatten(groups: CiteGroup[]): Ref[] {
  const out: Ref[] = [];
  const seen = new Set<string>();
  for (const g of groups) {
    const tooltip = [g.ids.join(", "), g.level].filter(Boolean).join(" · ") + (g.qualifier ? ` — ${g.qualifier}` : "");
    for (const id of g.ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ id, number: id.replace(/^S/i, "") || id, tooltip });
    }
  }
  return out;
}

function safeParse(s: string): CiteGroup[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
