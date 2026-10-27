"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Arrow } from "@/components/Icons";

type Cat = { key: string; label: string; line: string; img: string; alt: string };

/**
 * BL-083 (PO 2026-10-27, option C "Take a closer look", e46/docs/design/zauberlabs-second-section) — a dark panel with the
 * five E46BUILD categories as tabs; picking one swaps the stage picture (E46BUILD's own, see public/images/README.md) and its
 * line. Desktop: tabs in a column left, picture right. Phones: picture on top, tabs as one row you can swipe.
 * BL-083.1: the CTA opens E46BUILD at the chosen tab's section (`?section=`, E46BUILD T-179; nofollow like `?start=`, as
 * robots.txt disallows them); it is counted as configurator_click by the page-wide tracker (BL-050), with no extra data. All five pictures are rendered stacked, so switching never waits.
 */
export default function CloserLook({ cats, pick, cta, hrefs, soon }: { cats: Cat[]; pick: string; cta: string; hrefs: string[] | null; soon: string }) {
  const [on, setOn] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

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

  // Tabs pattern: arrow keys move between categories, Home/End jump to the ends.
  const onKey = (e: KeyboardEvent) => {
    const next = { ArrowRight: on + 1, ArrowDown: on + 1, ArrowLeft: on - 1, ArrowUp: on - 1, Home: 0, End: cats.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const i = (next + cats.length) % cats.length;
    select(i);
    tabs.current[i]?.focus({ preventScroll: true });
  };

  return (
    <div className="grid gap-4 rounded-[22px] bg-ink p-4 text-paper md:grid-cols-[minmax(260px,320px)_1fr] md:gap-6 md:rounded-[28px] md:p-7">
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
              onClick={() => select(i)}
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
        <p id="closer-panel" role="tabpanel" aria-labelledby={`closer-tab-${cats[on].key}`} aria-live="polite" className="pt-3 text-[15px] leading-normal text-fog md:mt-auto md:pt-[18px]">
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
            className={`object-cover transition-opacity duration-300 motion-reduce:transition-none ${i === on ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
    </div>
  );
}
