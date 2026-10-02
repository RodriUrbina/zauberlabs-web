import type { Confidence as Level } from "@/lib/blog-schema";
import { dictionaries, type Locale } from "@/lib/i18n";

const badge: Record<Level, string> = {
  HIGH: "border-[#1F7A45]/40 bg-[#1F7A45]/10 text-[#1F7A45]",
  MEDIUM: "border-accent/40 bg-accent/10 text-accent",
  LOW: "border-accent/60 bg-accent/15 text-accent",
  NA: "border-line bg-paper text-muted",
};

/** Small HIGH / MEDIUM / LOW / n/a pill. */
export function ConfidenceBadge({ level, lang, className = "" }: { level: Level; lang: Locale; className?: string }) {
  const t = dictionaries[lang].blog;
  const label = t.confidence[level];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-[1px] align-middle font-mono text-[10px] font-medium tracking-[0.12em] uppercase ${badge[level]} ${className}`}
      aria-label={t.confidenceAria(label)}
      title={t.confidenceAria(label)}
    >
      {label}
    </span>
  );
}

/** Inline building block for the article body: wraps one claim and shows its confidence. */
export function Confidence({ level, lang, children }: { level: Level; lang: Locale; children: React.ReactNode }) {
  const emphasised = level === "MEDIUM" || level === "LOW";
  return (
    <span className={emphasised ? "rounded-sm bg-accent/[0.07] box-decoration-clone px-0.5" : undefined}>
      {children} <ConfidenceBadge level={level} lang={lang} className="ml-0.5" />
    </span>
  );
}
