# zauberlabs.de

Landing page for Zauberlabs — independent configurators for modern classics. First configurator: E46BUILD.

Next.js (App Router) + Tailwind CSS v4, deployed on Vercel.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000 → redirects to /de
```

Votes and suggestions work without any setup (kept in memory). For persistence, add Upstash Redis.

## Structure

- `app/[lang]/page.tsx` — the landing page (`/de`, `/en`)
- `lib/i18n.ts` — all copy in German and English, plus `E46_URL`
- `lib/cars.ts` — built-in cars in the community vote
- `/de/admin` — review visitor suggestions: approve (becomes a vote tag) or dismiss; remove approved cars. Password: `ADMIN_PASSWORD` env var
- `app/api/vote` — GET counts, POST `{ car, on }` (one vote per car per visitor, cookie `zl_vid`, rate-limited by hashed IP)
- `app/api/suggest` — POST `{ car, email? }` → Redis list `suggestions`
- `app/[lang]/impressum`, `app/[lang]/datenschutz` — **drafts, fill in before launch**
- `app/[lang]/blog` — blog: listing, `tag/<tag>`, `<slug>` (de/en with fallback), `feed.xml`. Articles are MDX files in `content/blog/<slug>/{en,de}.mdx`; see `content/blog/README.md` for the front matter. Drafts (`draft: true`) are hidden on production only. Scheduled publishing: `publishAt: "YYYY-MM-DD"` → live from 07:00 Europe/Berlin that day via ISR (pages revalidate every 5 min), hidden before.
- `lib/i18n.ts` → `E46_LIVE`: while the E46 configurator is offline every E46 button shows "coming soon"; set `NEXT_PUBLIC_E46_LIVE=1` to go live.

## Checks

```bash
npm run typecheck   # tsc
npm test            # node:test — blog schema/loader/RSS/sitemap, every article compiles
npm run smoke       # next build + next start on port 3010 + request every blog route
```

## Agent rules

Rules for every agent working in this repository (Builder, Writer, Editor, Coordinator); the full operating agreement is Trello card BL-000 on the "ZAUBERLABS — Blog" board.

- **No personal data in outbound requests (PO decision 2026-10-11, BL-042).** Never send personal data — the PO's email address, names, tokens — in a User-Agent, header, URL or request body to an outside host. Check helper and subagent briefs for the same before handing them out.
- **Neutral User-Agent for outside fetches.** Scripts and tools that fetch from outside hosts identify as a research tool with a neutral User-Agent, for example `zauberlabs-research/1.0`, and carry no personal data.

## Deploy

1. Import this repo in Vercel (Add New → Project).
2. Storage → Upstash for Redis → connect to the project (adds `UPSTASH_REDIS_REST_URL` / `_TOKEN`).
3. Settings → Environment Variables: `VOTE_SALT` (random string), `ADMIN_PASSWORD` (for /de/admin), optionally `NEXT_PUBLIC_E46_URL`.
4. Settings → Domains: add `zauberlabs.de` and `www.zauberlabs.de`, then create the A/CNAME records Vercel shows in the whois.com DNS panel.

Read suggestions: `LRANGE suggestions 0 -1` in the Upstash console.

## Statistics (BL-051)

Our own anonymous reading statistics, shown under "Reading statistics" on `/de/admin` (same password). Described in the Datenschutz, Abschnitt 6.

- **What is counted:** article views per article and language, unique readers per day, referrer domain only, country (`x-vercel-ip-country`, counted on its own), engaged reading time in buckets, read-to-end, and configurator clicks. Article pages send a beacon to `app/api/m` (`components/blog/ReadBeacon.tsx`); configurator clicks come from `components/ConfiguratorClickTracker.tsx`.
- **What is stored:** daily counters only, in the existing Upstash Redis (`lib/metrics-store.ts`). No IP, no cookies, nothing in the browser, no record per visitor. Unique readers: a SHA-256 of a daily random salt + IP + User-Agent goes only into a HyperLogLog. The salt expires 24 h after it's created. The next day the HyperLogLog is rolled up into a plain number and deleted. Daily keys expire after 400 days (about 13 months).
- **Keys:** production writes `m:*`. Preview and local builds write `m:test:*`, so test clicks never mix with real numbers.
- **Not counted:** bots (User-Agent), devices in internal mode (BL-039), drafts and scheduled previews, slugs that aren't published articles.
- **Upstash region:** Frankfurt am Main (AWS eu-central-1), as stated in the Datenschutz (Abschnitt 9). That's our own text, not a config value. Confirm in the Upstash console (database → Details → Region) or in Vercel (project → Storage).
