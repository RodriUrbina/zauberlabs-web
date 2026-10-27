import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p));

describe("favicons (BL-088)", () => {
  test("icon.svg is the logo's Spark (same path as components/Icons.tsx) in the accent, lighter accent in dark mode", () => {
    const spark = /export function Spark[\s\S]*?<path d="([^"]+)"/.exec(read("components", "Icons.tsx").toString())![1];
    const css = read("app", "globals.css").toString();
    const tok = (n: string) => new RegExp(`--color-${n}:\\s*(#[0-9a-fA-F]{6})`).exec(css)![1];
    const svg = read("app", "icon.svg").toString();
    assert.ok(svg.includes(`d="${spark}"`), "same path as the header logo");
    assert.ok(svg.includes(`fill:${tok("accent")}`));
    assert.match(svg, new RegExp(`prefers-color-scheme:dark\\)\\{path\\{fill:${tok("accent-dark")}`));
  });
  test("favicon.ico holds a 16 and a 32 px PNG frame; apple-icon.png is 180 × 180 without transparency", () => {
    const ico = read("app", "favicon.ico");
    assert.equal(ico.readUInt16LE(2), 1, "ICO type");
    assert.equal(ico.readUInt16LE(4), 2, "two frames");
    assert.deepEqual([ico.readUInt8(6), ico.readUInt8(22)], [16, 32]);
    assert.equal(ico.subarray(ico.readUInt32LE(18), ico.readUInt32LE(18) + 4).toString("latin1"), "\x89PNG");
    const apple = read("app", "apple-icon.png");
    assert.equal(apple.readUInt32BE(16), 180);
    assert.equal(apple.readUInt32BE(20), 180);
    assert.equal(apple.readUInt8(25), 2, "PNG colour type 2 = RGB, no alpha");
  });
});
