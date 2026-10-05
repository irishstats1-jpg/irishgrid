# Irish Grid

An independent, data-driven advocacy website about the Republic of Ireland's
electricity grid: what's powering the country, how much clean energy is **wasted**
through curtailment, what that costs billpayers, and a clearly-labelled proposal
to use **Bitcoin mining as a flexible, interruptible load** that soaks up
otherwise-wasted renewable output.

> **Independent — not affiliated with EirGrid or SONI.** Bitcoin figures are
> illustrative and depend on volatile prices: nothing here is financial advice.

## Stack

- **Next.js 14 (App Router) + TypeScript** — SSR/ISR public pages
- **Tailwind CSS** — design tokens per the brief (navy + sky/teal on white)
- **next-intl** — English default, Irish (Gaeilge) toggle
- **Recharts** — charts; **SVG-projected map** of Ireland (no tile billing)
- **Vitest** — unit tests on the calculation core
- Integration **seams** for Supabase, Resend, OpenAI, Make.com and Cloudflare
  cron (see *Integrations* below)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # methodology engine tests
npm run build      # production build
```

Copy `.env.example` → `.env.local` and fill in what you have. **Nothing is
required to run** — every external integration degrades gracefully to
seed/fallback data when its env vars are absent.

## The methodology engine (`src/lib/methodology/`)

Every figure is derived here, unit-tested, and explained on `/methodology`.

- `btc.ts` — gross mining revenue for a volume of energy, and the net economics
  of a fleet sized for the hours the surplus is available (break-even price)
- `cost.ts` — compensation cost as a low / central / high range, using the
  reported curtailment/constraint split where available
- `forecast.ts` — 20-year scenario: capacity targets, dispatch-down rate,
  halving-aware Bitcoin revenue
- `constants.ts` — default assumptions and the dated market fallback

Run `npm test`.

## Data layer (`src/lib/data/`)

- `dispatchDown.ts` — the one series: Ireland, wind, calendar years, from
  EirGrid/SONI's annual reports (reviewed seeds; a database row can only fill a
  missing or provisional year, and only with a reported figure)
- `metrics.ts` — annual figures for every page; headline = latest reported year
- `live.ts` — CoinGecko + mempool.space snapshot (used only when both arrive)
- `datasets.ts` — open datasets with data dictionaries (CSV/JSON, CC BY 4.0)
- `generators.ts` — curated, partial list of large sites for the map (no output estimates)

## Pages

| Route | Purpose |
|---|---|
| `/` | 01 · The problem — headline, year-by-year explorer, cost range, trend, map |
| `/bitcoin` | 02 · The flexible load — how mining uses electricity, fair criticisms |
| `/proposal` | 03 · The policy option — net economics, alternatives, options A–C, scenario |
| `/briefs`, `/briefs/1` | Policy Brief No. 1 (prints to A4) |
| `/methodology` | How every figure is made; method version and changelog |
| `/data` | Open data downloads with data dictionaries |
| `/about`, `/press`, `/blog`, `/get-involved`, `/pledge` | Supporting pages |
| `/privacy`, `/terms` | Privacy notice (GDPR) and terms of use |
| `/widget/{cost,map,calculator}` | Embeddable iframes |
| `/admin` | Auth-gated dashboard (`ADMIN_EMAILS`) |

## APIs

- `GET /api/social-summary?year=` — figures for Make.com scenarios
- `GET /api/social-card?year=` — branded 1200×630 SVG card
- `GET /api/data/[dataset]` — CSV, or JSON with `?format=json`
- `POST /api/submissions`, `POST /api/pledge` (+ `/confirm`, `/withdraw`) — forms
- `GET|POST /api/cron/ingest` — hourly refresh; `?job=daily` also purges expired data

## Integrations (env-gated, graceful)

| Service | Used for | Without env |
|---|---|---|
| Supabase | DB + Auth + content | seed data, no-op writes |
| Resend | email confirmations/notifications | skipped |
| OpenAI | blog drafting / GA translation | admin seam |
| Make.com | social auto-posting | `/api/social-*` still serve |
| CoinGecko / mempool | BTC price + hashrate | fallback snapshot |
| EirGrid | live system data | synthetic series |

DB schema: `supabase/schema.sql` (with RLS). Cron/deploy: `wrangler.toml`.

### Connecting Supabase

1. In the Supabase **SQL Editor**, run **`supabase/schema.sql`** then **`supabase/seed.sql`**.
2. Create the single admin user: Supabase **Authentication → Users → Add user** (email + password). That's the `/admin` login.
3. Set env vars (locally in `.env.local`, in prod in your host):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, safe to expose
   - `SUPABASE_SERVICE_ROLE_KEY` — **secret**; server-only (form writes). Never commit it.
4. `/admin` then requires login; submissions, pledges and the blog CMS persist to Postgres.

> Note: the CI/sandbox network policy may block outbound calls to your Supabase
> host, so live DB calls can't be exercised from there — they work from your
> deployment. Every read/write already falls back gracefully when the DB is
> unreachable.

## Deployment (Cloudflare Pages + Workers)

```bash
npx @cloudflare/next-on-pages
# deploy output to Cloudflare Pages; set env vars + secrets in the dashboard
```

Configure a Cron Trigger to `POST /api/cron/ingest` hourly with the shared
secret (`MAKE_SOCIAL_WEBHOOK_SECRET`).

## Open items (flagged from the brief §20)

Defaults are applied and marked in code; confirm with the owner:

1. **Domain** — assumed `irishgrid.com`.
2. **Generator dataset / major-sites list** — seed set (EirGrid list + OSM); needs final sourcing.
3. **Wholesale price feed** — SEMOpx; seeded reference rate in cost model.
4. **Cost denominator** — per billpayer headline; per person also shown.
5. **Map** — SVG projection used (no Mapbox billing); can swap to Leaflet+OSM/Mapbox.
6. **Make "euro-spending" scenario** — seam built; supply wording/timing to mirror.
7. **Investor data room** — request-access-then-email flow built into the form.
8. **Forecast horizon** — 2026→2046, balanced pathway default, BAU-vs-mining toggle.

## Scope notes

This build delivers the full architecture, all pages, the tested methodology
engine, and drop-in seams for every external service. Items that require live
credentials or the owner's accounts (real Supabase Auth gating, live EirGrid
ingestion writes, Make scenarios, OpenAI translation runs) are implemented as
documented seams, not stubs — the data model, APIs and rendering are in place.
UI-string i18n covers layout/nav; long-form page prose is English pending the
GA translation pass (§12, step 15).
