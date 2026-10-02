import { z } from "zod";
import { LOCALES } from "./i18n";
import { dayInZone, parsePublishAt } from "./publish-time";

/**
 * Front matter of every blog article (content/blog/<slug>/<lang>.mdx).
 * Validated at build time; a bad, missing or unknown field fails the build with
 * the file name and the field. The human-readable version is content/blog/README.md.
 *
 * Two spellings are accepted so the Writer's existing drafts and the Builder's
 * plan both work: `configurator: E46` or `configurator: { tag, url }`;
 * `sources[].title` or `sources[].label`. Output is always the normalised form.
 */

export const CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW", "NA"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

// YAML turns `date: 2026-10-02` into a Date object; normalise back to YYYY-MM-DD.
const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use the form YYYY-MM-DD")
);

const confidence = z.preprocess(
  (v) => (typeof v === "string" ? (/^n\/?a$/i.test(v.trim()) ? "NA" : v.trim().toUpperCase()) : v),
  z.enum(CONFIDENCE_LEVELS, { error: "confidence must be HIGH, MEDIUM, LOW or n/a" })
);

const publicPath = z.string().regex(/^\/[^\s]+$/, "must be a path under public/, starting with /");

const sourceInput = z
  .strictObject({
    /** Short id used by inline marks in the body, e.g. S1. Defaults to S<n>. */
    id: z.string().regex(/^S\d+$/i, "id must look like S1").optional(),
    /** What the reader sees. `title` and `label` are synonyms; one is required. */
    title: z.string().min(1).max(400).optional(),
    label: z.string().min(1).max(400).optional(),
    /** Kind of source, e.g. "BMW-authored", "ETK mirror", "forum". Free text. */
    type: z.string().min(1).max(200).optional(),
    /** Path inside the e46build repo (plain text, not a link). */
    path: z.string().min(1).max(400),
    confidence,
    note: z.string().min(1).max(400).optional(),
  })
  .refine((s) => s.title || s.label, { message: "a source needs a title (or label)", path: ["title"] });

const heroInput = z
  .strictObject({
    /** Path under /public. null/absent = no image yet; the layout shows a labelled placeholder. */
    src: publicPath.nullable().optional(),
    alt: z.string().min(1).max(300),
    credit: z.string().min(1).max(160).nullable().optional(),
    licence: z.string().min(1).max(160).nullable().optional(),
    /** Brief for the image that is still to be made (shown to editors only). */
    placeholder: z.string().min(1).max(400).optional(),
  })
  .refine((h) => !h.src || (h.credit && h.licence), { message: "a hero image needs credit and licence", path: ["credit"] });

// Unquoted YAML dates arrive as Date objects: a midnight-UTC Date is a date-only value, anything else an exact instant.
const publishAtInput = z.preprocess(
  (v) => (v instanceof Date ? (v.getTime() % 86_400_000 === 0 ? v.toISOString().slice(0, 10) : v.toISOString()) : v),
  z.string().min(1).refine(
    (v) => {
      try {
        parsePublishAt(v);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'publishAt must be "YYYY-MM-DD" (07:00 Berlin), "YYYY-MM-DDTHH:mm" (Berlin time) or an ISO moment with offset' }
  )
);

const configuratorInput = z.union([
  z.string().min(1).max(40),
  z.strictObject({ tag: z.string().min(1).max(40), url: z.url().optional() }),
]);

const base = z.strictObject({
  title: z.string().min(1).max(140),
  /** Meta description and listing teaser. ≤160 chars is the SEO guideline; up to 320 is accepted. */
  description: z.string().min(1).max(320),
  date: isoDate,
  updated: isoDate.optional(),
  /**
   * Scheduled publishing (BL-004). "YYYY-MM-DD" = 07:00 Europe/Berlin that day; or an ISO moment with offset.
   * Absent = live as soon as it is on main. YAML turns an unquoted date into a Date object; handled.
   */
  publishAt: publishAtInput.optional(),
  /** Optional; must match the file name when present. */
  lang: z.enum(LOCALES).optional(),
  /** Optional; must match the folder name when present. */
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  /** Trello card the article comes from, e.g. BL-015. */
  card: z.string().regex(/^BL-\d{3}(?:\.\d+)?$/, "card must look like BL-015").optional(),
  author: z.string().min(1).max(80).default("Zauberlabs"),
  /** 1–8 tags; must include the configurator tag. Each tag gets its own page. */
  tags: z.array(z.string().min(1).max(40)).min(1).max(8),
  configurator: configuratorInput,
  /** Optional override for the "Try it on your car" button. */
  cta: z.strictObject({ label: z.string().min(1).max(80).optional(), href: z.url().optional() }).optional(),
  hero: heroInput,
  /** Shown above the sources as "Paths relative to …", e.g. "e46build master docs/research/". */
  evidenceRoot: z.string().min(1).max(160).optional(),
  sources: z.array(sourceInput).min(1),
  canonical: z.url().optional(),
  /** true = hidden on the live site (listing, tag pages, feed, sitemap, URL); visible on previews and locally. */
  draft: z.boolean().default(false),
});

export type Source = { id: string; label: string; type?: string; path: string; confidence: Confidence; note?: string };
export type Hero = { src: string | null; alt: string; credit: string | null; licence: string | null; placeholder?: string };

export const frontMatterSchema = base
  .transform((fm) => {
    const configurator = typeof fm.configurator === "string" ? { tag: fm.configurator, url: undefined as string | undefined } : fm.configurator;
    const sources: Source[] = fm.sources.map((s, i) => ({
      id: (s.id ?? `S${i + 1}`).toUpperCase(),
      label: (s.title ?? s.label)!,
      type: s.type,
      path: s.path,
      confidence: s.confidence,
      note: s.note,
    }));
    const hero: Hero = { src: fm.hero.src ?? null, alt: fm.hero.alt, credit: fm.hero.credit ?? null, licence: fm.hero.licence ?? null, placeholder: fm.hero.placeholder };
    // The date readers see is the publish day (Berlin) when a publish moment is set.
    const publishAtMs = fm.publishAt ? parsePublishAt(fm.publishAt) : null;
    const date = publishAtMs === null ? fm.date : dayInZone(publishAtMs);
    return {
      ...fm,
      date,
      publishAtMs,
      configurator: { tag: configurator.tag, url: fm.cta?.href ?? configurator.url },
      ctaLabel: fm.cta?.label,
      sources,
      hero,
    };
  })
  .refine((fm) => fm.tags.some((t) => t.toLowerCase() === fm.configurator.tag.toLowerCase()), {
    message: "tags must include the configurator tag",
    path: ["tags"],
  })
  .refine((fm) => !fm.updated || fm.updated >= fm.date, { message: "updated must not be before date", path: ["updated"] })
  .refine((fm) => new Set(fm.sources.map((s) => s.id)).size === fm.sources.length, { message: "source ids must be unique", path: ["sources"] });

export type FrontMatter = z.infer<typeof frontMatterSchema>;

/** Validates raw front matter; throws an Error whose message names the file and the fields. */
export function parseFrontMatter(raw: unknown, file: string): FrontMatter {
  const result = frontMatterSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid front matter in ${file}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
