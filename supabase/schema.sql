-- Irish Grid — Supabase / Postgres schema (§8).
-- Run in the Supabase SQL editor. RLS is enabled with public read on public
-- data and service-role-only writes; admin CRUD uses the service role.

-- ---------- Reference / content ----------
create table if not exists generators (
  id text primary key,
  name text not null,
  fuel_type text not null,
  capacity_mw numeric not null,
  operator text,
  lat double precision,
  lng double precision,
  region text,
  is_major boolean default false,
  commissioned_year int,
  source_ref text
);

create table if not exists generation_snapshots (
  ts timestamptz not null,
  fuel_type text not null,
  mw numeric,
  demand_mw numeric,
  snsp numeric,
  co2_intensity numeric,
  interconnector_mw numeric,
  wind_available_mw numeric,
  primary key (ts, fuel_type)
);

create table if not exists dispatch_down_actuals (
  year int not null,
  region text not null default 'ROI',
  source text,
  gwh numeric,
  curtailment_gwh numeric,
  constraint_gwh numeric,
  notes text,
  primary key (year, region)
);

create table if not exists period_metrics (
  period_key text primary key,
  produced_mwh numeric,
  wasted_mwh numeric,
  source_breakdown jsonb,
  cost_eur numeric,
  cost_per_billpayer_eur numeric,
  cost_per_person_eur numeric,
  btc_mineable numeric,
  btc_value_eur numeric,
  saving_per_billpayer_eur numeric,
  is_estimate boolean,
  computed_at timestamptz default now()
);

create table if not exists wholesale_prices (ts timestamptz primary key, price_eur_mwh numeric);
create table if not exists btc_market (
  ts timestamptz primary key,
  price_eur numeric,
  difficulty numeric,
  network_hashrate numeric,
  block_reward numeric
);

create table if not exists assumptions (key text primary key, value numeric, unit text, updated_at timestamptz default now());
create table if not exists forecast_config (key text primary key, value numeric, unit text, updated_at timestamptz default now());
create table if not exists forecast_points (
  scenario text,
  year int,
  renewable_capacity_gw numeric,
  penetration_pct numeric,
  curtailment_gwh numeric,
  recovered_gwh numeric,
  recovered_value_eur numeric,
  saving_per_household_eur numeric,
  primary key (scenario, year)
);

-- ---------- CMS ----------
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text default 'draft',
  published_at timestamptz,
  author text,
  cover_image text,
  title text,
  excerpt text,
  body text,
  seo_meta jsonb,
  created_at timestamptz default now()
);
create table if not exists blog_post_translations (
  post_id uuid references blog_posts(id) on delete cascade,
  locale text,
  title text,
  body text,
  excerpt text,
  seo_meta jsonb,
  reviewed boolean default false,
  primary key (post_id, locale)
);

-- ---------- Automation + inbound ----------
create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text,
  period_key text,
  status text,
  scheduled_for timestamptz,
  image_url text,
  caption text,
  external_id text,
  created_at timestamptz default now()
);
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb,
  created_at timestamptz default now(),
  handled boolean default false
);
create table if not exists pledges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org text,
  email text not null,
  created_at timestamptz default now(),
  confirmed boolean default false
);
create table if not exists press_assets (
  id uuid primary key default gen_random_uuid(),
  title text,
  file_url text,
  kind text
);
create table if not exists job_status (
  job text primary key,
  last_run timestamptz,
  ok boolean,
  detail text
);

-- ---------- RLS ----------
-- Public read on public datasets + published blog; everything else service-role.
alter table generators enable row level security;
alter table generation_snapshots enable row level security;
alter table dispatch_down_actuals enable row level security;
alter table period_metrics enable row level security;
alter table btc_market enable row level security;
alter table wholesale_prices enable row level security;
alter table forecast_points enable row level security;
alter table blog_posts enable row level security;
alter table blog_post_translations enable row level security;
alter table submissions enable row level security;
alter table pledges enable row level security;
alter table press_assets enable row level security;

create policy "public read generators" on generators for select using (true);
create policy "public read snapshots" on generation_snapshots for select using (true);
create policy "public read actuals" on dispatch_down_actuals for select using (true);
create policy "public read period_metrics" on period_metrics for select using (true);
create policy "public read btc_market" on btc_market for select using (true);
create policy "public read wholesale" on wholesale_prices for select using (true);
create policy "public read forecast" on forecast_points for select using (true);
create policy "public read published posts" on blog_posts for select using (status = 'published');
create policy "public read translations" on blog_post_translations for select using (true);
create policy "public read press" on press_assets for select using (true);
-- submissions/pledges: inserts happen via the service role in API routes; no public policies.
