"use client";

import { useState } from "react";

/**
 * BL-084/BL-085 — the withdrawal function (§ 356a BGB, plan § 3 #4): name, e-mail, order reference and date, then one
 * clearly labelled confirm button („Widerruf bestätigen"). app/api/withdrawal sends the confirmation of receipt by e-mail at
 * once; the page shows the time of receipt. If the e-mail cannot be sent, the form says so and gives our address, so a
 * withdrawal is never lost silently.
 */
export default function WithdrawalForm({ contact, lang }: { contact: string; lang: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [receivedAt, setReceivedAt] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/withdrawal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      setReceivedAt(typeof json.receivedAtText === "string" ? json.receivedAtText : "");
      setState("done");
    } catch {
      setState("error");
    }
  };
  const field = "h-11 rounded-xl border border-line bg-white px-3 text-base font-normal text-ink";
  if (state === "done") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-white p-5 text-ink">
        <p className="text-lg font-bold">Dein Widerruf ist eingegangen.</p>
        <p className="mt-2">
          {receivedAt && <>Eingegangen am {receivedAt}. </>}Die Eingangsbestätigung mit dem Inhalt deiner Erklärung haben wir dir gerade per E-Mail
          geschickt.
        </p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">Name<input name="name" required maxLength={200} autoComplete="name" className={field} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">E-Mail-Adresse (für die Eingangsbestätigung)<input name="email" type="email" required maxLength={200} autoComplete="email" className={field} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">Bestellnummer oder Belegnummer (aus dem Stripe-Beleg)<input name="order" required maxLength={200} className={field} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">Bestellt am<input name="orderedAt" type="date" className={field} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">Welche Artikel? (leer = die ganze Bestellung)<input name="items" maxLength={1000} className={field} /></label>
      {/* Spam trap: hidden from people, filled in by bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button type="submit" disabled={state === "sending"} className="h-12 cursor-pointer rounded-full bg-ink px-6 text-[15px] font-semibold text-paper hover:bg-black disabled:opacity-70">
        Widerruf bestätigen
      </button>
      {state === "error" && (
        <p role="alert" className="text-sm text-accent">
          {/* Never suggest the withdrawal arrived when it did not (Editor 2026-10-27). */}
          Dein Widerruf konnte gerade nicht übermittelt werden. Bitte schick ihn per E-Mail an{" "}
          <a href={`mailto:${contact}`} className="underline">{contact}</a> – das ist genauso gültig.
          {lang === "en" && (
            <span className="mt-1 block" lang="en">
              Your withdrawal could not be sent just now. Please send it by e-mail to {contact}; that is just as valid.
            </span>
          )}
        </p>
      )}
    </form>
  );
}
