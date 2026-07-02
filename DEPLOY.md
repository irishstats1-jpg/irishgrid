# Deploying Irish Grid

The app is a standard Next.js 14 (App Router) site with ISR, the Node runtime,
and `next/og`. It builds clean (`npm run build`) and is ready to deploy. Pick a
host below.

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

## Path A — Vercel (recommended: zero code changes, fastest)

Everything built here works on Vercel as-is (ISR, Node runtime, `next/og`, cron).

1. Import the GitHub repo at vercel.com (framework auto-detected as Next.js).
2. Add the env vars above.
3. Deploy. Cron is already configured in `vercel.json` (hourly + daily). Set
   `CRON_SECRET` in Vercel so the cron calls are authorized.
4. **Domain:** in Vercel add your domain; in Cloudflare DNS add the CNAME/A
   records Vercel shows (keep the domain registered/proxied on Cloudflare).

That's a fully live site.

## Path B — Cloudflare (matches the brief; needs an adapter step)

Cloudflare's current Next adapters have a version requirement:

- **`@opennextjs/cloudflare`** (recommended, supports the Node runtime, ISR,
  `next/og`) requires **Next 15**.
- **`@cloudflare/next-on-pages`** requires all dynamic routes to use the **edge
  runtime**.

So Cloudflare needs either a **Next 15 upgrade** (then OpenNext) or an
**edge-runtime conversion** (then next-on-pages). Both are mechanical but should
be verified with a real deploy. `wrangler.toml` (Cron Triggers) and
`.dev.vars.example` are already in place for when you choose one. Ask and this
upgrade can be done + built as a follow-up.

---

## After deploy — checklist

- [ ] Supabase: `schema.sql` + `seed.sql` run; admin user created
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in the host (secret)
- [ ] `NEXT_PUBLIC_SITE_URL` = your real domain
- [ ] Domain pointed via Cloudflare DNS
- [ ] Cron authorized (`CRON_SECRET` on Vercel, or the shared secret on Cloudflare)
- [ ] Visit `/admin` → log in with the Supabase user
- [ ] Submit a test pledge → confirm the row appears in Supabase `pledges`
