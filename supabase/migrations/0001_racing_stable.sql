-- Racing Stable for Claude Code: the trainer's office in one database.
-- Horses, owners and their shares, where every horse is, treatments and the stand-downs they cause,
-- nominations and acceptances, trackwork, charges, the monthly owner billing run, owner updates.
-- Times are wall-clock times at the stable (settings.zone), stored without a zone.
-- Works on Postgres and PGlite: no extensions.

create table settings (
  key text primary key,
  value text not null,
  note text
);

create or replace function touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create or replace function setting(k text) returns text language sql stable as $$
  select value from settings where key = k
$$;

-- Now, on the stable's own clock.
create or replace function local_now() returns timestamp language sql stable as $$
  select (now() at time zone coalesce(setting('zone'), 'Australia/Melbourne'))::timestamp
$$;
create or replace function local_today() returns date language sql stable as $$
  select local_now()::date
$$;

-- Thoroughbreds age on 1 August in Australia and New Zealand. The season a date falls in:
create or replace function season_year(d date) returns int language sql immutable as $$
  select case when extract(month from d) >= 8 then extract(year from d)::int else extract(year from d)::int - 1 end
$$;
create or replace function dollars(c numeric) returns text language sql immutable as $$
  select case when c is null then null when c < 0 then '-$' || to_char(-c / 100.0, 'FM999,999,990.00') else '$' || to_char(c / 100.0, 'FM999,999,990.00') end
$$;
create or replace function horse_age(foaled date, d date) returns int language sql immutable as $$
  select case when foaled is null then null else season_year(d) - season_year(foaled) end
$$;

