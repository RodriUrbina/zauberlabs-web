# Blog content — authoring guide

One folder per article, one file per language:

```
content/blog/<slug>/en.mdx      English (first)
content/blog/<slug>/de.mdx      German (later, separate card)
public/blog/<slug>/hero.jpg     hero image + any article images
```

- `<slug>` is the URL (`/en/blog/<slug>`): lowercase letters, digits and hyphens only, e.g. `e46-steering-wheel-swaps`. Both languages share the slug.
- An article that exists in one language only is shown in the other language too, with a note at the top. Never a 404.
- `draft: true` hides the article on the live site (listing, tag pages, feed, sitemap and URL). Previews and local runs show drafts, so the PO can read them.
- The build **fails** on a bad, missing or unknown front-matter field and tells you which file and field.
- The schema lives in `lib/blog-schema.ts`; this file is the human version of it.

## Front matter (YAML, between `---` lines)

```yaml
---
title: "The SMART airbag line: E46 steering-wheel swaps explained"   # ≤140 chars
description: "What changed in June 1999, what BMW's own retrofit kit contains, and what to check before buying a wheel."
                                   # meta description + teaser; ≤160 chars is the SEO guideline, up to 320 accepted
date: 2026-10-05                   # YYYY-MM-DD, publication date
updated: 2026-10-07                # optional, not before date
lang: en                           # optional; must match the file name
slug: e46-steering-wheel-swaps     # optional; must match the folder name
card: BL-015                       # optional; the Trello card
author: Zauberlabs                 # optional, default "Zauberlabs"; a person's name is allowed
tags: [E46, Steering wheels, Safety]   # 1–8; MUST include the configurator tag; each tag gets its own page
configurator: E46                  # or  configurator: { tag: E46, url: https://e46.zauberlabs.de/steering-wheels }
cta:                               # optional override of the "Try it on your car" button
  label: "Try it on your car in the E46 configurator"
  href: https://e46.zauberlabs.de/steering-wheels
hero:
  src: /blog/e46-steering-wheel-swaps/hero.jpg   # file under public/; `null` while no licensed image exists → labelled placeholder
  alt: "E46 steering wheel with multifunction buttons, studio shot"
  credit: "AI-generated (Zauberlabs)"            # required when src is set
  licence: "AI-generated, labelled"              # required when src is set
  placeholder: "Brief for the image still to be made"   # optional
evidenceRoot: "e46build master docs/research/"  # optional; shown as "Paths are relative to …"
sources:                           # at least one; rendered as the "Sources & confidence" box (plain text, no links)
  - id: S1                         # optional (defaults to S1, S2, …); used by the inline marks below
    title: "BMW retrofit instructions (EBA) for the multifunction kit"   # `label` is a synonym
    type: BMW-authored             # optional, free text
    path: t029-evidence/T-029-findings.md
    confidence: HIGH               # HIGH | MEDIUM | LOW | n/a
    note: "HIGH for what the document itself states."   # optional
canonical: https://www.zauberlabs.de/en/blog/e46-steering-wheel-swaps   # optional, rarely needed
draft: true                        # optional, default false
---
```

## Confidence

HIGH / MEDIUM / LOW follow the e46build evidence index (`docs/research/research-evidence-index.md`): **HIGH** = a BMW-authored document read in full, or two independent catalogue mirrors agreeing at part-number and date level; **MEDIUM** = one catalogue mirror; **LOW** = non-catalogue source only; **n/a** = an internal synthesis. The site shows **one legend** under every Sources box (`lib/confidence-legend.ts`, PO decision 2026-10-02). **Do not write a legend in the article.**

`confidence` is **one grade per source** (HIGH, MEDIUM, LOW or n/a); when a source is stronger for some facts than others, write one grade and explain the split in `note`. Compound grades such as `MEDIUM-HIGH` or `HIGH / MEDIUM` fail the build.

## Body

Plain Markdown (headings from `##` down, lists, tables, links, bold, quotes). Keep part numbers out of the body; link to the configurator instead.

**Inline evidence marks** in plain text are rendered as chips that link to the matching source:

```
BMW's instruction applies from June 1999. [S1, HIGH]
The exact month is disputed. [S1, HIGH that the document says so; S4, LOW]
Paddles need the gearbox. [S2, S4]   or   [S5, open item]
```

Text after a `;` without a source id is kept as a caveat on the preceding chip (`[S1, HIGH for the scope; the month itself MEDIUM]` → chip "S1 · HIGH", caveat "for the scope; the month itself MEDIUM"). A compound grade inline (`LOW–MEDIUM`) shows the lower grade on the chip and keeps the full wording as the caveat. A leading colon after the grade is fine (`[S1, HIGH: both mirrors]`).

Optional building blocks (nothing else is available):

```mdx
<Confidence level="MEDIUM">one claim with its badge</Confidence>

<Callout type="warning" title="Check before you buy">
Do your low beams swivel when you steer?
</Callout>

<Figure src="/blog/<slug>/levelling-unit.jpg" alt="…" caption="…" credit="Zauberlabs" />

<ConfiguratorLink>Find the right headlight for your production date</ConfiguratorLink>
```

**Rendered by the layout, never written by hand:** the "Try it on your car" box, the "Sources & confidence" box and its legend. Keep your "Recorded conflicts / Not established / Method note" prose in the body under a heading such as `## Notes on the evidence`.

While the E46 configurator is offline (`E46_LIVE` false in `lib/i18n.ts`), every configurator button shows "coming soon" with no link.

## Images

Own photos, licensed images with recorded provenance, or AI-generated images labelled as such (BL-000 rule 3). Record credit and licence in the front matter. Put files under `public/blog/<slug>/`. Hero images render at 16:9; aim for 1600×900 JPEG, under 300 KB. No image yet? Use `src: null` and a `placeholder` brief.

## Checks

```
npm run typecheck   # TypeScript
npm test            # schema, loader, every article compiles, RSS, sitemap
npm run build       # fails on invalid front matter
npm run smoke       # builds, starts on port 3010, checks every blog route
```
