/**
 * BL-090 — the shop's legal texts as data, so the pages (components/shop/LegalBlocks.tsx) and the order confirmation e-mail
 * (lib/order-mail.ts) render the SAME text and cannot drift apart. A text is a list of blocks; a paragraph is a list of
 * segments, each plain text or a link (site-relative href).
 */
export type Seg = string | { text: string; href: string };
export type Block =
  | { p: Seg[]; lead?: boolean } // paragraph; `lead` = the semibold first line of the AGB
  | { h2: string }
  | { bullets: Seg[][] } // bulleted list
  | { lines: Seg[][] } // the model form's dash lines (no bullets)
  | { hr: true };
export type Clause = { title: string; blocks: Block[] };

export const SITE = "https://www.zauberlabs.de";

/** Plain text of a paragraph; links become "text (https://…)" in e-mails, so the address survives in any mail client. */
export const segText = (segs: Seg[], withUrls = false) =>
  segs.map((s) => (typeof s === "string" ? s : withUrls ? `${s.text} (${s.href.startsWith("http") ? s.href : SITE + s.href})` : s.text)).join("");

/** Blocks as plain text for an e-mail: one paragraph per block, blank line between blocks. */
export function blocksText(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    if ("p" in b) out.push(segText(b.p, true));
    else if ("h2" in b) out.push(b.h2.toUpperCase());
    else if ("bullets" in b) out.push(b.bullets.map((l) => `• ${segText(l, true)}`).join("\n"));
    else if ("lines" in b) out.push(b.lines.map((l) => segText(l, true)).join("\n"));
    else out.push("—");
  }
  return out.join("\n\n");
}

export const clausesText = (clauses: Clause[]) => clauses.map((c) => `${c.title}\n\n${blocksText(c.blocks)}`).join("\n\n");
