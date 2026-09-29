"use client";

import { useCallback, useEffect, useState } from "react";
import { Wordmark } from "@/components/Icons";

type Suggestion = { raw: string; car: string; email: string | null; lang: string; at: string };
type Car = { id: string; name: string; votes: number };
type State = { suggestions: Suggestion[]; cars: Car[] };

const KEY = "zl_admin_pw";
const BUILT_IN = new Set(["golf", "a4", "w203", "is200"]);

export default function Admin() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<State | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const call = useCallback(async (password: string, body?: object) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin", {
        method: body ? "POST" : "GET",
        headers: { Authorization: `Bearer ${password}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false);
          try { sessionStorage.removeItem(KEY); } catch {}
        }
        setError(json.error ?? `Error ${res.status}`);
        return;
      }
      setAuthed(true);
      try { sessionStorage.setItem(KEY, password); } catch {}
      setData(json);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let saved = "";
    try { saved = sessionStorage.getItem(KEY) ?? ""; } catch {}
    if (saved) {
      setPw(saved);
      call(saved);
    }
  }, [call]);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
  };

  const btn = "h-9 cursor-pointer rounded-full px-4 text-sm font-semibold disabled:opacity-50";

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-5 py-10">
      <header className="flex items-center justify-between">
        <Wordmark />
        <span className="eyebrow text-muted">Admin · Suggestions</span>
      </header>

      {!authed ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            call(pw);
          }}
          className="flex max-w-sm flex-col gap-3"
        >
          <label className="eyebrow flex flex-col gap-2 text-muted">
            Password
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              className="h-12 rounded-xl border border-line bg-white px-4 font-sans text-base tracking-normal text-ink normal-case"
            />
          </label>
          <button type="submit" disabled={busy || !pw} className={`${btn} h-12 bg-ink text-paper`}>
            Sign in
          </button>
          {error && <p className="text-sm text-accent" role="alert">{error}</p>}
        </form>
      ) : (
        data && (
          <>
            {error && <p className="text-sm text-accent" role="alert">{error}</p>}

            <section className="flex flex-col gap-4">
              <h1 className="text-2xl font-extrabold tracking-tight">
                New suggestions <span className="font-mono text-base text-muted">({data.suggestions.length})</span>
              </h1>
              <p className="text-sm text-body">
                Nothing here is public. Approve adds the car as a vote tag on the site (edit the name first to clean it up — e.g.
                “bmw e39” → “BMW 5er E39”). Suggesting a car that already exists just merges it.
              </p>
              {data.suggestions.length === 0 && <p className="text-muted">No pending suggestions.</p>}
              <ul className="flex flex-col gap-3">
                {data.suggestions.map((s) => {
                  const name = names[s.raw] ?? s.car;
                  return (
                    <li key={s.raw} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 md:flex-row md:items-center">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-xs text-muted">
                          {fmt(s.at)} · {s.lang.toUpperCase()}
                          {s.email && <> · <a className="underline" href={`mailto:${s.email}`}>{s.email}</a></>}
                        </span>
                        <span className="text-sm text-body">“{s.car}”</span>
                        <input
                          aria-label="Name shown on the site"
                          value={name}
                          maxLength={60}
                          onChange={(e) => setNames((n) => ({ ...n, [s.raw]: e.target.value }))}
                          className="h-10 rounded-lg border border-line px-3 text-[15px] font-semibold"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy || name.trim().length < 2}
                          onClick={() => call(pw, { action: "approve", name, raw: s.raw })}
                          className={`${btn} bg-ink text-paper`}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => call(pw, { action: "dismiss", raw: s.raw })}
                          className={`${btn} border border-ink`}
                        >
                          Dismiss
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight">Cars in the vote</h2>
              <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
                {data.cars.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="font-semibold">{c.name}</span>
                    <span className="flex items-center gap-4">
                      <span className="font-mono text-sm text-muted">{c.votes} votes</span>
                      {BUILT_IN.has(c.id) ? (
                        <span className="text-xs text-muted">built-in</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`Remove “${c.name}” from the vote? Its votes are kept.`)) call(pw, { action: "remove", id: c.id });
                          }}
                          className={`${btn} border border-line`}
                        >
                          Remove
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <button
              type="button"
              onClick={() => {
                try { sessionStorage.removeItem(KEY); } catch {}
                setAuthed(false);
                setData(null);
                setPw("");
              }}
              className="self-start text-sm text-muted underline"
            >
              Sign out
            </button>
          </>
        )
      )}
    </div>
  );
}
