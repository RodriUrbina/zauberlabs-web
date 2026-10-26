"use client";

import { useEffect, useState } from "react";
import { Arrow } from "@/components/Icons";

/**
 * BL-079 (PO 2026-10-26) — phones only: a slim bar pinned to the bottom with the hero's main action, so every screen of the
 * home page has a way into E46BUILD. It shows once the hero button ([data-hero-cta]) has scrolled up out of view and hides
 * again when the hero button is back, while the vote card or the suggest section ([data-sticky-cta-hide]) or the footer
 * reaches the bottom strip of the screen (so it never covers them), and while a text field has focus (phone keyboard). Respects the safe area.
 * Server-rendered hidden, so it never flashes on load. Counted as configurator_click by the page-wide tracker (BL-050).
 */
export default function StickyStartBar({ href, label }: { href: string; label: string }) {
  const [heroGone, setHeroGone] = useState(false);
  const [blocked, setBlocked] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-hero-cta]");
    const covered = [...document.querySelectorAll("[data-sticky-cta-hide], footer")];
    const seen = new Set<Element>();
    // The hero button is "gone" only once it is above the screen, not while it is still below (short screens).
    const heroObs = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting && e.boundingClientRect.bottom <= 0));
    const coverObs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target);
        else seen.delete(e.target);
      }
      setBlocked(seen.size);
    }, { rootMargin: "-85% 0px 0px 0px" }); // only the bottom strip of the screen, where the bar sits
    if (hero) heroObs.observe(hero);
    covered.forEach((el) => coverObs.observe(el));
    const isField = (el: Element | null) => el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    const onFocus = () => setTyping(isField(document.activeElement));
    const onBlur = () => setTimeout(onFocus, 0); // activeElement is updated after focusout
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      heroObs.disconnect();
      coverObs.disconnect();
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  const show = heroGone && blocked === 0 && !typing;
  return (
    <div
      inert={!show}
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[translate,opacity] duration-200 motion-reduce:transition-none sm:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <a
        href={href}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-paper shadow-[0_6px_24px_rgba(14,14,16,0.28)] ring-1 ring-white/20 active:bg-black"
      >
        {label} <Arrow className="size-[18px]" />
      </a>
    </div>
  );
}
