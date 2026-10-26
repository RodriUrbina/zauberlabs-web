"use client";

import { useEffect, useState } from "react";
import type { Stats } from "@/lib/metrics-store";

type Budget = { month: string; used: number; budget: number; paused: boolean };
type Standing = { car: string; name: string; votes: number }[];

/** "2026-10-21" → "21 Oct 2026" */
const sinceLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const RANGES = [7, 30, 90] as const;

const nf = new Intl.NumberFormat("de-DE");
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)} %` : "–");

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden="true">
      <span className="block h-full rounded-full bg-ink" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} />
    </span>
  );
}

function Ranked({ title, rows, empty }: { title: string; rows: { label: string; value: number }[]; empty: string }) {
  const max = rows[0]?.value ?? 0;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      <h3 className="eyebrow text-muted">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-muted">{empty}</p>}
      <ul className="flex flex-col gap-2.5">
        {rows.slice(0, 15).map((r) => (
          <li key={r.label} className="flex flex-col gap-1">
            <span className="flex justify-between gap-3 text-sm">
              <span className="truncate font-semibold">{r.label}</span>
              <span className="font-mono text-muted">{nf.format(r.value)}</span>
            </span>
            <Bar value={r.value} max={max} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * BL-051 — our own anonymous reading statistics (daily counters in Upstash Redis).
 * Read-only; uses the admin password the page already holds.
 */
export default function StatsPanel({ password }: { password: string }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [stats, setStats] = useState<(Stats & { budget?: Budget; since?: string; standing?: Standing }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/admin/stats?days=${days}`, { headers: { Authorization: `Bearer ${password}` }, cache: "no-store" })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) setError(json.error ?? `Error ${res.status}`);
        else setStats(json);
      })
      .catch(() => !cancelled && setError("Could not load the statistics"));
    return () => {
      cancelled = true;
    };
  }, [days, password]);

  const maxDaily = Math.max(0, ...(stats?.daily.map((d) => d.views) ?? []));
  const maxVotes = Math.max(0, ...(stats?.daily.map((d) => d.votes ?? 0) ?? []));
  const carName = (id: string) => stats?.standing?.find((c) => c.car === id)?.name ?? id;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight">Reading statistics</h2>
        <div className="flex gap-1.5" role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              aria-pressed={days === r}
              className={`h-8 cursor-pointer rounded-full px-3 text-sm font-semibold ${days === r ? "bg-ink text-paper" : "border border-line"}`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-body">
        Our own anonymous daily counters: no cookies, no IP, no record per visitor. Article pages only. “Readers” are unique per day and
        summed over the days (someone reading on two days counts twice); they are estimates (about ±1 %). Your own devices in internal mode
        are not counted.
      </p>
      {error && <p className="text-sm text-accent" role="alert">{error}</p>}
      {stats?.since && <p className="text-sm font-semibold text-ink">Counting since {sinceLabel(stats.since)}.</p>}
      {stats?.budget && (
        <p className={`text-sm ${stats.budget.paused ? "text-accent" : "text-muted"}`} role={stats.budget.paused ? "alert" : undefined}>
          {stats.budget.paused ? "Counting is paused until the end of the month: " : "Redis budget for statistics this month: "}
          {nf.format(stats.budget.used)} of {nf.format(stats.budget.budget)} commands ({stats.budget.month}). Votes and suggestions are not affected.
        </p>
      )}

      {stats && (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {[
              ["Views", stats.totals.views],
              ["Readers", stats.totals.uniques],
              ["Configurator clicks", stats.totals.clicks],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-white p-4">
                <dt className="eyebrow text-muted">{label}</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold">{nf.format(Number(value))}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
            <h3 className="eyebrow text-muted">Views per day</h3>
            <div className="flex h-24 items-end gap-px" role="img" aria-label="Views per day">
              {stats.daily.map((d) => (
                <span
                  key={d.day}
                  title={`${d.day}: ${d.views} views, ${d.clicks} configurator clicks`}
                  className="flex-1 rounded-t-sm bg-ink"
                  style={{ height: `${maxDaily ? Math.max(1, (d.views / maxDaily) * 100) : 0}%` }}
                />
              ))}
            </div>
            <span className="flex justify-between font-mono text-[11px] text-muted">
              <span>{stats.days[0]}</span>
              <span>{stats.days[stats.days.length - 1]}</span>
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="eyebrow text-muted">
                <tr>
                  <th className="px-4 py-3 font-normal">Article</th>
                  <th className="px-3 py-3 text-right font-normal">Views</th>
                  <th className="px-3 py-3 text-right font-normal">Readers</th>
                  <th className="px-3 py-3 text-right font-normal">Median time</th>
                  <th className="px-4 py-3 text-right font-normal">Read to end</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stats.articles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-muted">No article views in this period.</td>
                  </tr>
                )}
                {stats.articles.map((a) => (
                  <tr key={a.page}>
                    <td className="max-w-[320px] truncate px-4 py-2.5 font-semibold">
                      <a className="hover:underline" href={`/${a.page.split("/")[0]}/blog/${a.page.split("/").slice(1).join("/")}`}>{a.page}</a>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{nf.format(a.views)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{nf.format(a.uniques)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{a.medianTime ?? "–"}</td>
                    <td className="px-4 py-2.5 text-right font-mono" title={`${a.readToEnd} of ${a.readings} readings`}>{pct(a.readToEnd, a.readings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Ranked title="Came from" rows={stats.referrers.map((r) => ({ label: r.domain, value: r.views }))} empty="No views yet." />
            <Ranked title="Countries" rows={stats.countries.map((c) => ({ label: c.code === "XX" ? "unknown" : c.code, value: c.views }))} empty="No views yet." />
            <Ranked title="Configurator clicks" rows={stats.clicks.map((c) => ({ label: c.configurator.toUpperCase(), value: c.clicks }))} empty="No clicks yet." />
          </div>

          {/* BL-051.2 — vote sources; BL-078 — standing totals and net votes */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-extrabold tracking-tight">Votes</h3>
            {stats.standing && (
              <Ranked title="Votes now" rows={stats.standing.map((c) => ({ label: c.name, value: c.votes }))} empty="No cars in the vote." />
            )}
            <p className="text-sm text-body">
              “Votes now” is what the vote card shows. Below, for this period: net votes, that is new votes minus votes taken back (
              {nf.format(stats.votes?.cast ?? 0)} new, {nf.format(stats.votes?.withdrawn ?? 0)} taken back, net{" "}
              {nf.format(stats.votes?.total ?? 0)}). “Came from” and “Countries” count new votes only: the site the visitor arrived from
              (“internal” means another of our pages, “direct” means no referrer). Votes from your own devices in internal mode are not
              counted anywhere.
            </p>
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
              <h4 className="eyebrow text-muted">Net votes per day</h4>
              <div className="flex h-16 items-end gap-px" role="img" aria-label="Votes per day">
                {stats.daily.map((d) => (
                  <span
                    key={d.day}
                    title={`${d.day}: ${d.votes ?? 0} net votes`}
                    className="flex-1 rounded-t-sm bg-accent"
                    style={{ height: `${maxVotes ? Math.max(1, (Math.max(0, d.votes ?? 0) / maxVotes) * 100) : 0}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Ranked title="Net votes by car" rows={(stats.votes?.cars ?? []).map((c) => ({ label: carName(c.car), value: c.votes }))} empty="No votes yet." />
              <Ranked title="New votes came from" rows={(stats.votes?.referrers ?? []).map((r) => ({ label: r.domain, value: r.votes }))} empty="No votes yet." />
              <Ranked title="New votes by country" rows={(stats.votes?.countries ?? []).map((c) => ({ label: c.code === "XX" ? "unknown" : c.code, value: c.votes }))} empty="No votes yet." />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
