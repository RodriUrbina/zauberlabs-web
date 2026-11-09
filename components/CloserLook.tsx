"use client";

import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { Arrow } from "@/components/Icons";

type Cat = { key: string; label: string; line: string; img: string; alt: string };
type Auto = { label: string; show: string; pause: string; play: string };

/** BL-109 (PO 2026-11-04): seconds per part while the panel plays by itself. */
export const AUTO_SECONDS = 4;

/**
 * BL-083 (PO 2026-10-27, option C "Take a closer look", e46/docs/design/zauberlabs-second-section) — a dark panel with the
 * E46BUILD categories as tabs (five, six since BL-124 Infotainment); picking one swaps the stage picture (E46BUILD's own, see public/images/README.md) and its
 * line. Desktop: tabs in a column left, picture right. Phones: picture on top, tabs as one row you can swipe.
 * BL-083.1: the CTA opens E46BUILD at the chosen tab's section (`?section=`, E46BUILD T-179; nofollow like `?start=`, as
 * robots.txt disallows them); it is counted as configurator_click by the page-wide tracker (BL-050), with place "closer-look" (BL-116). All pictures are rendered stacked, so switching never waits.
 * BL-109 (PO 2026-11-04): the panel moves through the parts by itself, AUTO_SECONDS each, with a row under it: the active part a
 * bar that fills over its time, the others dots, a pause/play button at the end. It runs only while the section is in view and the
 * tab is visible, holds while the mouse is over the panel or a part/dot has keyboard focus, and never starts by itself with reduced motion.
 * A visitor's own pick (part, dot, arrow keys) stops it and stays shown; the play button restarts it. The fill is a CSS animation,
 * so a hold freezes the bar where it is; its end moves to the next part.
 */
