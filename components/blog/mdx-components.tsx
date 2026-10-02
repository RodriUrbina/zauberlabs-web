import type { MDXComponents } from "mdx/types";
import type { Confidence as Level } from "@/lib/blog-schema";
import type { Locale } from "@/lib/i18n";
import Callout from "./Callout";
import Figure from "./Figure";
import Cite from "./Cite";
import { Confidence } from "./Confidence";
import { ConfiguratorLink } from "./ConfiguratorCta";

/**
 * The whitelist of building blocks available inside article bodies (see content/blog/README.md).
 * `Cite` is not written by hand: remark-cite creates it from [S1, HIGH] marks in plain Markdown.
 */
export function mdxComponents(lang: Locale, configuratorUrl?: string): MDXComponents {
  return {
    Confidence: ({ level, children }: { level: Level; children: React.ReactNode }) => (
      <Confidence level={level} lang={lang}>
        {children}
      </Confidence>
    ),
    Callout,
    Figure,
    Cite,
    ConfiguratorLink: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <ConfiguratorLink href={href ?? configuratorUrl} lang={lang}>{children}</ConfiguratorLink>
    ),
    // External links open in a new tab; internal ones stay.
    a: ({ href = "", children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const external = /^https?:\/\//.test(href) && !href.startsWith("https://www.zauberlabs.de");
      return (
        <a href={href} {...rest} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    },
  };
}
