import type { Root, Text, PhrasingContent } from "mdast";

/**
 * Turns the Writer's inline evidence marks into <Cite> elements.
 *
 *   [S1]                                  → chip "S1"
 *   [S1, HIGH]                            → chip "S1 · HIGH"
 *   [S1, HIGH that it says so]            → chip "S1 · HIGH" + caveat "(that it says so)"
 *   [S1, HIGH: both mirrors]              → caveat "(both mirrors)"            (leading colon stripped)
 *   [S2, S4]                              → chip "S2, S4"
 *   [S2, HIGH for x; S4, LOW for y]       → two chips separated by "; "
 *   [S1, HIGH for the scope; the month itself MEDIUM]
 *                                         → one chip "S1 · HIGH", caveat keeps BOTH parts:
 *                                           "(for the scope; the month itself MEDIUM)".
 *                                           A ";"-segment without a source id is never dropped (Editor review, BL-001).
 *   [S3, LOW–MEDIUM: inspection guides]   → chip "S3 · LOW" (lower grade wins), caveat keeps the full text
 *                                           "(LOW–MEDIUM: inspection guides)".
 *
 * Only text that starts with S<digits> inside square brackets is touched, so Markdown links,
 * inline code and other brackets are unaffected. If a mark has no source id at all it stays plain text.
 * Pure mdast transform; no JSX in the article file.
 */

export type Level = "HIGH" | "MEDIUM" | "LOW";
export type CiteGroup = { ids: string[]; level?: Level; qualifier?: string };

const MARK = /\[(S\d+(?:[^\]\n]*)?)\]/g;
const ID = /\bS\d+\b/g;
const GRADE = "(HIGH|MEDIUM|LOW)";
const COMPOUND = new RegExp(`\\b${GRADE}\\s*[-–/]\\s*${GRADE}\\b`);
const SINGLE = new RegExp(`\\b${GRADE}\\b`);
const RANK: Record<Level, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

const lower = (a: Level, b: Level): Level => (RANK[a] <= RANK[b] ? a : b);

/** Strips the punctuation that separates an id or grade from the caveat text: ", " ": " "– " etc. */
const trimPunct = (s: string) =>
  s
    .replace(/^[\s,:;–—-]+/, "")
    .replace(/[\s,:;]+$/, "")
    .replace(/\s+([,;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

export function parseCite(inner: string): CiteGroup[] {
  const groups: CiteGroup[] = [];
  for (const rawPart of inner.split(";")) {
    const part = rawPart.trim();
    if (!part) continue;
    const ids = [...part.matchAll(ID)].map((m) => m[0]);

    if (!ids.length) {
      // Caveat without its own source: belongs to the preceding chip. Never dropped.
      const prev = groups[groups.length - 1];
      if (!prev) return []; // no chip to attach to → leave the whole mark as plain text
      const caveat = trimPunct(part);
      if (caveat) prev.qualifier = prev.qualifier ? `${prev.qualifier}; ${caveat}` : caveat;
      continue;
    }

    const rest = part.replace(ID, "");
    let level: Level | undefined;
    let qualifier: string;
    const compound = rest.match(COMPOUND);
    if (compound) {
      // "LOW–MEDIUM": the lower grade is the chip; the full wording stays visible as the caveat.
      level = lower(compound[1] as Level, compound[2] as Level);
      qualifier = trimPunct(rest);
    } else {
      const single = rest.match(SINGLE);
      level = single ? (single[1] as Level) : undefined;
      // A grade that opens the segment ("HIGH for x") is the chip's grade and leaves the text;
      // a grade mentioned later ("numbers HIGH for Europe") is part of the caveat and stays in it.
      const opensWithGrade = single ? /^[\s,:]*(HIGH|MEDIUM|LOW)\b/.test(rest) : false;
      qualifier = trimPunct(opensWithGrade ? rest.replace(SINGLE, "") : rest);
    }
    groups.push({ ids, level, qualifier: qualifier || undefined });
  }
  return groups;
}

type JsxAttr = { type: "mdxJsxAttribute"; name: string; value: string };
type JsxText = { type: "mdxJsxTextElement"; name: string; attributes: JsxAttr[]; children: PhrasingContent[] };

function citeNode(groups: CiteGroup[]): JsxText {
  return {
    type: "mdxJsxTextElement",
    name: "Cite",
    attributes: [{ type: "mdxJsxAttribute", name: "groups", value: JSON.stringify(groups) }],
    children: [],
  };
}

export default function remarkCite() {
  return (tree: Root) => {
    walk(tree as unknown as { children?: unknown[] });
  };
}

const SKIP = new Set(["code", "inlineCode", "link", "linkReference", "definition", "mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"]);

function walk(node: { type?: string; children?: unknown[] }) {
  if (!node.children) return;
  const next: unknown[] = [];
  for (const child of node.children as { type: string; value?: string; children?: unknown[] }[]) {
    if (child.type === "text" && child.value && MARK.test(child.value)) {
      MARK.lastIndex = 0;
      next.push(...splitText(child as Text));
      continue;
    }
    if (!SKIP.has(child.type)) walk(child);
    next.push(child);
  }
  node.children = next;
}

function splitText(node: Text): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  let last = 0;
  for (const m of node.value.matchAll(MARK)) {
    const groups = parseCite(m[1]);
    if (!groups.length) continue; // stays plain text
    const start = m.index ?? 0;
    if (start > last) out.push({ type: "text", value: node.value.slice(last, start) });
    out.push(citeNode(groups) as unknown as PhrasingContent);
    last = start + m[0].length;
  }
  if (last < node.value.length) out.push({ type: "text", value: node.value.slice(last) });
  return out.length ? out : [node];
}
