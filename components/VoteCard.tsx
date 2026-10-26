"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VOTE_CARS, type Car, type CarId } from "@/lib/cars";
import { dictionaries, E46_LIVE, E46_URL, type Locale } from "@/lib/i18n";
import { Arrow } from "@/components/Icons";
import { referrerHost } from "@/lib/beacon-client";

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
        // BL-051.2: host of the page the visitor arrived from (the browser's own document.referrer, nothing stored).
        body: JSON.stringify(on ? { car, on, r: referrerHost(document.referrer) } : { car, on }),
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

  // "Most votes" only for a clear leader (more votes than the next car), so it always follows the live counts.
  const leader = cars.length && (state.counts[cars[0].id] ?? 0) > (cars[1] ? state.counts[cars[1].id] ?? 0 : 0) ? cars[0].id : null;
  const rank = (i: number) => String(i + 1).padStart(2, "0");
  const tag = "mt-1 inline-block rounded-[5px] px-[7px] py-[3px] font-mono text-[10.5px] tracking-[0.1em] uppercase";

  // BL-081: the vote as a lineup (Rivian / Peerlist style): E46BUILD first, live, then every car in the vote, sorted by votes.
  return (
    <div className="flex flex-col rounded-3xl border-[1.5px] border-line bg-[#fbf9f6] p-5 md:p-8">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-[11px] text-muted">{t.label}</span>
        <span className="eyebrow flex items-center gap-1.5 text-[11px] text-[#1F7A45]">
          <span className="size-2 animate-pulse rounded-full bg-[#2FA65A]" />
          {t.live}
        </span>
      </div>
      <ul className="mt-[18px] flex flex-col divide-y divide-line">
        <li className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3.5 py-4">
          <span className="font-mono text-[13px] text-muted">01</span>
          <span className="flex flex-col items-start">
            <span className="text-lg font-bold tracking-[-0.01em]">
              E46<span className="text-[#5d6fd6]">BUILD</span>
            </span>
            <span className={`${tag} ${E46_LIVE ? "bg-[#e3efe7] text-[#1F7A45]" : "bg-[#ece7df] text-muted"}`}>
              {E46_LIVE ? t.liveNow : t.soonLive} · {t.model}
            </span>
          </span>
          {E46_LIVE && (
            <a href={E46_URL} className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-paper hover:bg-black">
              {t.open} <Arrow className="size-3.5" />
            </a>
          )}
        </li>
        {cars.map((c, i) => {
          const on = state.voted.includes(c.id);
          const n = state.counts[c.id] ?? 0;
          return (
            <li key={c.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3.5 py-4">
              <span className="font-mono text-[13px] text-muted">{rank(i + 1)}</span>
              <span className="flex flex-col items-start">
                <span className="text-lg font-bold tracking-[-0.01em]">{c.name}</span>
                <span className={`${tag} ${c.id === leader ? "bg-[#f8e2d8] text-accent" : "bg-[#ece7df] text-muted"}`}>
                  {c.id === leader ? `${t.lead} · ` : ""}
                  {t.soon}
                </span>
              </span>
              <button
                type="button"
                onClick={() => vote(c.id)}
                disabled={busy === c.id}
                aria-pressed={on}
                aria-label={t.aria(c.name, n)}
                className={`flex h-14 w-16 cursor-pointer flex-col items-center justify-center rounded-[14px] border-[1.5px] transition-colors ${
                  on ? "border-accent bg-accent text-[#FFF8F3]" : "border-ink text-ink hover:bg-ink/5"
                }`}
              >
                <span aria-hidden="true" className="text-xs leading-none">▲</span>
                <span className="font-mono text-[15px] font-semibold tabular-nums">{fmt.format(n)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3.5 text-[13px] text-muted">
        <span className="font-mono font-semibold text-ink tabular-nums">{fmt.format(total)}</span> {t.total}
      </p>
    </div>
  );
}
