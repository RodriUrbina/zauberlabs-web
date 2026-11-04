import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { dictionaries, LOCALES } from "../lib/i18n";

// BL-109 (PO 2026-11-04): "Take a closer look" plays the five parts by itself. next/image does not render here, so the
// component's source is checked; the behaviour itself is checked in the browser on the local build.
const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), "utf8");
const cl = read("components", "CloserLook.tsx");

describe("closer look auto-play (BL-109)", () => {
  test("4 s per part, in the list's order, back to the first after the last; the fill is the accent token", () => {
    assert.match(cl, /export const AUTO_SECONDS = 4;/);
    assert.match(cl, /onAnimationEnd=\{\(\) => select\(\(on \+ 1\) % cats\.length\)\}/);
    assert.match(cl, /animation: `zl-fill \$\{AUTO_SECONDS\}s linear forwards`, animationPlayState: running \? "running" : "paused"/);
    assert.match(cl, /className="absolute inset-0 origin-left rounded-full bg-accent"/);
    assert.match(read("app", "globals.css"), /@keyframes zl-fill \{\s*from \{ transform: scaleX\(0\); \}\s*to \{ transform: scaleX\(1\); \}\s*\}/);
    assert.ok(!/#[0-9a-f]{3,6}/i.test(cl.slice(cl.indexOf('role="group"'))), "no new colour values in the indicator");
  });

  test("runs only in view, with the tab visible, not under the mouse or keyboard focus; never by itself with reduced motion", () => {
    assert.match(cl, /const running = playing && inView && !tabHidden && !hovered && !focused;/);
    assert.match(cl, /new IntersectionObserver\(\(\[e\]\) => setInView\(e\.isIntersecting\)/);
    assert.match(cl, /document\.addEventListener\("visibilitychange", vis\)/);
    assert.match(cl, /if \(window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\) setPlaying\(false\);/);
    // over the dark panel only, so a mouse click on play (in the row below) starts it at once
    assert.match(cl, /onPointerEnter=\{\(e\) => e\.pointerType === "mouse" && setHovered\(true\)\}\s*onPointerLeave=\{\(\) => setHovered\(false\)\}\s*className="grid gap-4 rounded-\[22px\] bg-ink/);
    assert.match(cl, /setFocused\(e\.target !== toggle\.current && e\.target\.matches\(":focus-visible"\)\)/);
  });

  test("the visitor's pick (part, dot, arrow keys) stops it and stays; the button plays and pauses", () => {
    assert.match(cl, /const pickPart = \(i: number\) => \{\s*setPlaying\(false\);\s*select\(i\);\s*\};/);
    assert.equal(cl.match(/onClick=\{\(\) => pickPart\(i\)\}/g)?.length, 2, "part pills and dots");
    assert.match(cl, /const i = \(next \+ cats\.length\) % cats\.length;\s*pickPart\(i\);/);
    assert.ok(!/onClick=\{\(\) => select\(i\)\}/.test(cl));
    assert.match(cl, /aria-label=\{playing \? auto\.pause : auto\.play\}/);
  });

  test("accessible: dots are buttons named after their part, the panel is not announced while playing; EN + DE labels", () => {
    assert.match(cl, /<div role="group" aria-label=\{auto\.label\}/);
    assert.match(cl, /aria-label=\{auto\.show\.replace\("\{part\}", c\.label\)\}/);
    assert.match(cl, /aria-current=\{i === on \? "true" : undefined\}/);
    assert.match(cl, /aria-live=\{running \? "off" : "polite"\}/);
    assert.deepEqual(dictionaries.en.garage.auto, { label: "Slideshow of the parts", show: "Show {part}", pause: "Pause the slideshow", play: "Play the slideshow" });
    assert.deepEqual(dictionaries.de.garage.auto, { label: "Diashow der Teile", show: "{part} zeigen", pause: "Diashow anhalten", play: "Diashow abspielen" });
    for (const lang of LOCALES) assert.equal(dictionaries[lang].garage.cats.length, 5);
    assert.match(read("app", "[lang]", "page.tsx"), /<CloserLook cats=\{t\.garage\.cats\} pick=\{t\.garage\.pick\} auto=\{t\.garage\.auto\} cta=/);
  });

  test("the next picture loads ahead; the pictures, part list and CTA stay as they were", () => {
    assert.match(cl, /loading=\{i === on \|\| i === \(on \+ 1\) % cats\.length \? "eager" : "lazy"\}/);
    assert.match(cl, /href=\{hrefs\[on\]\}\s+rel="nofollow"/);
    assert.match(cl, /sizes="\(min-width: 1440px\) 880px, \(min-width: 768px\) calc\(100vw - 460px\), calc\(100vw - 72px\)"/);
  });
});
