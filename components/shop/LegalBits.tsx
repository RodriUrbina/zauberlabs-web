import Link from "next/link";

/**
 * BL-085 — pieces of the shop's legal texts (drafted by the Writer from the official statutory models; not lawyer-reviewed).
 * `Po` marks a decision the PO still has to make ("[X] Werktage"); it stays visible until the text is final, so nothing with
 * it can go live unnoticed (the pages render only for internal devices until SHOP_LAUNCHED).
 */
export function Po({ children }: { children: React.ReactNode }) {
  return <span className="rounded border border-dashed border-accent bg-paper px-1 text-accent">[{children}]</span>;
}

/** On /en: the English text is a convenience translation; the German version is binding. */
export function BindingNote({ deHref }: { deHref: string }) {
  return (
    <p className="italic">
      This English version is a convenience translation. Only the <Link href={deHref} className="underline">German version</Link> is binding.
    </p>
  );
}

/** A numbered clause: "§ 2 Vertragsschluss" with its paragraphs. */
export function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
