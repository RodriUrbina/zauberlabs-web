import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { configuratorFor, configuratorHosts } from "../lib/configurator-click";

describe("configurator click event (BL-050)", () => {
  const hosts = configuratorHosts("https://e46.zauberlabs.de");
  test("maps links to the E46 configurator to 'e46', whatever the path or query", () => {
    assert.equal(configuratorFor("https://e46.zauberlabs.de", hosts), "e46");
    assert.equal(configuratorFor("https://e46.zauberlabs.de/build?car=abc", hosts), "e46");
  });
  test("ignores every other link", () => {
    assert.equal(configuratorFor("https://www.zauberlabs.de/de/blog", hosts), null);
    assert.equal(configuratorFor("https://e46.zauberlabs.de.example.com/", hosts), null);
    assert.equal(configuratorFor("mailto:hello@zauberlabs.de", hosts), null);
    assert.equal(configuratorFor("not a url", hosts), null);
  });
  test("a broken configurator URL disables the event instead of failing", () => {
    assert.deepEqual(configuratorHosts("not a url"), {});
  });
});
