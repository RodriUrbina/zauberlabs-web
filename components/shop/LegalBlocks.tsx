import Link from "next/link";
import type { Block, Seg } from "@/lib/legal/blocks";

/** BL-090 — renders the shop's legal texts (lib/legal/*) on the pages; the order e-mail renders the same data as text. */
function Segs({ segs }: { segs: Seg[] }) {
  return (
    <>
      {segs.map((s, i) =>
        typeof s === "string" ? (
          s
        ) : s.href.startsWith("http") ? (
          <a key={i} href={s.href} className="underline">{s.text}</a>
        ) : (
          <Link key={i} href={s.href} className="underline">{s.text}</Link>
        ),
      )}
    </>
  );
}

export default function LegalBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if ("p" in b) return <p key={i} className={b.lead ? "font-semibold text-ink" : undefined}><Segs segs={b.p} /></p>;
        if ("h2" in b) return <h2 key={i}>{b.h2}</h2>;
        if ("bullets" in b) return <ul key={i} className="list-disc pl-5">{b.bullets.map((l, j) => <li key={j}><Segs segs={l} /></li>)}</ul>;
        if ("lines" in b) return <ul key={i} className="flex flex-col gap-2">{b.lines.map((l, j) => <li key={j}><Segs segs={l} /></li>)}</ul>;
        return <hr key={i} className="border-line" />;
      })}
    </>
  );
}
