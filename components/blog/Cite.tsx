import type { CiteGroup } from "@/lib/remark-cite";

const tone: Record<NonNullable<CiteGroup["level"]> | "none", string> = {
  HIGH: "border-[#1F7A45]/40 bg-[#1F7A45]/10 text-[#1F7A45]",
  MEDIUM: "border-accent/40 bg-accent/10 text-accent",
  LOW: "border-accent/60 bg-accent/15 text-accent",
  none: "border-line bg-paper text-muted",
};

/** Inline evidence mark ([S1, HIGH] in the article) linking to the entry in the Sources box. */
export default function Cite({ groups }: { groups: string | CiteGroup[] }) {
  const list: CiteGroup[] = typeof groups === "string" ? safeParse(groups) : groups;
  if (!list.length) return null;
  return (
    <span className="cite whitespace-nowrap">
      {list.map((g, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted">; </span>}
          <a
            href={`#src-${g.ids[0].toLowerCase()}`}
            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] align-baseline font-mono text-[10px] font-medium tracking-[0.08em] no-underline ${tone[g.level ?? "none"]}`}
            title={g.qualifier ? `${g.ids.join(", ")}${g.level ? ` · ${g.level}` : ""} — ${g.qualifier}` : undefined}
          >
            {g.ids.join(", ")}
            {g.level && <span aria-hidden="true">·</span>}
            {g.level && <span>{g.level}</span>}
          </a>
          {g.qualifier && <span className="ml-1 text-[0.8em] text-muted">({g.qualifier})</span>}
        </span>
      ))}
    </span>
  );
}

function safeParse(s: string): CiteGroup[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
