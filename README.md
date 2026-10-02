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
- `app/[lang]/blog` — blog: listing, `tag/<tag>`, `<slug>` (de/en with fallback), `feed.xml`. Articles are MDX files in `content/blog/<slug>/{en,de}.mdx`; see `content/blog/README.md` for the front matter. Drafts (`draft: true`) are hidden on production only.
- `lib/i18n.ts` → `E46_LIVE`: while the E46 configurator is offline every E46 button shows "coming soon"; set `NEXT_PUBLIC_E46_LIVE=1` to go live.

## Checks

```bash
npm run typecheck   # tsc
npm test            # node:test — blog schema/loader/RSS/sitemap, every article compiles
npm run smoke       # next build + next start on port 3010 + request every blog route
```

## Deploy

1. Import this repo in Vercel (Add New → Project).
2. Storage → Upstash for Redis → connect to the project (adds `UPSTASH_REDIS_REST_URL` / `_TOKEN`).
3. Settings → Environment Variables: `VOTE_SALT` (random string), `ADMIN_PASSWORD` (for /de/admin), optionally `NEXT_PUBLIC_E46_URL`.
4. Settings → Domains: add `zauberlabs.de` and `www.zauberlabs.de`, then create the A/CNAME records Vercel shows in the whois.com DNS panel.

Read suggestions: `LRANGE suggestions 0 -1` in the Upstash console.
