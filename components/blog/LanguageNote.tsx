import { dictionaries, type Locale } from "@/lib/i18n";

/** Shown at the top of an article that is displayed in a language it does not exist in. */
export default function LanguageNote({ lang }: { lang: Locale }) {
  const t = dictionaries[lang].blog;
  return (
    <p role="note" className="rounded-2xl border border-accent/40 bg-accent/[0.07] px-5 py-3.5 text-[14px] leading-relaxed text-body">
      <span className="eyebrow mr-3 text-[10px] text-accent">{lang.toUpperCase()}</span>
      {t.fallbackNote}
    </p>
  );
}
