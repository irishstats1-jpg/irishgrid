# Deploying Irish Grid

The app is a Next.js 15 (App Router) site with ISR, the Node runtime, and
`next/og`. It builds clean (`npm run build`) and is ready to deploy. Cloudflare
(Path A) is the primary, brief-aligned target and is wired via OpenNext.

## Environment variables (both paths)

| Var | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Secret** — server-only (form writes) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | e.g. `https://irishgrid.com` |
| `MAKE_SOCIAL_WEBHOOK_SECRET` | rec. | Shared secret for the cron + Make webhook |
| `RESEND_API_KEY` / `CONTACT_NOTIFY_EMAIL` | optional | Email confirmations |
| `OPENAI_API_KEY` | optional | Blog drafting + GA translation |
| `NEXT_PUBLIC_ANALYTICS_DOMAIN` | optional | Plausible/Umami |

---

## Path A — Cloudflare Workers via OpenNext (LIVE — deployed by GitHub Actions)

The app runs on Next 15 with the `@opennextjs/cloudflare` adapter and is
deployed automatically by `.github/workflows/deploy.yml` on every push to
`main`. Node runtime, ISR, `next/og` and middleware all work.

**How the live pipeline works (no local steps needed):**
- Push to `main` → GitHub Actions runs on **Node 22** (wrangler 4 requires it).
- Build step: `npx opennextjs-cloudflare build` (calls `next build` internally,
  no recursion) → produces `.open-next/`.
- Deploy step: `npx wrangler deploy`, authenticated by the repo secret
  `CLOUDFLARE_API_TOKEN`, publishes the Worker `irishgrid`.
- `wrangler.toml` routes it at the `irishgrid.com` custom domain
  (`workers_dev = false`).

**Cron Triggers — set these in the dashboard.** The deploy API token can't
register schedules (it fails the whole `wrangler deploy`), so `[triggers]` was
removed from `wrangler.toml`. Add them once in the dashboard: Workers & Pages →
`irishgrid` → Settings → Triggers → Cron Triggers → add `0 * * * *` and
`15 6 * * *`. The `scheduled()` handler in `custom-worker.js` runs when they
fire. Until then, ISR still revalidates pages hourly on visits.

### Legacy one-time local setup (only if deploying by hand)

**One-time setup**
1. `npm install`
2. `npx wrangler login` (authorise your Cloudflare account)
3. Set public vars in `wrangler.toml` `[vars]` (or the dashboard):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
4. Set secrets:
   ```
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put MAKE_SOCIAL_WEBHOOK_SECRET
   # optional: RESEND_API_KEY, CONTACT_NOTIFY_EMAIL, OPENAI_API_KEY
   ```

**Deploy**
```
npm run deploy      # opennextjs-cloudflare build && deploy
npm run preview     # test the Workers build locally first
```

**Cron** — the two schedules (hourly + daily) are in `wrangler.toml` `[triggers]`
and call `/api/cron/ingest`, authorized by `MAKE_SOCIAL_WEBHOOK_SECRET`.

**Domain** — Cloudflare dashboard → Workers & Pages → your Worker → Settings →
Domains & Routes → add your custom domain. Set `NEXT_PUBLIC_SITE_URL` to match.

**ISR note** — for persistent caching across instances, add an R2 incremental
cache in `open-next.config.ts` (see the adapter docs). It works without it too.

## Path B — Vercel (alternative, zero extra setup)

Everything also works on Vercel as-is. Import the repo (auto-detected), add the
env vars, deploy. Cron is in `vercel.json` (set `CRON_SECRET`). Point the domain
via Cloudflare DNS. Note: Vercel's free tier is non-commercial and its free cron
is daily-only.

---

## Hourly auto-updates (free Cloudflare Worker + Vercel)

Vercel's free tier limits cron to once per day, but Cloudflare's free plan
includes Cron Triggers up to every minute. A tiny Worker
(`workers/cron-pinger/worker.js`) bridges the two: it pings the site's ingest
endpoint hourly and warms the key pages so ISR re-renders with fresh data.

Browser-only setup (~3 minutes):

1. **dash.cloudflare.com → Workers & Pages → Create → Create Worker** → name it
   `irishgrid-cron` → Deploy → **Edit code** → replace the contents with
   `workers/cron-pinger/worker.js` → **Save and deploy**.
2. Worker → **Settings → Variables and Secrets**:
   - `SITE_URL` = `https://irishgrid.com` (plain text)
   - `CRON_SECRET` = the same value you set in Vercel (choose *Encrypt*)
3. Worker → **Settings → Triggers → Cron Triggers** → add two schedules:
   - `0 * * * *` (hourly refresh)
   - `15 6 * * *` (daily milestone job)

Notes: the site's pages already revalidate hourly (ISR) when visited — the
Worker guarantees freshness even with no traffic, and drives the daily job.
The daily Vercel cron in `vercel.json` stays as a harmless backup.

## After deploy — checklist

- [ ] Supabase: `schema.sql` + `seed.sql` run; admin user created
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in the host (secret)
- [ ] `NEXT_PUBLIC_SITE_URL` = your real domain
- [ ] Domain pointed via Cloudflare DNS
- [ ] Cron authorized (`CRON_SECRET` on Vercel, or the shared secret on Cloudflare)
- [ ] Visit `/admin` → log in with the Supabase user
- [ ] Submit a test pledge → confirm the row appears in Supabase `pledges`
