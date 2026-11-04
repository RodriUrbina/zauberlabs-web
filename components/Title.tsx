/**
 * BL-111 (PO 2026-11-04) — the zauberlabs title code, see README "Title code". Every two-part title is a bold sans lead
 * (black on light, off-white on dark: the colour is inherited) plus ONE italic serif accent half in the accent colour:
 * --color-accent on light backgrounds, --color-accent-dark on dark ones. Orange in a title means the accent half and nothing else.
 * Sizes, spacing and line breaks stay with each page (`className`), so the component only fixes the colours and the type.
 * `eyebrow`: the grey mono caps line above the title, rendered as its sibling so the page's layout does not change; the
 * "● E46BUILD · LIVE" status line is the one exception and stays outside.
 */
type Props = {
  as?: "h1" | "h2" | "h3";
  lead: string;
  accent: string;
  /** Text after the accent half (e.g. DE „Füge deins hinzu.“), in the lead's style. */
  tail?: string;
  tone?: "light" | "dark";
  className: string;
  id?: string;
  /** BL-107: the accent half wraps as a whole, never between its words. */
  keepAccentTogether?: boolean;
  /** BL-113: the accent half always starts a new line. */
  breakBeforeAccent?: boolean;
  eyebrow?: string;
  /** Size and colour of the eyebrow when the place needs its own (default: grey). */
  eyebrowClassName?: string;
};

export default function Title({ as: H = "h2", lead, accent, tail, tone = "light", className, id, keepAccentTogether = false, breakBeforeAccent = false, eyebrow, eyebrowClassName = "text-muted" }: Props) {
  return (
    <>
      {eyebrow && <p className={`eyebrow ${eyebrowClassName}`}>{eyebrow}</p>}
      <H id={id} className={className}>
        {lead}
        {breakBeforeAccent && <br />}
        <span className={`accent-serif ${tone === "dark" ? "text-accent-dark" : "text-accent"}${keepAccentTogether ? " whitespace-nowrap" : ""}`}>{accent}</span>
        {tail}
      </H>
    </>
  );
}
