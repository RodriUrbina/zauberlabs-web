import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// BL-056: configurator links inside the blog open in a new tab and keep the referrer. E46_LIVE is read at import time.
process.env.NEXT_PUBLIC_E46_LIVE = "1";
const { default: ConfiguratorCta, ConfiguratorLink } = await import("../components/blog/ConfiguratorCta");
const { mdxComponents } = await import("../components/blog/mdx-components");

const newTab = (html: string) => html.includes('target="_blank"') && html.includes('rel="noopener"') && !html.includes("noreferrer");

describe("blog configurator links open in a new tab (BL-056)", () => {
  test("the article 'try it' box", () => {
    const html = renderToStaticMarkup(createElement(ConfiguratorCta, { lang: "en", tag: "e46" }));
    assert.ok(newTab(html), html);
    assert.ok(html.includes("(opens in a new tab)"));
  });
  test("an in-text <ConfiguratorLink>", () => {
    const html = renderToStaticMarkup(createElement(ConfiguratorLink, { lang: "de", children: "E46BUILD" }));
    assert.ok(newTab(html), html);
    assert.ok(html.includes("(öffnet in neuem Tab)"));
  });
  test("a plain Markdown link to the configurator keeps the referrer; other external links don't", () => {
    const A = mdxComponents("en").a as (p: { href: string; children: string }) => React.ReactElement;
    const e46 = renderToStaticMarkup(A({ href: "https://e46.zauberlabs.de/build", children: "E46BUILD" }));
    assert.ok(newTab(e46), e46);
    const other = renderToStaticMarkup(A({ href: "https://example.com/", children: "x" }));
    assert.ok(other.includes("noreferrer"));
  });
});
