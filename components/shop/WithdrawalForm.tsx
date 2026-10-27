"use client";

import { useState } from "react";

/**
 * BL-084 — the withdrawal function (§ 356a BGB, plan § 3 #4): name, e-mail, order reference and date, then one clearly
 * labelled confirm button. app/api/withdrawal answers; the immediate confirmation of receipt by e-mail is a TODO before launch.
 */
export default function WithdrawalForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "todo" | "error">("idle");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/withdrawal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setState(res.ok ? "done" : res.status === 501 ? "todo" : "error");
    } catch {
      setState("error");
    }
  };
  const field = "h-11 rounded-xl border border-line bg-white px-3 text-base font-normal text-ink";
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">Name<input name="name" required autoComplete="name" className={field} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">E-Mail-Adresse (für die Eingangsbestätigung)<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">Bestellnummer oder Belegnummer (aus der Stripe-Quittung)<input name="order" required className={field} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">Bestellt am<input name="orderedAt" type="date" className={field} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">Welche Artikel? (leer = die ganze Bestellung)<input name="items" className={field} /></label>
      <button type="submit" disabled={state === "sending"} className="h-12 cursor-pointer rounded-full bg-ink px-6 text-[15px] font-semibold text-paper hover:bg-black disabled:opacity-70">
        Widerruf bestätigen
      </button>
      {state === "done" && <p role="status" className="text-sm font-semibold text-ink">Dein Widerruf ist eingegangen. Du erhältst sofort eine Eingangsbestätigung per E-Mail.</p>}
      {state === "todo" && (
        <p role="status" className="rounded-xl border-2 border-dashed border-accent p-3 text-sm text-ink">
          TODO vor dem Start: Eingang speichern und Eingangsbestätigung per E-Mail senden (E-Mail-Dienst noch nicht angebunden). Nichts wurde gespeichert.
        </p>
      )}
      {state === "error" && <p role="alert" className="text-sm text-accent">Das hat nicht geklappt. Bitte schreib uns an hello@zauberlabs.de.</p>}
    </form>
  );
}