export default function CloserLook({ cats, pick, auto, cta, hrefs, soon }: { cats: Cat[]; pick: string; auto: Auto; cta: string; hrefs: string[] | null; soon: string }) {
  const [on, setOn] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(true); // the visitor's choice (play button, own pick)
  const [round, setRound] = useState(0); // restarts the fill when play is pressed again on the same part
  const [inView, setInView] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const running = playing && inView && !tabHidden && !hovered && !focused;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    if (root.current) io.observe(root.current);
    const vis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  // On phones the tabs are one swipeable row: keep the chosen one fully in view (horizontal only, the page does not move).
  const select = (i: number) => {
    setOn(i);
    const tab = tabs.current[i];
    const row = tab?.parentElement;
    if (!tab || !row || row.scrollWidth <= row.clientWidth) return;
    const left = tab.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft + 16 || left + tab.offsetWidth > row.scrollLeft + row.clientWidth - 16) {
      row.scrollTo({ left: left - (row.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
    }
  };

  // The visitor's own pick: auto-play stops and the pick stays shown.
  const pickPart = (i: number) => {
    setPlaying(false);
    select(i);
  };

  // Tabs pattern: arrow keys move between categories, Home/End jump to the ends.
  const onKey = (e: KeyboardEvent) => {
    const next = { ArrowRight: on + 1, ArrowDown: on + 1, ArrowLeft: on - 1, ArrowUp: on - 1, Home: 0, End: cats.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const i = (next + cats.length) % cats.length;
    pickPart(i);
    tabs.current[i]?.focus({ preventScroll: true });
  };

  // Hold while a part or a dot has keyboard focus (not the play button itself, or play could never start from the keyboard).
  const onFocus = (e: FocusEvent) => setFocused(e.target !== toggle.current && e.target.matches(":focus-visible"));
  const onBlur = (e: FocusEvent) => {
    if (!root.current?.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  return (
    <div
      ref={root}
      data-click-place="closer-look"
      onFocus={onFocus}
      onBlur={onBlur}
      className="flex flex-col gap-4 md:gap-5"
    >
      {/* The mouse holds it over the panel only: over the row below, a click on play must start it at once. */}
      <div
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className="grid gap-4 rounded-[22px] bg-ink p-4 text-paper md:grid-cols-[minmax(260px,320px)_1fr] md:gap-6 md:rounded-[28px] md:p-7"
      >
        <div className="order-2 flex min-w-0 flex-col md:order-1">
          <div
            role="tablist"
            aria-label={pick}
            onKeyDown={onKey}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-col md:gap-2.5 md:overflow-visible md:px-0 md:py-3 [&::-webkit-scrollbar]:hidden"
          >
            {cats.map((c, i) => (
              <button
                key={c.key}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`closer-tab-${c.key}`}
                aria-selected={i === on}
                aria-controls="closer-panel"
                tabIndex={i === on ? 0 : -1}
                onClick={() => pickPart(i)}
                className={`flex h-[42px] shrink-0 cursor-pointer items-center gap-2.5 rounded-full px-3.5 text-left text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper md:h-[52px] md:px-[18px] md:text-base ${
                  i === on ? "bg-paper text-ink" : "bg-[#1f1f24] text-paper hover:bg-[#2a2a30]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] text-[13px] leading-none ${i === on ? "border-ink" : "border-[#6a6a72]"}`}
                >
                  {i === on ? <span className="size-2.5 rounded-full bg-ink" /> : "+"}
                </span>
                {c.label}
              </button>
            ))}
          </div>
          {/* BL-109: not announced while it changes by itself */}
          <p id="closer-panel" role="tabpanel" aria-labelledby={`closer-tab-${cats[on].key}`} aria-live={running ? "off" : "polite"} className="pt-3 text-[15px] leading-normal text-fog md:mt-auto md:pt-[18px]">
            {cats[on].line}
          </p>
          {hrefs ? (
            <a
              href={hrefs[on]}
              rel="nofollow" // each load can create state on E46BUILD; robots.txt disallows section links
              className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-paper px-6 text-[15px] font-semibold text-ink hover:bg-white md:mt-[18px] md:h-[52px]"
            >
              {cta} <Arrow className="size-[18px]" />
            </a>
          ) : (
            <span className="mt-4 flex h-12 items-center justify-center rounded-full border border-[#3A3A40] px-6 text-[15px] font-semibold text-fog md:mt-[18px] md:h-[52px]">
              {soon}
            </span>
          )}
        </div>
        <div className="relative order-1 aspect-[3/2] overflow-hidden rounded-[14px] bg-black md:order-2 md:rounded-[20px]">
          {cats.map((c, i) => (
            <Image
              key={c.key}
              src={c.img}
              alt={i === on ? c.alt : ""}
              aria-hidden={i !== on}
              fill
              // BL-083.3: the stage's real width (phones: the page gutter 2×20 + panel padding 2×16; md+: minus the tab column,
              // gap and padding; 880 px from 1440 up), so a 390 @2x phone gets the 640 w file, not the full one.
              sizes="(min-width: 1440px) 880px, (min-width: 768px) calc(100vw - 460px), calc(100vw - 72px)"
              // BL-109: the current and the next picture load right away, so an automatic switch never shows an empty frame.
              loading={i === on || i === (on + 1) % cats.length ? "eager" : "lazy"}
              className={`object-cover transition-opacity duration-300 motion-reduce:transition-none ${i === on ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
      </div>

      {/* BL-109: the indicator under the panel; the active part's bar fills over AUTO_SECONDS, then the next part comes. */}
      <div role="group" aria-label={auto.label} className="flex items-center justify-center gap-1">
        {cats.map((c, i) => (
          <button
            key={c.key}
            type="button"
            aria-label={auto.show.replace("{part}", c.label)}
            aria-current={i === on ? "true" : undefined}
            onClick={() => pickPart(i)}
            className="group grid h-8 cursor-pointer place-items-center px-1.5 focus-visible:outline-2 focus-visible:outline-ink"
          >
            {i === on ? (
              <span aria-hidden="true" className="relative block h-2 w-10 overflow-hidden rounded-full bg-accent/25">
                <span
                  key={round}
                  onAnimationEnd={() => select((on + 1) % cats.length)}
                  className="absolute inset-0 origin-left rounded-full bg-accent"
                  style={playing ? { animation: `zl-fill ${AUTO_SECONDS}s linear forwards`, animationPlayState: running ? "running" : "paused" } : undefined}
                />
              </span>
            ) : (
              <span aria-hidden="true" className="block size-2 rounded-full bg-line transition-colors group-hover:bg-muted" />
            )}
          </button>
        ))}
        <button
          ref={toggle}
          type="button"
          aria-label={playing ? auto.pause : auto.play}
          onClick={() => {
            setRound((r) => r + 1);
            setPlaying((p) => !p);
          }}
          className="ml-1.5 grid size-8 cursor-pointer place-items-center rounded-full border border-line text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {playing ? (
            <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3 fill-current">
              <rect x="2" y="1.5" width="2.6" height="9" rx="0.8" />
              <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3 fill-current">
              <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l7-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
