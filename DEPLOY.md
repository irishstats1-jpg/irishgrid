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
| `CRON_SECRET` | ✅ | **Secret** — authorises `/api/cron/ingest` (or reuse `MAKE_SOCIAL_WEBHOOK_SECRET`); without it the cron route refuses in production |
| `ADMIN_EMAILS` | ✅ | **Secret** — comma-separated emails allowed into `/admin`; without it admin stays locked in production |
| `MAKE_SOCIAL_WEBHOOK_SECRET` | optional | Shared secret for the Make webhook (also accepted by the cron route) |
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

## Scheduled jobs (Cloudflare Cron Triggers)

The site's own Worker has a `scheduled()` handler (`custom-worker.js`) that
calls `/api/cron/ingest` internally. The deploy token cannot register
schedules, so add them once in the dashboard:

**Workers & Pages → irishgrid → Settings → Triggers → Cron Triggers**
- `0 * * * *` — hourly: refresh the Bitcoin market snapshot and the annual series
- `15 6 * * *` — daily: the same, plus deleting data past its retention period
  (unconfirmed pledges after 30 days, Get Involved submissions after 2 years)

## After deploy — checklist

- [ ] Supabase SQL editor: run `supabase/migrations/20261005_hardening.sql`
      (RLS on the remaining tables, pledge confirmation columns, audit log)
- [ ] Supabase → Authentication → Providers → Email: turn off **Allow new users to sign up**
- [ ] Cloudflare → irishgrid → Settings → Variables and Secrets (type *Secret*):
      `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `ADMIN_EMAILS`, and
      `RESEND_API_KEY` + `CONTACT_NOTIFY_EMAIL` for emails
- [ ] Cron Triggers added (above)
- [ ] Mailboxes exist: `privacy@`, `press@` and `hello@irishgrid.com` (Resend sender domain verified)
- [ ] Visit `/admin` → sign in with an `ADMIN_EMAILS` address
- [ ] Sign a test pledge → confirm by email → the tally counts it; withdraw → the row is deleted
