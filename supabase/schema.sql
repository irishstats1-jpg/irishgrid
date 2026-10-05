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

-- Drop-then-create so the script is safe to re-run (create policy is not idempotent).
drop policy if exists "public read generators" on generators;
create policy "public read generators" on generators for select using (true);
drop policy if exists "public read snapshots" on generation_snapshots;
create policy "public read snapshots" on generation_snapshots for select using (true);
drop policy if exists "public read actuals" on dispatch_down_actuals;
create policy "public read actuals" on dispatch_down_actuals for select using (true);
drop policy if exists "public read period_metrics" on period_metrics;
create policy "public read period_metrics" on period_metrics for select using (true);
drop policy if exists "public read btc_market" on btc_market;
create policy "public read btc_market" on btc_market for select using (true);
drop policy if exists "public read wholesale" on wholesale_prices;
create policy "public read wholesale" on wholesale_prices for select using (true);
drop policy if exists "public read forecast" on forecast_points;
create policy "public read forecast" on forecast_points for select using (true);
drop policy if exists "public read published posts" on blog_posts;
create policy "public read published posts" on blog_posts for select using (status = 'published');
drop policy if exists "public read translations" on blog_post_translations;
create policy "public read translations" on blog_post_translations for select using (true);
drop policy if exists "public read press" on press_assets;
create policy "public read press" on press_assets for select using (true);
-- submissions/pledges: inserts happen via the service role in API routes; no public policies.

-- ---------- Hardening (audit, Oct 2026) ----------

-- ---------- 1. Row-level security on every table ----------
-- The anon key is public (it ships in every page), so a table without RLS is
-- writable by anyone. These four were missing it.
alter table assumptions enable row level security;
alter table forecast_config enable row level security;
alter table social_posts enable row level security;
alter table job_status enable row level security;

-- Methodology inputs are public by design (read-only); automation tables stay
-- service-role only (no policies).
drop policy if exists "public read assumptions" on assumptions;
create policy "public read assumptions" on assumptions for select using (true);
drop policy if exists "public read forecast_config" on forecast_config;
create policy "public read forecast_config" on forecast_config for select using (true);

-- ---------- 2. Annual actuals: integrity + provenance ----------
alter table dispatch_down_actuals add column if not exists method text;
alter table dispatch_down_actuals add column if not exists wind_pct numeric;
alter table dispatch_down_actuals add column if not exists source_url text;
alter table dispatch_down_actuals add column if not exists updated_at timestamptz default now();

alter table dispatch_down_actuals drop constraint if exists dda_method_valid;
alter table dispatch_down_actuals add constraint dda_method_valid
  check (method is null or method in ('reported', 'provisional')) not valid;
alter table dispatch_down_actuals drop constraint if exists dda_values_valid;
alter table dispatch_down_actuals add constraint dda_values_valid check (
  (gwh is null or gwh >= 0)
  and (curtailment_gwh is null or curtailment_gwh >= 0)
  and (constraint_gwh is null or constraint_gwh >= 0)
  and (wind_pct is null or (wind_pct >= 0 and wind_pct <= 100))
  and (curtailment_gwh is null or constraint_gwh is null or gwh is null
       or abs(curtailment_gwh + constraint_gwh - gwh) <= 1)
) not valid;

-- Audit trail: every change to annual actuals and assumptions is logged.
create table if not exists data_changes (
  id bigserial primary key,
  table_name text not null,
  row_key text,
  old_row jsonb,
  new_row jsonb,
  changed_at timestamptz not null default now(),
  changed_by text default current_user
);
alter table data_changes enable row level security;

create or replace function log_data_change() returns trigger
language plpgsql security definer as $$
begin
  insert into data_changes (table_name, row_key, old_row, new_row)
  values (
    tg_table_name,
    coalesce(to_jsonb(new), to_jsonb(old)) ->> (case when tg_table_name = 'dispatch_down_actuals' then 'year' else 'key' end),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

drop trigger if exists dda_audit on dispatch_down_actuals;
create trigger dda_audit after insert or update or delete on dispatch_down_actuals
  for each row execute function log_data_change();
drop trigger if exists assumptions_audit on assumptions;
create trigger assumptions_audit after insert or update or delete on assumptions
  for each row execute function log_data_change();

-- ---------- 3. Pledges: limits, de-duplication, double opt-in ----------
alter table pledges add column if not exists confirm_token text;
alter table pledges add column if not exists withdraw_token text;
alter table pledges add column if not exists confirmed_at timestamptz;

alter table pledges drop constraint if exists pledges_lengths;
alter table pledges add constraint pledges_lengths check (
  char_length(name) <= 120 and char_length(email) <= 254
  and (org is null or char_length(org) <= 160)
) not valid;

alter table submissions drop constraint if exists submissions_size;
alter table submissions add constraint submissions_size
  check (pg_column_size(payload) <= 16384) not valid;

-- One pledge per email. If duplicates already exist the index is skipped (the
-- API also de-duplicates); remove duplicates and re-run to enforce it here.
do $$
begin
  create unique index if not exists pledges_email_unique on pledges (lower(email));
exception when unique_violation then
  raise notice 'pledges has duplicate emails; unique index not created';
end $$;

create index if not exists pledges_confirm_token on pledges (confirm_token) where confirm_token is not null;
create index if not exists pledges_withdraw_token on pledges (withdraw_token) where withdraw_token is not null;
