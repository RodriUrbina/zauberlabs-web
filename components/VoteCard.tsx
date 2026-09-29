"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VOTE_CARS, type Car, type CarId } from "@/lib/cars";
import { dictionaries, type Locale } from "@/lib/i18n";

type State = { cars?: Car[]; counts: Record<string, number>; voted: string[] };
const POLL_MS = 7000;

export default function VoteCard({ lang }: { lang: Locale }) {
  const t = dictionaries[lang].vote;
  const [state, setState] = useState<State>({ counts: {}, voted: [] });
  const [busy, setBusy] = useState<CarId | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/vote", { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch {
      /* keep last known counts */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const vote = async (car: CarId) => {
    const on = !state.voted.includes(car);
    setBusy(car);
    // optimistic update
    setState((s) => ({
      ...s,
      counts: { ...s.counts, [car]: Math.max(0, (s.counts[car] ?? 0) + (on ? 1 : -1)) },
      voted: on ? [...s.voted, car] : s.voted.filter((v) => v !== car),
    }));
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car, on }),
      });
      if (res.ok) setState(await res.json());
      else load();
    } finally {
      setBusy(null);
    }
  };

  const fmt = useMemo(() => new Intl.NumberFormat(t.numberLocale), [t.numberLocale]);
  // Built-in cars until the first response arrives; afterwards also the approved suggestions.
  const cars = [...(state.cars ?? VOTE_CARS)].sort((a, b) => (state.counts[b.id] ?? 0) - (state.counts[a.id] ?? 0));
  const total = Object.values(state.counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-1 flex-col gap-5 rounded-3xl border-[1.5px] border-dashed border-[#A9A399] p-6 md:p-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-[11px] text-muted">{t.label}</span>
          <span className="eyebrow flex items-center gap-1.5 text-[11px] text-[#1F7A45]">
            <span className="size-2 animate-pulse rounded-full bg-[#2FA65A]" />
            {t.live}
          </span>
        </div>
        <h3 className="text-[26px] leading-[1.05] font-extrabold tracking-tight md:text-[30px]">
          {t.title[0]}
          <span className="accent-serif">{t.title[1]}</span>
        </h3>
        <p className="text-[15px] leading-relaxed text-body">{t.body}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {cars.map((c) => {
          const on = state.voted.includes(c.id);
          const n = state.counts[c.id] ?? 0;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => vote(c.id)}
              disabled={busy === c.id}
              aria-pressed={on}
              aria-label={t.aria(c.name, n)}
              className={`flex h-11 cursor-pointer items-center gap-2.5 rounded-full border py-0 pr-1.5 pl-4 text-[15px] font-semibold transition-colors ${
                on ? "border-accent bg-accent text-[#FFF8F3]" : "border-ink text-ink hover:bg-ink/5"
              }`}
            >
              <span>{c.name}</span>
              <span
                className={`flex h-[30px] min-w-[34px] items-center justify-center rounded-full px-2.5 font-mono text-xs tabular-nums ${
                  on ? "bg-[#FFF8F3] text-accent" : "bg-ink text-paper"
                }`}
              >
                {fmt.format(n)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto flex items-center justify-between text-[13px] text-muted">
        <span>
          <span className="font-mono text-ink tabular-nums">{fmt.format(total)}</span> {t.total}
        </span>
        <a href="#suggest" className="text-sm font-semibold text-ink hover:opacity-80">
          {t.add}
        </a>
      </div>
    </div>
  );
}
