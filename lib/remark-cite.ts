import type { Root, Text, PhrasingContent } from "mdast";

/**
 * Turns the Writer's inline evidence marks into <Cite> elements.
 *
 *   [S1]                      → one chip "S1"
 *   [S1, HIGH]                → chip "S1 · HIGH"
 *   [S1, HIGH that it says so]→ chip "S1 · HIGH" + the qualifier as small text
 *   [S2, S4]                  → chip "S2, S4"
 *   [S2, HIGH for x; S4, LOW for y] → two chips separated by "; "
 *
 * Only text that starts with S<digits> inside square brackets is touched, so Markdown
 * links and footnotes are unaffected. Pure mdast transform; no JSX in the article file.
 */

export type CiteGroup = { ids: string[]; level?: "HIGH" | "MEDIUM" | "LOW"; qualifier?: string };

const MARK = /\[(S\d+(?:[^\]\n]*)?)\]/g;
const LEVEL = /\b(HIGH|MEDIUM|LOW)\b/;

export function parseCite(inner: string): CiteGroup[] {
  return inner.split(";").map((part) => {
    const ids = [...part.matchAll(/\bS\d+\b/g)].map((m) => m[0]);
    const levelMatch = part.match(LEVEL);
    const level = levelMatch ? (levelMatch[1] as CiteGroup["level"]) : undefined;
    let qualifier = part
      .replace(/\bS\d+\b/g, "")
      .replace(LEVEL, "")
      .replace(/^[\s,]+|[\s,]+$/g, "")
      .replace(/\s+,/g, ",")
      .trim();
    if (!qualifier) qualifier = undefined as unknown as string;
    return { ids, level, qualifier: qualifier || undefined };
  }).filter((g) => g.ids.length > 0);
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
    if (!groups.length) continue;
    const start = m.index ?? 0;
    if (start > last) out.push({ type: "text", value: node.value.slice(last, start) });
    out.push(citeNode(groups) as unknown as PhrasingContent);
    last = start + m[0].length;
  }
  if (last < node.value.length) out.push({ type: "text", value: node.value.slice(last) });
  return out.length ? out : [node];
}
