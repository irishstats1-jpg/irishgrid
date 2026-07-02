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

## The methodology engine (the heart — `src/lib/methodology/`)

This is the credibility of the whole site and is fully unit-tested. Every figure
is derived here with intermediate values exposed so it can be audited on-screen
(see `/about`).

- `btc.ts` — BTC-mineable value & per-billpayer savings (§7.3)
- `cost.ts` — cost to billpayers as compensation/constraint payments, honestly
  separating wasted **volume** from compensated **cost** (§7.2)
- `forecast.ts` — 20-year curtailment-growth + per-household-savings scenarios (§7.5)
- `constants.ts` — transparent default assumptions (§7.4)

Run `npm test` — 24 tests cover the engine.

## Data layer (`src/lib/data/`)

A clean seam that today serves curated seed data and a deterministic synthetic
time-series, and in production reads from Supabase / EirGrid:

- `generators.ts` — curated generator set (`isMajor` = default map)
- `dispatchDown.ts` — annual actuals calibrated to the Constraint & Curtailment reports
- `series.ts` — deterministic daily fuel-mix series standing in for `generation_snapshots`
- `metrics.ts` — computes/caches period metrics via the engine
- `live.ts` — resilient CoinGecko / mempool / EirGrid fetchers for the cron

Short-period figures are **modelled estimates**; year views use **official
actuals** — labelled throughout.

## Pages

| Route | Purpose |
|---|---|
| `/` | Home — hero map, duration toggle, stats panel, charts |
| `/curtailment` | Explainer + cost table + as-is vs recovered comparison |
| `/proposal` | 50/50 proposal, how it works, *Objections, answered* |
| `/forecast` | Interactive 20-year scenario explorer (sliders) |
| `/get-involved` | 4 pathways → `/api/submissions` |
| `/pledge` | Running tally + `/api/pledge` |
| `/about` | Full transparent methodology + worked examples + sources |
| `/blog`, `/blog/[slug]` | Blog (Supabase-or-seed) |
| `/press` | Media kit |
| `/data` | Researcher CSV export |
| `/widget/{cost,map,calculator}` | Embeddable iframes |
| `/admin` | Auth-gated dashboard + section seams |

## APIs

- `GET /api/social-summary?period=` — figures for Make.com scenarios (§11)
- `GET /api/social-card?period=` — branded 1200×630 SVG card
- `GET /api/data/[dataset]` — CSV export
- `POST /api/submissions`, `POST /api/pledge` — forms (Supabase + Resend seams)
- `POST /api/cron/ingest` — hourly ingestion + recompute (Cloudflare cron)

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
