"use client";

import { useState } from "react";
import type { Dict, Locale } from "@/lib/i18n";

export default function SuggestForm({ t, lang }: { t: Dict["suggest"]; lang: Locale }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car: form.get("car"), email: form.get("email"), lang }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  const input =
    "h-14 rounded-2xl border border-[#3A3A40] bg-ink-2 px-5 font-sans text-base tracking-normal text-paper normal-case placeholder:text-[#8A877F] focus:border-accent-dark focus:outline-none";

  if (status === "done") {
    return <p className="rounded-2xl bg-ink-2 p-6 text-lg text-paper" role="status">{t.thanks}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="eyebrow flex flex-col gap-2 text-[11px] text-[#A9A6A0]">
        {t.carLabel}
        <input name="car" required minLength={2} maxLength={120} placeholder={t.carPlaceholder} className={input} />
      </label>
      <label className="eyebrow flex flex-col gap-2 text-[11px] text-[#A9A6A0]">
        {t.emailLabel}
        <input name="email" type="email" maxLength={200} placeholder={t.emailPlaceholder} className={input} />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="h-14 cursor-pointer rounded-full bg-paper text-base font-semibold text-ink hover:bg-white disabled:opacity-60"
      >
        {status === "sending" ? t.sending : t.submit}
      </button>
      {status === "error" && <p className="text-sm text-accent-dark" role="alert">{t.error}</p>}
    </form>
  );
}
