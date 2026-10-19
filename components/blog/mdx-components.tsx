import type { MDXComponents } from "mdx/types";
import type { Confidence as Level } from "@/lib/blog-schema";
import { dictionaries, E46_URL, type Locale } from "@/lib/i18n";
import { configuratorFor, configuratorHosts } from "@/lib/configurator-click";
import Callout from "./Callout";
import Figure from "./Figure";
import Cite from "./Cite";
import { Confidence } from "./Confidence";
import { ConfiguratorLink, NEW_TAB } from "./ConfiguratorCta";

/**
 * The whitelist of building blocks available inside article bodies (see content/blog/README.md).
 * `Cite` is not written by hand: remark-cite creates it from [S1, HIGH] marks in plain Markdown.
 */
export function mdxComponents(lang: Locale, configuratorUrl?: string, sourcesHref?: string): MDXComponents {
  return {
    Confidence: ({ level, children }: { level: Level; children: React.ReactNode }) => (
      <Confidence level={level} lang={lang}>
        {children}
      </Confidence>
    ),
    Callout,
    Figure,
    Cite: ({ groups }: { groups: string }) => <Cite groups={groups} lang={lang} href={sourcesHref} />,
    ConfiguratorLink: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <ConfiguratorLink href={href ?? configuratorUrl} lang={lang}>{children}</ConfiguratorLink>
    ),
    // External links open in a new tab; internal ones stay.
    a: ({ href = "", children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      // BL-056: a plain link to a configurator opens in a new tab but keeps the referrer, like <ConfiguratorLink>.
      if (configuratorFor(href, configuratorHosts(E46_URL))) {
        return (
          <a href={href} {...rest} {...NEW_TAB}>
            {children}
            <span className="sr-only"> {dictionaries[lang].blog.opensNewTab}</span>
          </a>
        );
      }
      const external = /^https?:\/\//.test(href) && !href.startsWith("https://www.zauberlabs.de");
      return (
        <a href={href} {...rest} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    },
  };
}