create table premises (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  kind text not null check (kind in ('stable', 'pre-training', 'spelling')),
  address text,
  daily_rate_cents bigint not null default 0 check (daily_rate_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger premises_touch before update on premises for each row execute function touch();

create table staff (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  role text not null check (role in ('trainer', 'foreman', 'vet', 'farrier', 'strapper', 'rider', 'office')),
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger staff_touch before update on staff for each row execute function touch();

create table owners (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  kind text not null default 'person' check (kind in ('person', 'syndicate', 'company')),
  email text,
  phone text,
  external_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger owners_touch before update on owners for each row execute function touch();

create table horses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  sex text not null check (sex in ('colt', 'filly', 'gelding', 'mare', 'horse')),
  foaled_on date,
  colour text,
  sire text,
  dam text,
  external_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger horses_touch before update on horses for each row execute function touch();

-- Who owns what share of a horse, and from when. A sale closes one row and opens another.
create table shares (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references horses(id),
  owner_id uuid not null references owners(id),
  percent numeric(5,2) not null check (percent > 0 and percent <= 100),
  from_on date not null,
  to_on date,
  created_at timestamptz not null default now(),
  check (to_on is null or to_on >= from_on)
);
create index shares_horse on shares(horse_id);

-- Every time a horse joins, leaves or moves between premises. premises_id null means it left the stable.
-- AR 296(2): the Stable Return amendment is lodged immediately; return_lodged_at records when it was.
create table movements (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  horse_id uuid not null references horses(id),
  premises_id uuid references premises(id),
  moved_at timestamp not null,
  reason text,
  return_lodged_at timestamp,
  return_reference text,
  recorded_by text,
  created_at timestamptz not null default now()
);
create index movements_horse on movements(horse_id, moved_at);

-- AR 104: every medication or treatment, recorded by midnight on the day it was given.
create table treatments (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  horse_id uuid not null references horses(id),
  given_at timestamp not null,
  recorded_at timestamp not null,
  kind text not null check (kind in ('medication', 'vaccine', 'intra-synovial', 'shockwave', 'bisphosphonate', 'stomach-tube', 'other-treatment')),
  product text not null,
  route text check (route in ('injection', 'stomach-tube', 'oral', 'topical', 'inhalation', 'other')),
  amount text,
  duration text,
  given_by text,
  authorised_by text,
  reason text,
  withhold_days int check (withhold_days >= 0),
  external_id text unique,
  created_at timestamptz not null default now()
);
create index treatments_horse on treatments(horse_id, given_at);

create table races (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  horse_id uuid not null references horses(id),
  race_date date not null,
  venue text not null,
  race_no int,
  race_name text,
  distance_m int,
  noms_close_at timestamp,
  acceptances_at timestamp,
  status text not null default 'planned' check (status in ('planned', 'nominated', 'accepted', 'scratched', 'ran')),
  jockey text,
  finish int,
  prizemoney_cents bigint not null default 0 check (prizemoney_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger races_touch before update on races for each row execute function touch();
create index races_horse on races(horse_id, race_date);

create table trackwork (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references horses(id),
  on_date date not null,
  kind text not null check (kind in ('walk', 'trot', 'canter', 'gallop', 'swim', 'jump-out', 'trial')),
  distance_m int,
  time_text text,
  rider text,
  note text,
  created_at timestamptz not null default now()
);
create index trackwork_horse on trackwork(horse_id, on_date);

-- Costs passed on to the owners of a horse, split by their shares on the day: vet, farrier, transport, fees.
create table charges (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  horse_id uuid not null references horses(id),
  on_date date not null,
  kind text not null check (kind in ('vet', 'farrier', 'dentist', 'transport', 'nomination', 'acceptance', 'gear', 'other')),
  description text not null,
  amount_cents bigint not null check (amount_cents > 0),
  gst boolean not null default true,
  billed_month date,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  owner_id uuid not null references owners(id),
  month date not null,
  issued_on date not null,
  due_on date not null,
  subtotal_cents bigint not null,
  gst_cents bigint not null,
  total_cents bigint not null,
  paid_cents bigint not null default 0,
  paid_on date,
  created_at timestamptz not null default now(),
  unique (owner_id, month)
);

create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  horse_id uuid not null references horses(id),
  kind text not null check (kind in ('fee', 'charge')),
  description text not null,
  days int,
  percent numeric(5,2) not null,
  gst boolean not null,
  amount_cents bigint not null,
  charge_id uuid references charges(id)
);

create table owner_updates (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references horses(id),
  sent_on date not null,
  by_name text,
  summary text,
  created_at timestamptz not null default now()
);

create table activity (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  ref text,
  detail text
);

-- ------------------------------------------------------------------ the rules

-- Clear days a horse must sit out after each kind of treatment before it may race, trial or jump out.
-- Eligible again on the day after the last clear day: given day + clear days + 1.
create or replace function clear_days(kind text) returns int language sql immutable as $$
  select case kind
    when 'shockwave' then 7        -- AR 86
    when 'intra-synovial' then 8   -- AR 87
    when 'vaccine' then 5          -- AR 88 (races)
    when 'bisphosphonate' then 30  -- AR 88AA (4 years and older)
    when 'stomach-tube' then 1     -- AR 255: not on race day or the 1 clear day before
    when 'medication' then 0       -- AR 249: no medication on race day before the race
    else null end
$$;
create or replace function stand_down_rule(kind text) returns text language sql immutable as $$
  select case kind
    when 'shockwave' then 'AR 86: 7 clear days'
    when 'intra-synovial' then 'AR 87: 8 clear days'
    when 'vaccine' then 'AR 88: 5 clear days'
    when 'bisphosphonate' then 'AR 88AA: 30 clear days'
    when 'stomach-tube' then 'AR 255: 1 clear day'
    when 'medication' then 'AR 249: not on race day'
    else null end
$$;

create view v_treatments as
select t.id, t.ref, t.horse_id, h.code as horse_code, h.name as horse,
  to_char(t.given_at, 'YYYY-MM-DD HH24:MI') as given_local, t.given_at,
  to_char(t.recorded_at, 'YYYY-MM-DD HH24:MI') as recorded_local, t.recorded_at,
  t.kind, t.product, t.route, t.amount, t.duration, t.given_by, t.authorised_by, t.reason, t.withhold_days,
  horse_age(h.foaled_on, t.given_at::date) as age_at_treatment,
  (t.kind = 'bisphosphonate' and horse_age(h.foaled_on, t.given_at::date) < 4) as under_four_bisphosphonate,
  greatest(
    case
      when t.kind = 'bisphosphonate' and horse_age(h.foaled_on, t.given_at::date) < 4
        then greatest((t.given_at::date + interval '12 months')::date, make_date(season_year(h.foaled_on) + 4, 8, 1))
      when clear_days(t.kind) is not null then t.given_at::date + clear_days(t.kind) + 1
      else t.given_at::date
    end,
    case when t.withhold_days is not null then t.given_at::date + t.withhold_days + 1 else t.given_at::date end
  ) as eligible_on,
  case when t.kind = 'bisphosphonate' and horse_age(h.foaled_on, t.given_at::date) < 4 then 'AR 88A: under 4, 12 months and not before 1 August of the year it turns 4'
       else stand_down_rule(t.kind) end as rule,
  case
    when t.recorded_at >= (t.given_at::date + 1)::timestamp then 'late'
    when t.route is null or t.reason is null or t.given_by is null then 'incomplete'
    else 'on time' end as record_standing
from treatments t join horses h on h.id = t.horse_id;

-- Where every horse is now: the latest movement.
create view v_location as
select distinct on (h.id) h.id as horse_id, m.premises_id, p.code as premises, p.name as premises_name,
  coalesce(p.kind, case when m.id is null then 'not arrived' else 'left' end) as kind,
  m.moved_at::date as since
from horses h
left join movements m on m.horse_id = h.id and m.moved_at <= local_now()
left join premises p on p.id = m.premises_id
order by h.id, m.moved_at desc nulls last;

create view v_shares_now as
select h.id as horse_id, coalesce(sum(s.percent), 0)::numeric(6,2) as percent, count(s.id)::int as owners
from horses h left join shares s on s.horse_id = h.id and s.from_on <= local_today() and (s.to_on is null or s.to_on >= local_today())
group by h.id;

create view v_horses as
select h.id, h.code, h.name, h.sex, horse_age(h.foaled_on, local_today()) as age,
  case l.kind when 'stable' then 'in work' else l.kind end as status, l.premises, l.premises_name, l.since,
  (local_today() - l.since) as days_there,
  sn.owners, sn.percent as shares_percent,
  (select max(eligible_on) from v_treatments t where t.horse_id = h.id and t.eligible_on > local_today()) as stood_down_until,
  (select max(on_date) from trackwork w where w.horse_id = h.id and w.kind in ('gallop', 'jump-out', 'trial')) as last_fast_work,
  (select min(r.race_date) from races r where r.horse_id = h.id and r.status in ('planned', 'nominated', 'accepted') and r.race_date >= local_today()) as next_race,
  (select max(sent_on) from owner_updates u where u.horse_id = h.id) as last_update
from horses h join v_location l on l.horse_id = h.id join v_shares_now sn on sn.horse_id = h.id;

create view v_movements as
select m.id, m.ref, m.horse_id, h.name as horse, to_char(m.moved_at, 'YYYY-MM-DD HH24:MI') as moved_local, m.moved_at,
  coalesce(p.name, 'Left the stable') as moved_to, p.kind, m.reason,
  to_char(m.return_lodged_at, 'YYYY-MM-DD HH24:MI') as return_lodged, m.return_reference,
  case when m.return_lodged_at is not null then 'lodged'
       when m.moved_at > local_now() then 'planned'
       when local_now() - m.moved_at > make_interval(hours => coalesce(setting('return_hours'), '24')::int) then 'overdue'
       else 'pending' end as return_standing,
  round(extract(epoch from (coalesce(m.return_lodged_at, local_now()) - m.moved_at)) / 3600.0, 1) as hours_to_lodge
from movements m join horses h on h.id = m.horse_id left join premises p on p.id = m.premises_id;

create view v_races as
select r.id, r.ref, r.horse_id, h.name as horse, r.race_date, r.venue, r.race_no, r.race_name, r.distance_m,
  to_char(r.noms_close_at, 'YYYY-MM-DD HH24:MI') as noms_close, r.noms_close_at,
  to_char(r.acceptances_at, 'YYYY-MM-DD HH24:MI') as acceptances, r.acceptances_at,
  r.status, r.jockey, r.finish, r.prizemoney_cents,
  (select max(t.eligible_on) from v_treatments t where t.horse_id = r.horse_id and t.given_at::date <= r.race_date) as eligible_on,
  (select string_agg(t.ref || ' ' || t.product || ' (' || t.rule || ', eligible ' || t.eligible_on || ')', '; ' order by t.given_at)
     from v_treatments t where t.horse_id = r.horse_id and t.given_at::date <= r.race_date and t.eligible_on > r.race_date) as clash,
  (select count(*) from movements m where m.horse_id = r.horse_id and m.return_lodged_at is null and m.moved_at <= local_now())::int as returns_pending,
  (select max(on_date) from trackwork w where w.horse_id = r.horse_id and w.kind in ('gallop', 'jump-out', 'trial') and w.on_date <= r.race_date) as last_fast_work,
  (select l.kind from v_location l where l.horse_id = r.horse_id) as location
from races r join horses h on h.id = r.horse_id;

create view v_invoices as
select i.id, i.number, i.owner_id, o.code as owner_code, o.name as owner, to_char(i.month, 'YYYY-MM') as month, i.issued_on, i.due_on,
  i.subtotal_cents, i.gst_cents, i.total_cents, i.paid_cents, i.paid_on, (i.total_cents - i.paid_cents) as owing_cents,
  case when i.total_cents - i.paid_cents <= 0 then 0 else greatest(local_today() - i.due_on, 0) end as days_overdue
from invoices i join owners o on o.id = i.owner_id;

-- Everything that needs a person, most serious first.
create view v_attention as
select 1 as rank, 'race clash' as item, ref, horse || ' ' || venue || ' ' || race_date || ' (' || status || '): ' || clash as detail
  from v_races where status in ('nominated', 'accepted') and clash is not null and race_date >= local_today()
union all
select 1, 'under-4 bisphosphonate', ref, horse || ': ' || product || ' given ' || given_local || ' at age ' || age_at_treatment
  from v_treatments where under_four_bisphosphonate
union all
select 2, 'stable return overdue', ref, horse || ' to ' || moved_to || ' on ' || moved_local || ', not lodged'
  from v_movements where return_standing = 'overdue'
union all
select 2, 'treatment recorded late', ref, horse || ': ' || product || ' given ' || given_local || ', recorded ' || recorded_local
  from v_treatments where record_standing = 'late' and given_at > local_now() - interval '2 years'
union all
select 3, 'treatment record incomplete', ref, horse || ': ' || product || ' missing ' ||
    concat_ws(', ', case when route is null then 'route' end, case when reason is null then 'reason' end, case when given_by is null then 'who gave it' end)
  from v_treatments where record_standing = 'incomplete' and given_at > local_now() - interval '2 years'
union all
select 3, 'acceptances close soon', ref, horse || ' ' || venue || ' ' || race_date || ' R' || coalesce(race_no::text, '?') || ', acceptances ' || acceptances
  from v_races where status = 'nominated' and acceptances_at between local_now() and local_now() + interval '48 hours'
union all
select 3, 'nominations close soon', ref, horse || ' ' || venue || ' ' || race_date || ', nominations close ' || noms_close
  from v_races where status = 'planned' and noms_close_at between local_now() and local_now() + interval '72 hours'
union all
select 3, 'no fast work before race', ref, horse || ' ' || venue || ' ' || race_date || ', last fast work ' || coalesce(last_fast_work::text, 'never')
  from v_races where status in ('nominated', 'accepted') and race_date >= local_today()
    and (last_fast_work is null or race_date - last_fast_work > coalesce(setting('work_gap_days'), '14')::int)
union all
select 4, 'invoice overdue', number, owner || ' owes ' || dollars(owing_cents) || ', ' || days_overdue || ' days late'
  from v_invoices where owing_cents > 0 and days_overdue > 0
union all
select 4, 'shares not 100%', code, name || ': owners hold ' || shares_percent || '%'
  from v_horses where status <> 'left' and shares_percent <> 100
union all
select 5, 'owner update due', code, name || ': last update ' || coalesce(last_update::text, 'never')
  from v_horses where status <> 'left' and (last_update is null or local_today() - last_update > coalesce(setting('update_days'), '14')::int)
union all
select 5, 'charges not billed', h.code, h.name || ': ' || count(*) || case when count(*) = 1 then ' charge' else ' charges' end || ' from before this month, ' || dollars(sum(c.amount_cents))
  from charges c join horses h on h.id = c.horse_id where c.billed_month is null and c.on_date < date_trunc('month', local_today())::date group by h.code, h.name
union all
select 6, 'long spell', code, name || ' at ' || premises_name || ' for ' || days_there || ' days'
  from v_horses where status = 'spelling' and days_there > coalesce(setting('spell_days'), '90')::int;

-- ------------------------------------------------------------------ the monthly owner billing run

-- Every line owed for a month: daily fees for the days each horse spent at each premises,
-- and every unbilled charge up to the month's end, each split by the shares held on the day.
create or replace function billing_lines(m date)
returns table (owner_id uuid, horse_id uuid, kind text, description text, days int, percent numeric, gst boolean, amount_cents bigint, charge_id uuid)
language sql stable as $$
  with days as (
    select generate_series(m, (m + interval '1 month' - interval '1 day')::date, interval '1 day')::date as d
  ), loc as (
    select h.id as horse_id, days.d,
      (select mv.premises_id from movements mv where mv.horse_id = h.id and mv.moved_at::date <= days.d order by mv.moved_at desc limit 1) as premises_id
    from horses h cross join days
  ), fee as (
    select l.horse_id, l.d, p.id as premises_id, p.name, p.kind, p.daily_rate_cents as rate
    from loc l join premises p on p.id = l.premises_id where p.daily_rate_cents > 0
  )
  select s.owner_id, f.horse_id, 'fee',
    (case f.kind when 'stable' then 'Training fee' when 'pre-training' then 'Pre-training' else 'Agistment' end)
      || ' at ' || f.name || ', ' || count(*) || ' days at $' || to_char(f.rate / 100.0, 'FM999,990.00') || ' a day',
    count(*)::int, s.percent, true, round(sum(f.rate * s.percent / 100))::bigint, null::uuid
  from fee f join shares s on s.horse_id = f.horse_id and s.from_on <= f.d and (s.to_on is null or s.to_on >= f.d)
  group by s.owner_id, f.horse_id, f.premises_id, f.name, f.kind, f.rate, s.percent
  union all
  select s.owner_id, c.horse_id, 'charge', c.ref || ' ' || initcap(c.kind) || ', ' || c.on_date || ': ' || c.description,
    null::int, s.percent, c.gst, round(c.amount_cents * s.percent / 100)::bigint, c.id
  from charges c join shares s on s.horse_id = c.horse_id and s.from_on <= c.on_date and (s.to_on is null or s.to_on >= c.on_date)
  where c.billed_month is null and c.on_date < (m + interval '1 month')::date
$$;

-- Bill a month: one invoice per owner, GST added at settings.gst_bps, charges marked billed. Refuses a month twice.
create or replace function bill_month(m date, issued date) returns int language plpgsql as $$
declare
  o record;
  inv uuid;
  n int := 0;
  num int;
  bps int := coalesce(setting('gst_bps'), '1000')::int;
  due int := coalesce(setting('invoice_days'), '14')::int;
begin
  if m <> date_trunc('month', m)::date then raise exception 'Bill a whole month: give its first day'; end if;
  if exists (select 1 from invoices where month = m) then raise exception 'Owners are already billed for %', to_char(m, 'YYYY-MM'); end if;
  create temp table _lines as select * from billing_lines(m);
  select coalesce(max(substring(number from 5)::int), 0) into num from invoices where number ~ '^INV-[0-9]+$';
  for o in select l.owner_id, sum(l.amount_cents) as sub, round(sum(case when l.gst then l.amount_cents else 0 end) * bps / 10000.0)::bigint as tax
           from _lines l join owners ow on ow.id = l.owner_id group by l.owner_id, ow.code order by ow.code loop
    num := num + 1;
    insert into invoices (number, owner_id, month, issued_on, due_on, subtotal_cents, gst_cents, total_cents)
      values ('INV-' || lpad(num::text, 4, '0'), o.owner_id, m, issued, issued + due, o.sub, o.tax, o.sub + o.tax) returning id into inv;
    insert into invoice_lines (invoice_id, horse_id, kind, description, days, percent, gst, amount_cents, charge_id)
      select inv, l.horse_id, l.kind, l.description, l.days, l.percent, l.gst, l.amount_cents, l.charge_id from _lines l where l.owner_id = o.owner_id;
    n := n + 1;
  end loop;
  update charges set billed_month = m where id in (select l.charge_id from _lines l where l.charge_id is not null);
  drop table _lines;
  return n;
end $$;

-- The database is for the trainer's office. Lock it down when you put it on a shared Postgres.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = current_schema() and tablename <> 'schema_migrations' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
