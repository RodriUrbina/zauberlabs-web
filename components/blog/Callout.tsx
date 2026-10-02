type Kind = "note" | "tip" | "warning";

const styles: Record<Kind, { box: string; label: string }> = {
  note: { box: "border-line bg-paper", label: "text-muted" },
  tip: { box: "border-[#1F7A45]/30 bg-[#1F7A45]/[0.06]", label: "text-[#1F7A45]" },
  warning: { box: "border-accent/40 bg-accent/[0.07]", label: "text-accent" },
};

const defaultLabel: Record<Kind, string> = { note: "Note", tip: "Tip", warning: "Warning" };

/** Aside box for the article body. */
export default function Callout({ type = "note", title, children }: { type?: Kind; title?: string; children: React.ReactNode }) {
  const kind: Kind = type in styles ? type : "note";
  const s = styles[kind];
  return (
    <aside className={`not-prose my-7 rounded-2xl border p-5 md:p-6 ${s.box}`}>
      <p className={`eyebrow mb-2 text-[11px] ${s.label}`}>{title ?? defaultLabel[kind]}</p>
      <div className="text-[15px] leading-relaxed text-body [&_a]:underline [&_p+p]:mt-3">{children}</div>
    </aside>
  );
}
