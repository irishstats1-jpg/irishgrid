-- Irish Grid seed data (generated from src/lib/data). Run AFTER schema.sql.

insert into generators (id,name,fuel_type,capacity_mw,operator,lat,lng,region,is_major,source_ref) values
  ('moneypoint','Moneypoint','coal',855,'ESB',52.611,-9.406,'Clare',true,'EirGrid connected generators'),
  ('aghada','Aghada','gas',885,'ESB',51.827,-8.211,'Cork',true,'EirGrid connected generators'),
  ('whitegate','Whitegate','gas',445,'Bord Gáis Energy',51.826,-8.23,'Cork',true,'EirGrid connected generators'),
  ('poolbeg','Poolbeg','gas',470,'ESB',53.339,-6.187,'Dublin',true,'EirGrid connected generators'),
  ('huntstown','Huntstown','gas',747,'Energia',53.41,-6.32,'Dublin',true,'EirGrid connected generators'),
  ('tarbert','Tarbert','oil',590,'ESB',52.573,-9.375,'Kerry',true,'EirGrid connected generators'),
  ('great-island','Great Island','gas',464,'SSE',52.238,-6.951,'Wexford',true,'EirGrid connected generators'),
  ('dublin-bay','Dublin Bay Power','gas',415,'Synergen',53.339,-6.19,'Dublin',false,'EirGrid connected generators'),
  ('galway-wind-park','Galway Wind Park','wind',174,'SSE / Coillte',53.293,-9.47,'Galway',true,'EirGrid connected generators'),
  ('oweninny','Oweninny Wind Farm','wind',172,'ESB / Bord na Móna',54.045,-9.56,'Mayo',true,'EirGrid connected generators'),
  ('meenadreen','Meenadreen Wind Farm','wind',108,'Energia',54.76,-8.15,'Donegal',true,'EirGrid connected generators'),
  ('mount-lucas','Mount Lucas Wind Farm','wind',84,'Bord na Móna',53.29,-7.22,'Offaly',false,'EirGrid connected generators'),
  ('knockacummer','Knockacummer Wind Farm','wind',100,'Ligar',52.17,-9.17,'Cork',false,'EirGrid connected generators'),
  ('sliabh-bawn','Sliabh Bawn Wind Farm','wind',64,'Bord na Móna / Coillte',53.7,-8.02,'Roscommon',false,'EirGrid connected generators'),
  ('arklow-bank','Arklow Bank','wind',25,'SSE Renewables',52.8,-5.9,'Offshore (Wicklow)',true,'EirGrid connected generators'),
  ('millvale','Millvale Solar Farm','solar',40,'Statkraft',52.85,-6.7,'Wicklow',true,'EirGrid connected generators'),
  ('gorey-solar','Gorey Solar Farm','solar',35,'NTR',52.674,-6.293,'Wexford',false,'EirGrid connected generators'),
  ('ardnacrusha','Ardnacrusha','hydro',86,'ESB',52.706,-8.605,'Clare',true,'EirGrid connected generators'),
  ('turlough-hill','Turlough Hill (pumped storage)','hydro',292,'ESB',53.078,-6.336,'Wicklow',true,'EirGrid connected generators'),
  ('erne','Erne Scheme','hydro',65,'ESB',54.5,-8.23,'Donegal',false,'EirGrid connected generators'),
  ('ewic','East-West Interconnector','imports',500,'EirGrid',53.48,-6.15,'Dublin (to GB)',true,'EirGrid connected generators')
on conflict (id) do nothing;

insert into dispatch_down_actuals (year,region,source,gwh,curtailment_gwh,constraint_gwh,notes) values
  (2022,'ROI','EirGrid Annual Renewable Energy Constraint & Curtailment Report 2022',1350,900,450,'Seed figures — replace with exact report values on import.'),
  (2023,'ROI','EirGrid Annual Renewable Energy Constraint & Curtailment Report 2023',2100,1450,650,'Seed figures — replace with exact report values on import.'),
  (2024,'ROI','EirGrid Annual Renewable Energy Constraint & Curtailment Report 2024',3100,2250,850,'Seed figures — replace with exact report values on import.')
on conflict (year,region) do nothing;

-- Mining + cost assumptions (§7.4). Editable in /admin/assumptions.
insert into assumptions (key, value, unit) values
  ('efficiency_j_per_th', 17.5, 'J/TH'),
  ('uptime_factor', 0.9, 'ratio'),
  ('pool_fee', 0.015, 'ratio'),
  ('block_reward_btc', 3.125, 'BTC'),
  ('n_billpayers', 2200000, 'accounts'),
  ('n_people', 5300000, 'people'),
  ('n_households', 2100000, 'households'),
  ('sell_share_monthly', 0.5, 'ratio'),
  ('compensation_price_eur_per_mwh', 75, 'EUR/MWh'),
  ('wholesale_ref_eur_per_mwh', 95, 'EUR/MWh')
on conflict (key) do nothing;

-- Forecast configuration (§7.5). Editable in /admin/assumptions.
insert into forecast_config (key, value, unit) values
  ('start_year', 2026, 'year'),
  ('end_year', 2046, 'year'),
  ('capacity_factor', 0.3, 'ratio'),
  ('demand_start_gwh', 35000, 'GWh'),
  ('demand_growth', 0.02, 'ratio'),
  ('curtailment_base_rate', 0.14, 'ratio'),
  ('curtailment_ref_capacity_gw', 6, 'GW'),
  ('curtailment_slope_per_gw', 0.008, 'ratio/GW'),
  ('curtailment_max_rate', 0.5, 'ratio'),
  ('mining_absorbed_share', 0.6, 'ratio')
on conflict (key) do nothing;
