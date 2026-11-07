// The rules of the trainer's office. scripts/stable.mjs is a thin shell over run().
// Every write names an actor and leaves a row in the append-only activity log.
// Times are wall-clock times at the stable (settings.zone): "2026-11-09 06:30" means 6:30 am at the stable.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './db.mjs';
import { parseCsv, pick } from './csv.mjs';

export const today = () => new Date().toISOString().slice(0, 10);

export function date(v, label) {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw Error(`--${label} must be a date (YYYY-MM-DD)`);
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) throw Error(`--${label} must be a date (YYYY-MM-DD)`);
  return s;
}

// "2026-11-09 06:30" (or with a T) -> "2026-11-09 06:30:00", a wall-clock time at the stable.
export function stamp(v, label) {
  const s = String(v ?? '').trim().replace('T', ' ');
  const m = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{1,2}):(\d{2})(?::00)?$/);
  if (!m) throw Error(`--${label} must be a date and time like 2026-11-09 06:30`);
  date(m[1], label);
  const h = Number(m[2]);
  if (h > 23 || Number(m[3]) > 59) throw Error(`--${label} has an impossible time`);
  return `${m[1]} ${String(h).padStart(2, '0')}:${m[3]}:00`;
}

export function month(v, label) {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) throw Error(`--${label} must be a month like 2026-10`);
  return `${s}-01`;
}

// "$1,250.50", "1250.5" or "1250" -> 125050 cents.
export function cents(v, label) {
  const s = String(v ?? '').trim().replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw Error(`--${label} must be an amount in dollars, like 180 or 1,250.50`);
  return Math.round(Number(s) * 100);
}

export function percent(v, label) {
  const s = String(v ?? '').trim().replace(/%$/, '');
  const n = Number(s);
  if (!/^\d+(\.\d{1,2})?$/.test(s) || n <= 0 || n > 100) throw Error(`--${label} must be a share from 0.01 to 100`);
  return n;
}

function int(v, label, min = 0, max = 100000) {
  const n = Number(v);
  if (v === undefined || v === true || !Number.isInteger(n) || n < min || n > max) throw Error(`--${label} must be a whole number from ${min} to ${max}`);
  return n;
}
function need(flags, ...keys) {
  for (const k of keys) if (flags[k] === undefined || flags[k] === true || String(flags[k]).trim() === '') throw Error(`--${k} is required`);
}
function oneOf(v, allowed, label) {
  if (!allowed.includes(v)) throw Error(`--${label} must be one of: ${allowed.join(', ')}`);
  return v;
}
const text = (v) => (v === undefined || v === true ? null : String(v).trim() || null);

export const SEXES = ['colt', 'filly', 'gelding', 'mare', 'horse'];
export const TREATMENT_KINDS = ['medication', 'vaccine', 'intra-synovial', 'shockwave', 'bisphosphonate', 'stomach-tube', 'other-treatment'];
export const ROUTES = ['injection', 'stomach-tube', 'oral', 'topical', 'inhalation', 'other'];
export const WORK = ['walk', 'trot', 'canter', 'gallop', 'swim', 'jump-out', 'trial'];
export const CHARGE_KINDS = ['vet', 'farrier', 'dentist', 'transport', 'nomination', 'acceptance', 'gear', 'other'];
export const PREMISES_KINDS = ['stable', 'pre-training', 'spelling'];

async function tx(db, fn) {
  await db.exec('begin');
  try { const r = await fn(); await db.exec('commit'); return r; } catch (e) { await db.exec('rollback'); throw e; }
}
async function log(db, actor, action, ref, detail) {
  await db.query('insert into activity (actor, action, ref, detail) values ($1,$2,$3,$4)', [actor, action, ref, detail]);
}
function actorOf(flags) {
  need(flags, 'actor');
  return String(flags.actor).trim();
}
const one = async (db, sql, p = []) => (await db.query(sql, p))[0];
const nowLocal = async (db) => (await one(db, `select to_char(local_now(), 'YYYY-MM-DD HH24:MI:SS') as n, local_today()::text as d`));

// Resolve one record from a code, reference, id prefix or name. Exact (case-insensitive) beats
// partial; more than one partial match lists the candidates and fails.
function choose(rows, term, what, label) {
  const t = String(term ?? '').trim().toLowerCase();
  if (!t || t === 'true') throw Error(`Name the ${what.toLowerCase()}`);
  const exact = rows.filter((r) => label(r).some((x) => x && String(x).toLowerCase() === t));
  if (exact.length === 1) return exact[0];
  const partial = exact.length ? exact : rows.filter((r) => label(r).some((x) => x && String(x).toLowerCase().includes(t)));
  if (partial.length === 1) return partial[0];
  if (!partial.length) throw Error(`${what} "${term}" not found`);
  throw Error(`"${term}" is ambiguous: ${partial.map((r) => label(r).filter(Boolean).slice(0, 2).join(' / ')).join('; ')}`);
}
export const horse = async (db, term) => choose(await db.query('select * from horses order by code'), term, 'Horse', (r) => [r.code, r.name, r.id]);
export const owner = async (db, term) => choose(await db.query('select * from owners order by code'), term, 'Owner', (r) => [r.code, r.name, r.email, r.id]);
const premisesOf = async (db, term) => choose(await db.query('select * from premises order by code'), term, 'Premises', (r) => [r.code, r.name, r.id]);
const race = async (db, term) => choose(await db.query('select * from v_races order by ref'), term, 'Race', (r) => [r.ref, r.id]);
const invoice = async (db, term) => choose(await db.query('select * from v_invoices order by number'), term, 'Invoice', (r) => [r.number, r.id]);

async function nextRef(db, table, col, prefix, width) {
  const rows = await db.query(`select ${col} as ref from ${table} where ${col} ~ $1`, [`^${prefix}\\d+$`]);
  const n = rows.reduce((m, r) => Math.max(m, Number(r.ref.slice(prefix.length))), 0) + 1;
  return `${prefix}${String(n).padStart(width, '0')}`;
}

function draftFile(name, body) {
  const dir = path.join(process.env.OUTPUT_DIR || REPO_ROOT, 'drafts');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  writeFileSync(file, body);
  return path.relative(process.env.OUTPUT_DIR || REPO_ROOT, file).replace(/\\/g, '/');
}
const mdTable = (rows) => {
  if (!rows.length) return '(none)\n';
  const keys = Object.keys(rows[0]);
  const cell = (v) => String(v ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
  return `| ${keys.join(' | ')} |\n| ${keys.map(() => '---').join(' | ')} |\n${rows.map((r) => `| ${keys.map((k) => cell(r[k])).join(' | ')} |`).join('\n')}\n`;
};

// ------------------------------------------------------------------ reads

export const reads = {
  async attention(db) {
    return db.query('select item, ref, detail from v_attention order by rank, item, ref');
  },

  async compliance(db) {
    const q = async (sql) => one(db, sql);
    const rules = [
      { rule: 'No horse entered or started inside a treatment stand-down', source: 'Australian Rules of Racing AR 86, AR 87, AR 88, AR 88AA, AR 249, AR 255',
        breach: await q(`select count(*)::int as n, min(ref || ' ' || horse || ' ' || race_date) as ex from v_races where status in ('nominated', 'accepted') and clash is not null and race_date >= local_today()`),
        due: await q(`select count(*)::int as n, min(code || ' ' || name || ' stood down until ' || stood_down_until) as ex from v_horses where stood_down_until is not null`) },
      { rule: 'No bisphosphonate given to a horse under 4', source: 'AR 88A(2)',
        breach: await q(`select count(*)::int as n, min(ref || ' ' || horse) as ex from v_treatments where under_four_bisphosphonate`),
        due: { n: 0 } },
      { rule: 'Every treatment recorded by midnight on the day it was given, kept 2 years', source: 'AR 104(1), (2) and (5)',
        breach: await q(`select count(*)::int as n, min(ref || ' ' || horse || ' recorded ' || recorded_local) as ex from v_treatments where record_standing = 'late' and given_at > local_now() - interval '2 years'`),
        due: await q(`select count(*)::int as n, min(ref || ' ' || horse) as ex from v_treatments where record_standing = 'incomplete' and given_at > local_now() - interval '2 years'`) },
      { rule: 'Stable Return amended immediately when a horse joins, leaves or moves', source: 'AR 296(2) and (3); house rule return_hours',
        breach: await q(`select count(*)::int as n, min(ref || ' ' || horse || ' to ' || moved_to) as ex from v_movements where return_standing = 'overdue'`),
        due: await q(`select count(*)::int as n, min(ref || ' ' || horse || ' to ' || moved_to) as ex from v_movements where return_standing = 'pending'`) },
      { rule: 'A Stable Return lodged before a horse is entered', source: 'AR 103(2)',
        breach: await q(`select count(*)::int as n, min(ref || ' ' || horse) as ex from v_races where status in ('nominated', 'accepted') and returns_pending > 0 and race_date >= local_today()`),
        due: { n: 0 } },
      { rule: 'A horse entered for a race stabled at the licensed premises', source: 'AR 296(4)(a)',
        breach: await q(`select count(*)::int as n, min(ref || ' ' || horse || ' at ' || location) as ex from v_races where status in ('nominated', 'accepted') and race_date >= local_today() and location <> 'stable'`),
        due: { n: 0 } },
      { rule: 'Owners billed for what was spent on their horse, by their share (house rules)', source: 'Your training agreement; settings invoice_days',
        breach: await q(`select count(*)::int as n, min(item || ' ' || ref) as ex from v_attention where item in ('shares not 100%')`),
        due: await q(`select count(*)::int as n, min(item || ' ' || ref) as ex from v_attention where item in ('invoice overdue', 'charges not billed')`) },
    ];
    const rows = rules.map((r) => ({ standing: r.breach.n ? 'breach' : r.due.n ? 'to fix' : 'clean', rule: r.rule, count: r.breach.n || r.due.n, example: (r.breach.n ? r.breach.ex : r.due.ex) || '', source: r.source }));
    const order = { breach: 0, 'to fix': 1, clean: 2 };
    return rows.sort((a, b) => order[a.standing] - order[b.standing]);
  },

  async horses(db, args, f = {}) {
    return db.query(`select code, name, sex, age, status, premises, since, owners, shares_percent as shares, stood_down_until, last_fast_work, next_race, last_update
      from v_horses ${f.all ? '' : `where status <> 'left'`} order by case status when 'in work' then 0 when 'pre-training' then 1 when 'spelling' then 2 else 3 end, name`);
  },

  async horse(db, args) {
    const h = await horse(db, args[0]);
    return {
      horse: await one(db, `select code, name, sex, age, status, premises, since, days_there, stood_down_until, last_fast_work, next_race, last_update from v_horses where id = $1`, [h.id]),
      breeding: { foaled: h.foaled_on, colour: h.colour, sire: h.sire, dam: h.dam },
      owners: await db.query(`select o.code, o.name, s.percent, s.from_on from shares s join owners o on o.id = s.owner_id
        where s.horse_id = $1 and s.from_on <= local_today() and (s.to_on is null or s.to_on >= local_today()) order by s.percent desc, o.name`, [h.id]),
      treatments: await db.query(`select ref, given_local as given, kind, product, eligible_on, record_standing as record from v_treatments where horse_id = $1 order by given_at desc limit 10`, [h.id]),
      races: await db.query(`select ref, race_date, venue, race_no, distance_m, status, finish, dollars(prizemoney_cents) as prizemoney, clash from v_races where horse_id = $1 order by race_date desc`, [h.id]),
      trackwork: await db.query(`select on_date, kind, distance_m, time_text as time, rider, note from trackwork where horse_id = $1 order by on_date desc limit 8`, [h.id]),
      movements: await db.query(`select ref, moved_local as moved, moved_to, return_standing, return_reference from v_movements where horse_id = $1 order by moved_at desc`, [h.id]),
    };
  },

  async owners(db) {
    return db.query(`select o.code, o.name, o.kind, o.email,
        (select string_agg(h.name || ' ' || s.percent || '%', ', ' order by h.name) from shares s join horses h on h.id = s.horse_id
          join v_horses vh on vh.id = h.id
          where s.owner_id = o.id and s.from_on <= local_today() and (s.to_on is null or s.to_on >= local_today()) and vh.status <> 'left') as horses,
        dollars(coalesce((select sum(owing_cents) from v_invoices i where i.owner_id = o.id), 0)) as owing
      from owners o order by o.name`);
  },

  async owner(db, args) {
    const o = await owner(db, args[0]);
    return {
      owner: { code: o.code, name: o.name, kind: o.kind, email: o.email, phone: o.phone },
      horses: await db.query(`select h.code, h.name, s.percent, s.from_on, s.to_on from shares s join horses h on h.id = s.horse_id where s.owner_id = $1 order by s.to_on nulls first, h.name`, [o.id]),
      invoices: await db.query(`select number, month, issued_on, due_on, dollars(total_cents) as total, dollars(owing_cents) as owing, days_overdue, paid_on from v_invoices where owner_id = $1 order by month desc`, [o.id]),
    };
  },

  async premises(db) {
    return db.query(`select p.code, p.name, p.kind, dollars(p.daily_rate_cents) as daily_rate, p.address,
      (select count(*) from v_location l where l.premises_id = p.id)::int as horses_now from premises p order by p.kind, p.code`);
  },

  async staff(db) {
    return db.query(`select code, name, role, email, active from staff order by active desc, role, name`);
  },

  async treatments(db, args, f = {}) {
    const p = [int(f.days ?? 30, 'days', 1, 3650)];
    let where = `given_at > local_now() - make_interval(days => $1)`;
    if (f.horse) { p.push((await horse(db, f.horse)).id); where += ` and horse_id = $${p.length}`; }
    return db.query(`select ref, horse, given_local as given, kind, product, route, amount, given_by, reason, eligible_on, rule, record_standing as record, recorded_local as recorded
      from v_treatments where ${where} order by given_at desc`, p);
  },

  async 'stand-downs'(db) {
    return db.query(`select t.ref, t.horse, t.given_local as given, t.kind, t.product, t.rule, t.eligible_on,
        (select string_agg(r.ref || ' ' || r.venue || ' ' || r.race_date || ' (' || r.status || ')', '; ') from races r
          where r.horse_id = t.horse_id and r.status in ('planned', 'nominated', 'accepted') and r.race_date < t.eligible_on and r.race_date >= local_today()) as races_inside
      from v_treatments t where t.eligible_on > local_today() order by t.eligible_on desc, t.horse`);
  },

  async races(db, args, f = {}) {
    return db.query(`select ref, horse, race_date, venue, race_no as race, race_name, distance_m, status, noms_close, acceptances, jockey, eligible_on,
        case when clash is not null then 'CLASH: ' || clash when returns_pending > 0 then 'Stable Return not lodged' when location <> 'stable' then 'horse at ' || location else '' end as problem
      from v_races ${f.all ? '' : `where race_date >= local_today() and status <> 'scratched'`} order by race_date, venue, race_no`);
  },

  async movements(db, args, f = {}) {
    return db.query(`select ref, horse, moved_local as moved, moved_to, reason, return_standing, return_lodged, return_reference, hours_to_lodge
      from v_movements ${f.pending ? `where return_standing in ('pending', 'overdue')` : ''} order by moved_at desc`);
  },

  async charges(db, args, f = {}) {
    return db.query(`select c.ref, h.name as horse, c.on_date, c.kind, c.description, dollars(c.amount_cents) as amount, c.gst, to_char(c.billed_month, 'YYYY-MM') as billed
      from charges c join horses h on h.id = c.horse_id ${f.unbilled ? 'where c.billed_month is null' : ''} order by c.on_date desc`);
  },

  async invoices(db, args, f = {}) {
    const p = [];
    let where = f.owing ? 'where owing_cents > 0' : '';
    if (f.month) { p.push(month(f.month, 'month')); where += `${where ? ' and' : 'where'} month = to_char($1::date, 'YYYY-MM')`; }
    return db.query(`select number, owner, month, issued_on, due_on, dollars(subtotal_cents) as subtotal, dollars(gst_cents) as gst, dollars(total_cents) as total,
      dollars(owing_cents) as owing, days_overdue, paid_on from v_invoices ${where} order by number`, p);
  },

  async debtors(db) {
    return db.query(`select owner, count(*)::int as invoices, dollars(sum(owing_cents)) as owing,
        dollars(sum(owing_cents) filter (where days_overdue = 0)) as not_yet_due,
        dollars(sum(owing_cents) filter (where days_overdue between 1 and 30)) as late_1_30,
        dollars(sum(owing_cents) filter (where days_overdue > 30)) as late_over_30, max(days_overdue) as oldest_days
      from v_invoices where owing_cents > 0 group by owner order by sum(owing_cents) desc`);
  },

  async 'billing-preview'(db, args, f = {}) {
    need(f, 'month');
    const m = month(f.month, 'month');
    return db.query(`select o.name as owner, h.name as horse, l.kind, l.description, l.days, l.percent, dollars(l.amount_cents) as amount, l.gst
      from billing_lines($1::date) l join owners o on o.id = l.owner_id join horses h on h.id = l.horse_id order by o.name, h.name, l.kind desc, l.description`, [m]);
  },

  async activity(db, args, f = {}) {
    return db.query(`select to_char(at, 'YYYY-MM-DD HH24:MI') as at, actor, action, ref, detail from activity order by at desc limit $1`, [int(f.days ?? 30, 'days', 1, 1000)]);
  },

  async insights(db) { return insights(db); },
};

// ------------------------------------------------------------------ ten questions the vendor dashboard does not answer

export const QUESTIONS = [
  { question: 'Which horses are nominated or accepted for a race they are not eligible to run in because of a treatment?',
    sql: `select ref, horse, venue, race_date, status, eligible_on, clash from v_races where status in ('nominated', 'accepted') and clash is not null and race_date >= local_today() order by race_date` },
  { question: 'Which treatment records were written after midnight on the day the treatment was given?',
    sql: `select ref, horse, product, given_local as given, recorded_local as recorded, round(extract(epoch from (recorded_at - given_at)) / 3600.0, 1) as hours_after
          from v_treatments where record_standing = 'late' order by given_at desc` },
  { question: 'Which horses moved without the Stable Return amendment being lodged, and for how long?',
    sql: `select ref, horse, moved_to, moved_local as moved, hours_to_lodge, return_standing from v_movements where return_standing in ('pending', 'overdue') order by moved_at` },
  { question: 'What has each horse cost its owners in the last 90 days against the prizemoney it won?',
    sql: `select h.name as horse,
            dollars(coalesce((select sum(il.amount_cents) from invoice_lines il join invoices i on i.id = il.invoice_id where il.horse_id = h.id and i.month >= (local_today() - 90)), 0)
              + coalesce((select sum(c.amount_cents) from charges c where c.horse_id = h.id and c.billed_month is null and c.on_date >= local_today() - 90), 0)) as billed_and_unbilled,
            dollars(coalesce((select sum(r.prizemoney_cents) from races r where r.horse_id = h.id and r.race_date >= local_today() - 90), 0)) as prizemoney,
            (select count(*) from races r where r.horse_id = h.id and r.status = 'ran' and r.race_date >= local_today() - 90)::int as starts
          from horses h order by h.name` },
  { question: 'Which horses have owners who have not had an update in the last two weeks?',
    sql: `select code, name, status, last_update, (local_today() - last_update) as days_since, owners from v_horses
          where status <> 'left' and (last_update is null or local_today() - last_update > coalesce(setting('update_days'), '14')::int) order by last_update nulls first` },
  { question: 'How many days has each horse spent in work, pre-training and spelling this season?',
    sql: `with days as (select generate_series(make_date(season_year(local_today()), 8, 1), local_today(), interval '1 day')::date as d),
          loc as (select h.name, (select p.kind from movements mv left join premises p on p.id = mv.premises_id where mv.horse_id = h.id and mv.moved_at::date <= days.d order by mv.moved_at desc limit 1) as kind
                  from horses h cross join days)
          select name as horse, count(*) filter (where kind = 'stable')::int as in_work, count(*) filter (where kind = 'pre-training')::int as pre_training,
            count(*) filter (where kind = 'spelling')::int as spelling from loc group by name order by name` },
  { question: 'Which costs have been spent on a horse but not yet billed to its owners?',
    sql: `select c.ref, h.name as horse, c.on_date, c.kind, c.description, dollars(c.amount_cents) as amount from charges c join horses h on h.id = c.horse_id
          where c.billed_month is null order by c.on_date` },
  { question: 'Which horses have shares that do not add up to 100%, and who holds the rest?',
    sql: `select code, name, shares_percent as held, 100 - shares_percent as unaccounted, owners from v_horses where status <> 'left' and shares_percent <> 100` },
  { question: 'Which horses are entered to race with no gallop, jump-out or trial in the two weeks before?',
    sql: `select ref, horse, venue, race_date, last_fast_work, race_date - last_fast_work as days_between from v_races
          where status in ('nominated', 'accepted') and race_date >= local_today()
            and (last_fast_work is null or race_date - last_fast_work > coalesce(setting('work_gap_days'), '14')::int) order by race_date` },
  { question: 'Which owners owe money, how much, and how late?',
    sql: `select owner, number, month, dollars(owing_cents) as owing, due_on, days_overdue from v_invoices where owing_cents > 0 order by days_overdue desc, owing_cents desc` },
];

export async function insights(db) {
  const out = [];
  for (const q of QUESTIONS) out.push({ question: q.question, rows: await db.query(q.sql) });
  return out;
}

// ------------------------------------------------------------------ writes

async function eligibleOn(db, horseId, raceDate) {
  return (await one(db, `select max(eligible_on)::text as e, string_agg(ref || ' ' || product || ' (' || rule || ')', '; ') filter (where eligible_on > $2::date) as why
    from v_treatments where horse_id = $1 and given_at::date <= $2::date`, [horseId, raceDate]));
}

const writes = {
  async 'add-horse'(db, args, f) {
    const actor = actorOf(f);
    const name = String(args[0] ?? '').trim();
    if (!name) throw Error('Name the horse: add-horse "<name>" --sex=gelding --foaled=YYYY-MM-DD --at=<premises>');
    need(f, 'sex', 'at');
    return tx(db, async () => {
      const code = await nextRef(db, 'horses', 'code', 'H', 2);
      const p = await premisesOf(db, f.at);
      const [h] = await db.query(`insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [code, name, oneOf(String(f.sex).toLowerCase(), SEXES, 'sex'), f.foaled ? date(f.foaled, 'foaled') : null, text(f.colour), text(f.sire), text(f.dam)]);
      const at = f.when ? stamp(f.when, 'when') : (await nowLocal(db)).n.slice(0, 16) + ':00';
      const ref = await nextRef(db, 'movements', 'ref', 'M-', 4);
      await db.query(`insert into movements (ref, horse_id, premises_id, moved_at, reason, recorded_by) values ($1,$2,$3,$4,'Joined the stable',$5)`, [ref, h.id, p.id, at, actor]);
      await log(db, actor, 'add-horse', code, `${name} joined at ${p.name}`);
      return { horse: code, name, at: p.name, movement: ref, next: `Lodge the Stable Return (AR 296(2)(b)), then record it: lodge-return ${ref} --reference=<receipt>. Add the owners with share.` };
    });
  },

  async 'add-owner'(db, args, f) {
    const actor = actorOf(f);
    const name = String(args[0] ?? '').trim();
    if (!name) throw Error('Name the owner');
    const code = await nextRef(db, 'owners', 'code', 'O', 2);
    await db.query('insert into owners (code, name, kind, email, phone) values ($1,$2,$3,$4,$5)', [code, name, oneOf(f.kind || 'person', ['person', 'syndicate', 'company'], 'kind'), text(f.email), text(f.phone)]);
    await log(db, actor, 'add-owner', code, name);
    return { owner: code, name };
  },

  async 'add-premises'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'name', 'kind', 'rate');
    const code = String(args[0] ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,12}$/.test(code)) throw Error('Give the premises a short code, like GLEN');
    await db.query('insert into premises (code, name, kind, address, daily_rate_cents) values ($1,$2,$3,$4,$5)', [code, String(f.name).trim(), oneOf(f.kind, PREMISES_KINDS, 'kind'), text(f.address), cents(f.rate, 'rate')]);
    await log(db, actor, 'add-premises', code, `${f.name} (${f.kind}) at ${f.rate} a day`);
    return { premises: code };
  },

  async share(db, args, f) {
    const actor = actorOf(f);
    need(f, 'percent');
    const h = await horse(db, args[0]);
    const o = await owner(db, args[1]);
    const from = f.from ? date(f.from, 'from') : (await nowLocal(db)).d;
    const pct = percent(f.percent, 'percent');
    return tx(db, async () => {
      const held = Number((await one(db, `select coalesce(sum(percent), 0) as p from shares where horse_id = $1 and from_on <= $2 and (to_on is null or to_on >= $2)`, [h.id, from])).p);
      if (held + pct > 100) throw Error(`${h.name} already has ${held}% held on ${from}; adding ${pct}% would make ${held + pct}%. Use sell-share to move a share.`);
      await db.query('insert into shares (horse_id, owner_id, percent, from_on) values ($1,$2,$3,$4)', [h.id, o.id, pct, from]);
      await log(db, actor, 'share', h.code, `${o.name} ${pct}% from ${from}`);
      return { horse: h.name, owner: o.name, percent: pct, from, held_now: held + pct };
    });
  },

  async 'sell-share'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'from-owner', 'to-owner', 'percent', 'on');
    const h = await horse(db, args[0]);
    const seller = await owner(db, f['from-owner']);
    const buyer = await owner(db, f['to-owner']);
    const on = date(f.on, 'on');
    const pct = percent(f.percent, 'percent');
    return tx(db, async () => {
      const [s] = await db.query(`select * from shares where horse_id = $1 and owner_id = $2 and from_on < $3 and (to_on is null or to_on >= $3)`, [h.id, seller.id, on]);
      if (!s) throw Error(`${seller.name} holds no share of ${h.name} before ${on}`);
      if (pct > Number(s.percent)) throw Error(`${seller.name} holds ${s.percent}% of ${h.name}, not ${pct}%`);
      await db.query(`update shares set to_on = ($2::date - 1) where id = $1`, [s.id, on]);
      const rest = Math.round((Number(s.percent) - pct) * 100) / 100;
      if (rest > 0) await db.query('insert into shares (horse_id, owner_id, percent, from_on) values ($1,$2,$3,$4)', [h.id, seller.id, rest, on]);
      await db.query('insert into shares (horse_id, owner_id, percent, from_on) values ($1,$2,$3,$4)', [h.id, buyer.id, pct, on]);
      await log(db, actor, 'sell-share', h.code, `${pct}% from ${seller.name} to ${buyer.name} on ${on}`);
      return { horse: h.name, from: seller.name, to: buyer.name, percent: pct, on, seller_keeps: rest,
        next: 'Lodge the transfer with Racing Australia within 7 days, or 24 hours before the horse is entered if sooner (AR 295(2)). It cannot start until the transfer is registered (AR 295(8)).' };
    });
  },

  async move(db, args, f) {
    const actor = actorOf(f);
    need(f, 'to');
    const h = await horse(db, args[0]);
    const left = ['left', 'away', 'retired', 'sold'].includes(String(f.to).toLowerCase());
    const p = left ? null : await premisesOf(db, f.to);
    const at = f.at ? stamp(f.at, 'at') : (await nowLocal(db)).n.slice(0, 16) + ':00';
    return tx(db, async () => {
      const cur = await one(db, 'select premises_id from v_location where horse_id = $1', [h.id]);
      if ((cur?.premises_id ?? null) === (p?.id ?? null)) throw Error(`${h.name} is already ${p ? `at ${p.name}` : 'out of the stable'}`);
      const ref = await nextRef(db, 'movements', 'ref', 'M-', 4);
      await db.query('insert into movements (ref, horse_id, premises_id, moved_at, reason, recorded_by) values ($1,$2,$3,$4,$5,$6)', [ref, h.id, p?.id ?? null, at, text(f.reason), actor]);
      await log(db, actor, 'move', ref, `${h.name} to ${p ? p.name : 'out of the stable'} at ${at.slice(0, 16)}`);
      const open = await db.query(`select ref, venue, race_date from races where horse_id = $1 and status in ('nominated', 'accepted') and race_date >= $2::date`, [h.id, at.slice(0, 10)]);
      return { movement: ref, horse: h.name, to: p ? p.name : 'Left the stable', at: at.slice(0, 16),
        stable_return: 'Lodge the amendment now (AR 296(2)(d)), then: lodge-return ' + ref + ' --reference=<receipt>',
        warning: p?.kind !== 'stable' && open.length ? `Entered for ${open.map((r) => `${r.ref} ${r.venue} ${r.race_date}`).join(', ')}: AR 296(4)(a) keeps an entered horse at the licensed premises. Scratch or ask the Stewards.` : undefined };
    });
  },

  async 'lodge-return'(db, args, f) {
    const actor = actorOf(f);
    need(f, 'reference');
    const term = String(args[0] ?? '');
    const pending = await db.query(`select * from v_movements where return_standing in ('pending', 'overdue', 'planned') order by moved_at`);
    const m = choose(pending, term, 'Movement waiting for a Stable Return', (r) => [r.ref, r.horse, r.id]);
    const at = f.at ? stamp(f.at, 'at') : (await nowLocal(db)).n;
    if (at < m.moved_at) throw Error('The return cannot be lodged before the move');
    await db.query('update movements set return_lodged_at = $2, return_reference = $3 where id = $1', [m.id, at, String(f.reference).trim()]);
    await log(db, actor, 'lodge-return', m.ref, `${m.horse} reference ${f.reference}`);
    const hours = Math.round(((new Date(at.replace(' ', 'T') + 'Z')) - (new Date(String(m.moved_at).replace(' ', 'T') + 'Z'))) / 36e5 * 10) / 10;
    return { movement: m.ref, horse: m.horse, reference: String(f.reference).trim(), hours_after_move: hours };
  },

  async treat(db, args, f) {
    const actor = actorOf(f);
    need(f, 'kind', 'product');
    const h = await horse(db, args[0]);
    const kind = oneOf(String(f.kind).toLowerCase(), TREATMENT_KINDS, 'kind');
    const now = await nowLocal(db);
    const at = f.at ? stamp(f.at, 'at') : now.n.slice(0, 16) + ':00';
    if (at > now.n) throw Error('A treatment is recorded after it is given, not before');
    const route = f.route ? oneOf(String(f.route).toLowerCase(), ROUTES, 'route') : (kind === 'stomach-tube' ? 'stomach-tube' : null);
    return tx(db, async () => {
      const ref = await nextRef(db, 'treatments', 'ref', 'T-', 4);
      await db.query(`insert into treatments (ref, horse_id, given_at, recorded_at, kind, product, route, amount, duration, given_by, authorised_by, reason, withhold_days)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [ref, h.id, at, now.n, kind, String(f.product).trim(), route, text(f.amount), text(f.duration), text(f['given-by']), text(f['authorised-by']), text(f.reason),
        f['withhold-days'] !== undefined ? int(f['withhold-days'], 'withhold-days', 0, 365) : null]);
      const t = await one(db, 'select * from v_treatments where ref = $1', [ref]);
      await log(db, actor, 'treat', ref, `${h.name}: ${t.product} (${kind}) given ${t.given_local}`);
      const clashes = await db.query(`select ref, venue, race_date, status from races where horse_id = $1 and status in ('planned', 'nominated', 'accepted') and race_date >= $2::date and race_date < $3::date`,
        [h.id, at.slice(0, 10), t.eligible_on]);
      const missing = [!t.route && 'route', !t.reason && 'reason', !t.given_by && 'who gave it'].filter(Boolean);
      return { treatment: ref, horse: h.name, given: t.given_local, recorded: t.recorded_local, record: t.record_standing, eligible_on: t.eligible_on, rule: t.rule,
        missing: missing.length ? `AR 104(2) needs ${missing.join(', ')}: add them with --route, --reason and --given-by on a new record` : undefined,
        breach: t.under_four_bisphosphonate ? 'AR 88A(2): a bisphosphonate must not be given to a horse under 4. Notify the Stewards as soon as practicable (AR 88A(4)(a)).' : t.record_standing === 'late' ? 'AR 104(1): this record is late; it had to be written by midnight on the day.' : undefined,
        races_inside: clashes.length ? clashes.map((r) => `${r.ref} ${r.venue} ${r.race_date} (${r.status}): not eligible, scratch it`) : undefined };
    });
  },

  async nominate(db, args, f) {
    const actor = actorOf(f);
    need(f, 'venue', 'date');
    const h = await horse(db, args[0]);
    const raceDate = date(f.date, 'date');
    const status = oneOf(f.status || 'nominated', ['planned', 'nominated'], 'status');
    const today = (await nowLocal(db)).d;
    if (raceDate < today) throw Error('That race has been run');
    return tx(db, async () => {
      if (status === 'nominated') {
        const e = await eligibleOn(db, h.id, raceDate);
        if (e.why) throw Error(`${h.name} is not eligible on ${raceDate}: ${e.why}. Eligible from ${e.e}. A trainer must not enter the horse (AR 86 to 88AA).`);
        const loc = await one(db, 'select kind from v_location where horse_id = $1', [h.id]);
        if (loc.kind !== 'stable') throw Error(`${h.name} is ${loc.kind === 'left' ? 'out of the stable' : `at ${loc.kind}`}. Bring it into the stable before entering it (AR 296(4)(a)).`);
        const pend = await db.query(`select ref from movements where horse_id = $1 and return_lodged_at is null and moved_at <= local_now()`, [h.id]);
        if (pend.length) throw Error(`${h.name} has a Stable Return not lodged (${pend.map((p) => p.ref).join(', ')}). AR 103(2): lodge it before entering.`);
      }
      const ref = await nextRef(db, 'races', 'ref', 'N-', 3);
      await db.query(`insert into races (ref, horse_id, race_date, venue, race_no, race_name, distance_m, noms_close_at, acceptances_at, status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [ref, h.id, raceDate, String(f.venue).trim(), f.race ? int(f.race, 'race', 1, 15) : null, text(f.name), f.distance ? int(f.distance, 'distance', 800, 7000) : null,
          f['noms-close'] ? stamp(f['noms-close'], 'noms-close') : null, f.acceptances ? stamp(f.acceptances, 'acceptances') : null, status]);
      await log(db, actor, status === 'planned' ? 'plan-race' : 'nominate', ref, `${h.name} ${f.venue} ${raceDate}`);
      return { race: ref, horse: h.name, venue: String(f.venue).trim(), date: raceDate, status };
    });
  },

  async accept(db, args, f) {
    const actor = actorOf(f);
    const r = await race(db, args[0]);
    if (!['planned', 'nominated'].includes(r.status)) throw Error(`${r.ref} is ${r.status}`);
    if (r.clash) throw Error(`${r.horse} is not eligible on ${r.race_date}: ${r.clash}. Scratch it instead.`);
    if (r.returns_pending) throw Error(`${r.horse} has a Stable Return not lodged. AR 103: lodge it first.`);
    if (r.location !== 'stable') throw Error(`${r.horse} is not at the stable (AR 296(4)(a))`);
    await db.query(`update races set status = 'accepted', jockey = coalesce($2, jockey) where id = $1`, [r.id, text(f.jockey)]);
    await log(db, actor, 'accept', r.ref, `${r.horse} ${r.venue} ${r.race_date}${f.jockey ? ', ' + f.jockey : ''}`);
    return { race: r.ref, horse: r.horse, status: 'accepted', jockey: text(f.jockey) || r.jockey };
  },

  async scratch(db, args, f) {
    const actor = actorOf(f);
    const r = await race(db, args[0]);
    if (['ran', 'scratched'].includes(r.status)) throw Error(`${r.ref} is ${r.status}`);
    await db.query(`update races set status = 'scratched' where id = $1`, [r.id]);
    await log(db, actor, 'scratch', r.ref, `${r.horse} ${r.venue} ${r.race_date}: ${text(f.reason) || 'no reason given'}`);
    return { race: r.ref, horse: r.horse, status: 'scratched', next: 'Tell the Stewards and the owners. AR 105 covers anything that may affect the running of a horse.' };
  },

  async result(db, args, f) {
    const actor = actorOf(f);
    need(f, 'finish');
    const r = await race(db, args[0]);
    if (r.status !== 'accepted') throw Error(`${r.ref} is ${r.status}; only an accepted runner has a result`);
    const pm = f.prizemoney ? cents(f.prizemoney, 'prizemoney') : 0;
    await db.query(`update races set status = 'ran', finish = $2, prizemoney_cents = $3 where id = $1`, [r.id, int(f.finish, 'finish', 1, 30), pm]);
    await log(db, actor, 'result', r.ref, `${r.horse} finished ${f.finish}${pm ? ', prizemoney ' + f.prizemoney : ''}`);
    return { race: r.ref, horse: r.horse, finish: Number(f.finish), prizemoney: (await one(db, 'select dollars($1) as d', [pm])).d };
  },

  async work(db, args, f) {
    const actor = actorOf(f);
    need(f, 'kind');
    const h = await horse(db, args[0]);
    const on = f.on ? date(f.on, 'on') : (await nowLocal(db)).d;
    await db.query('insert into trackwork (horse_id, on_date, kind, distance_m, time_text, rider, note) values ($1,$2,$3,$4,$5,$6,$7)',
      [h.id, on, oneOf(String(f.kind).toLowerCase(), WORK, 'kind'), f.distance ? int(f.distance, 'distance', 100, 10000) : null, text(f.time), text(f.rider), text(f.note)]);
    await log(db, actor, 'work', h.code, `${h.name} ${f.kind}${f.distance ? ' ' + f.distance + 'm' : ''} on ${on}`);
    return { horse: h.name, on, kind: f.kind };
  },

  async charge(db, args, f) {
    const actor = actorOf(f);
    need(f, 'kind', 'amount', 'description');
    const h = await horse(db, args[0]);
    const on = f.on ? date(f.on, 'on') : (await nowLocal(db)).d;
    const ref = await nextRef(db, 'charges', 'ref', 'C-', 4);
    const gst = !(f['no-gst'] === true || String(f.gst ?? '').toLowerCase() === 'no');
    await db.query('insert into charges (ref, horse_id, on_date, kind, description, amount_cents, gst) values ($1,$2,$3,$4,$5,$6,$7)',
      [ref, h.id, on, oneOf(String(f.kind).toLowerCase(), CHARGE_KINDS, 'kind'), String(f.description).trim(), cents(f.amount, 'amount'), gst]);
    await log(db, actor, 'charge', ref, `${h.name} ${f.kind} ${f.amount}: ${f.description}`);
    const split = await db.query(`select o.name as owner, s.percent from shares s join owners o on o.id = s.owner_id where s.horse_id = $1 and s.from_on <= $2 and (s.to_on is null or s.to_on >= $2) order by s.percent desc`, [h.id, on]);
    return { charge: ref, horse: h.name, amount: f.amount, gst, split };
  },

  async bill(db, args, f) {
    const actor = actorOf(f);
    need(f, 'month');
    const m = month(f.month, 'month');
    const now = await nowLocal(db);
    if (m >= now.d.slice(0, 7) + '-01') throw Error(`${f.month} is not over yet. Bill a month once it has finished; billing-preview shows it so far.`);
    const issued = f.issued ? date(f.issued, 'issued') : now.d;
    return tx(db, async () => {
      const n = (await one(db, 'select bill_month($1::date, $2::date) as n', [m, issued])).n;
      const inv = await db.query(`select number, owner, dollars(subtotal_cents) as subtotal, dollars(gst_cents) as gst, dollars(total_cents) as total, due_on from v_invoices where month = $1 order by number`, [f.month]);
      await log(db, actor, 'bill', f.month, `${n} owner invoices issued ${issued}`);
      return { month: f.month, invoices: inv, next: n ? 'npm run docs -- owner-invoice renders each one to send. Nothing has been sent.' : 'No fees or charges to bill this month.' };
    });
  },

  async paid(db, args, f) {
    const actor = actorOf(f);
    const i = await invoice(db, args[0]);
    if (i.owing_cents <= 0) throw Error(`${i.number} is already paid`);
    const amt = f.amount ? cents(f.amount, 'amount') : Number(i.owing_cents);
    if (amt > Number(i.owing_cents)) throw Error(`${i.number} has ${(await one(db, 'select dollars($1) as d', [i.owing_cents])).d} owing, less than that`);
    const on = f.on ? date(f.on, 'on') : (await nowLocal(db)).d;
    await db.query(`update invoices set paid_cents = paid_cents + $2, paid_on = case when paid_cents + $2 >= total_cents then $3::date else paid_on end where id = $1`, [i.id, amt, on]);
    await log(db, actor, 'paid', i.number, `${i.owner} paid ${(await one(db, 'select dollars($1) as d', [amt])).d} on ${on}`);
    return (await reads.invoices(db, [], {})).find((x) => x.number === i.number);
  },

  async update(db, args, f) {
    const actor = actorOf(f);
    need(f, 'summary');
    const h = await horse(db, args[0]);
    const on = f.on ? date(f.on, 'on') : (await nowLocal(db)).d;
    await db.query('insert into owner_updates (horse_id, sent_on, by_name, summary) values ($1,$2,$3,$4)', [h.id, on, actor, String(f.summary).trim()]);
    await log(db, actor, 'owner-update', h.code, `${h.name}: ${f.summary}`);
    return { horse: h.name, sent_on: on };
  },

  async log(db, args, f) {
    const actor = actorOf(f);
    need(f, 'note');
    const term = String(args[0] ?? '').trim();
    if (!term) throw Error('Name the horse, owner, race, movement or invoice the note is about');
    const refs = await db.query(`select code as ref, name from horses union all select code, name from owners union all select ref, horse from v_races
      union all select ref, horse from v_movements union all select number, owner from v_invoices union all select ref, horse from v_treatments`);
    const r = choose(refs, term, 'Record', (x) => [x.ref, x.name]);
    await log(db, actor, 'note', r.ref, String(f.note).trim());
    return { ref: r.ref, about: r.name, note: String(f.note).trim() };
  },

  async set(db, args, f) {
    const actor = actorOf(f);
    const [key, value] = args;
    const row = await one(db, 'select * from settings where key = $1', [key]);
    if (!row) throw Error(`No setting "${key}". Settings: ${(await db.query('select key from settings order by key')).map((r) => r.key).join(', ')}`);
    if (value === undefined) throw Error(`Give the new value: set ${key} <value>`);
    await db.query('update settings set value = $2 where key = $1', [key, String(value)]);
    await log(db, actor, 'set', key, `${row.value} -> ${value}`);
    return { key, was: row.value, now: String(value) };
  },
};

// ------------------------------------------------------------------ drafts (written to drafts/, never sent)

const drafts = {
  async 'weekly-review'(db) {
    const att = await reads.attention(db);
    const comp = await reads.compliance(db);
    const rs = await reads.races(db, [], {});
    const sd = await reads['stand-downs'](db);
    const debt = await reads.debtors(db);
    const body = `# Stable review, week of ${(await nowLocal(db)).d}\n\nWritten from the records. Check each line before the Monday meeting.\n\n` +
      `## Rules and where we stand\n\n${mdTable(comp.map(({ standing, rule, count, example }) => ({ standing, rule, count, example })))}\n` +
      `## Races coming up\n\n${mdTable(rs.map(({ ref, horse: hh, race_date, venue, status, acceptances, problem }) => ({ ref, horse: hh, race_date, venue, status, acceptances, problem })))}\n` +
      `## Horses stood down\n\n${mdTable(sd.map(({ horse: hh, product, rule, eligible_on, races_inside }) => ({ horse: hh, product, rule, eligible_on, races_inside })))}\n` +
      `## Owners who owe\n\n${mdTable(debt)}\n## Everything that needs a person\n\n${mdTable(att)}`;
    const file = draftFile(`weekly-review-${(await nowLocal(db)).d}.md`, body);
    return { file, needs_attention: att.length, breaches: comp.filter((c) => c.standing === 'breach').length, races: rs.length };
  },

  async 'draft-owner-update'(db, args) {
    const h = await horse(db, args[0]);
    const v = await one(db, 'select * from v_horses where id = $1', [h.id]);
    const owners = await db.query(`select o.name, o.email, s.percent from shares s join owners o on o.id = s.owner_id where s.horse_id = $1 and s.from_on <= local_today() and (s.to_on is null or s.to_on >= local_today()) order by s.percent desc`, [h.id]);
    if (!owners.length) throw Error(`${h.name} has no owners recorded`);
    const work = await db.query(`select on_date, kind, distance_m, time_text, note from trackwork where horse_id = $1 and on_date >= local_today() - 14 order by on_date`, [h.id]);
    const next = await db.query(`select race_date, venue, race_no, race_name, distance_m, status, jockey from races where horse_id = $1 and race_date >= local_today() and status in ('planned', 'nominated', 'accepted') order by race_date`, [h.id]);
    const last = await db.query(`select race_date, venue, finish, dollars(prizemoney_cents) as prizemoney from races where horse_id = $1 and status = 'ran' order by race_date desc limit 1`, [h.id]);
    const body = `To: ${owners.map((o) => o.email || o.name).join(', ')}\nSubject: ${h.name}: stable update\n\nHi all,\n\n` +
      `${h.name} is ${v.status === 'in work' ? 'in work at the stable' : v.status === 'spelling' ? `spelling at ${v.premises}, ${v.days_there} days so far` : `at ${v.premises}`}.\n\n` +
      (work.length ? `What ${h.name} has done in the last two weeks:\n${work.map((w) => `- ${w.on_date}: ${w.kind}${w.distance_m ? ` ${w.distance_m}m` : ''}${w.time_text ? ` in ${w.time_text}` : ''}${w.note ? `. ${w.note}` : ''}`).join('\n')}\n\n` : '') +
      (last.length ? `Last start: ${last[0].venue} on ${last[0].race_date}, finished ${last[0].finish}${last[0].prizemoney !== '$0.00' ? `, ${last[0].prizemoney} prizemoney` : ''}.\n\n` : '') +
      (next.length ? `The plan:\n${next.map((r) => `- ${r.venue} ${r.race_date}${r.race_no ? `, race ${r.race_no}` : ''}${r.race_name ? ` (${r.race_name}${r.distance_m ? `, ${r.distance_m}m` : ''})` : ''}: ${r.status}${r.jockey ? `, ${r.jockey} rides` : ''}`).join('\n')}\n\n` : 'No race picked yet. [Trainer: the plan from here.]\n\n') +
      `[Trainer: a line on how ${h.name} is eating, moving and looking.]\n\nThanks,\n[Trainer]\n`;
    const file = draftFile(`owner-update-${h.code}.md`, body);
    return { file, horse: h.name, to: owners.length, next: `When it has gone: update ${h.code} --summary="..."` };
  },

  async 'draft-chaser'(db, args) {
    const o = await owner(db, args[0]);
    const inv = await db.query(`select number, month, due_on, dollars(owing_cents) as owing, days_overdue from v_invoices where owner_id = $1 and owing_cents > 0 order by month`, [o.id]);
    if (!inv.length) throw Error(`${o.name} owes nothing`);
    const total = (await one(db, `select dollars(sum(owing_cents)) as t from v_invoices where owner_id = $1`, [o.id])).t;
    const body = `To: ${o.email || o.name}\nSubject: Training account: ${total} outstanding\n\nHi ${o.name.split(' ')[0]},\n\n` +
      `A note that these invoices on your training account are still open:\n\n${inv.map((i) => `- ${i.number} for ${i.month}, ${i.owing}, due ${i.due_on}${i.days_overdue ? ` (${i.days_overdue} days ago)` : ''}`).join('\n')}\n\n` +
      `The total is ${total}. If it has already gone through, thank you, and let me know the date so I can match it.\n\nThanks,\n[Stable office]\n`;
    const file = draftFile(`chaser-${o.code}.md`, body);
    return { file, owner: o.name, owing: total, invoices: inv.length };
  },

  async 'draft-stewards-record'(db, args, f = {}) {
    const h = await horse(db, args[0]);
    const rows = await db.query(`select given_local as given, product, kind, route, amount, duration, given_by, authorised_by, reason, recorded_local as recorded, record_standing as record
      from v_treatments where horse_id = $1 and given_at > local_now() - interval '2 years' order by given_at`, [h.id]);
    const stable = (await one(db, `select setting('stable_name') as s`)).s;
    const body = `# Treatment record: ${h.name}\n\n${stable}. Every medication and treatment recorded under AR 104 for the last two years, for the Stewards on request (AR 104(6)).\n\n${mdTable(rows)}\n` +
      `Signed: ______________________ (trainer)    Date: ____________\n`;
    const file = draftFile(`treatment-record-${h.code}.md`, body);
    return { file, horse: h.name, records: rows.length, late: rows.filter((r) => r.record === 'late').length };
  },
};

// ------------------------------------------------------------------ import from Prism (or any stable spreadsheet saved as CSV)

const HEADINGS = {
  horses: { name: ['Horse Name', 'Horse', 'Name'], sex: ['Sex', 'Gender'], foaled: ['Foal Date', 'Foaled', 'Date of Birth', 'DOB', 'Foaling Date'],
    colour: ['Colour', 'Color'], sire: ['Sire'], dam: ['Dam'], location: ['Location', 'Current Location', 'Property', 'Stable'], id: ['Horse ID', 'ID', 'Microchip'] },
  owners: { name: ['Owner Name', 'Owner', 'Name', 'Contact Name'], email: ['Email', 'Email Address'], phone: ['Phone', 'Mobile', 'Phone Number'], id: ['Owner ID', 'Contact ID', 'ID'] },
  shares: { horse: ['Horse Name', 'Horse'], owner: ['Owner Name', 'Owner'], percent: ['Share', 'Share %', 'Percentage', 'Ownership %', 'Share Percentage'], from: ['From', 'Start Date', 'Date'] },
  treatments: { horse: ['Horse Name', 'Horse'], date: ['Date', 'Treatment Date', 'Date Given'], time: ['Time', 'Time Given'], product: ['Treatment', 'Medication', 'Product', 'Drug'],
    kind: ['Type', 'Treatment Type', 'Category'], route: ['Route', 'Method'], amount: ['Dose', 'Amount', 'Quantity'], given_by: ['Administered By', 'Given By', 'Vet'],
    reason: ['Reason', 'Notes', 'Comment'], id: ['Treatment ID', 'ID'] },
};

function dayOf(v) {
  const d = String(v || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) throw Error(`date "${d}" is not YYYY-MM-DD or DD/MM/YYYY`);
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
function guessKind(product, type) {
  const s = `${product} ${type}`.toLowerCase();
  if (/shock ?wave|eswt/.test(s)) return 'shockwave';
  if (/intra.?(synovial|articular)|joint inj|hyaluron|triamcinolone|methylpred/.test(s)) return 'intra-synovial';
  if (/vacc|equivac|strangles|tetanus|hendra|flu/.test(s)) return 'vaccine';
  if (/tiludron|tildren|clodron|osphos|bisphos/.test(s)) return 'bisphosphonate';
  if (/stomach.?tube|drench/.test(s)) return 'stomach-tube';
  if (/laser|ultrasound|acupunct|chiro|magnet|tens|oxygen|blood sample/.test(s)) return 'other-treatment';
  return 'medication';
}
function guessSex(v) {
  const s = String(v || '').toLowerCase().trim();
  return { c: 'colt', f: 'filly', g: 'gelding', m: 'mare', h: 'horse', r: 'horse', stallion: 'horse', entire: 'horse' }[s] || SEXES.find((x) => s.startsWith(x)) || 'gelding';
}

async function importPrism(db, args, f) {
  const actor = actorOf(f);
  if (args[0] !== 'prism') throw Error('Usage: import prism <file.csv> --kind=horses|owners|shares|treatments --actor="..." [--at=<premises>] [--dry-run]');
  const kind = oneOf(f.kind, Object.keys(HEADINGS), 'kind');
  if (!args[1]) throw Error('Name the CSV file');
  const rows = parseCsv(readFileSync(args[1], 'utf8'));
  const map = { ...HEADINGS[kind] };
  if (f.map) for (const pair of String(f.map).split(',')) {
    const [k, v] = pair.split('=').map((x) => x.trim());
    if (!map[k]) throw Error(`--map key "${k}" is not one of: ${Object.keys(map).join(', ')}`);
    map[k] = [v];
  }
  const get = (r, k) => pick(r, ...map[k]).trim();
  const dry = Boolean(f['dry-run']);
  const fallback = f.at ? await premisesOf(db, f.at) : null;
  const premises = await db.query('select * from premises');
  const now = await nowLocal(db);
  let added = 0;
  let skipped = 0;
  await db.exec('begin');
  try {
    for (const [i, r] of rows.entries()) {
      try {
        if (kind === 'horses') {
          const name = get(r, 'name');
          if (!name) throw Error('no horse name');
          if ((await db.query('select 1 from horses where lower(name) = lower($1)', [name])).length) { skipped++; continue; }
          const where = get(r, 'location').toLowerCase();
          const p = premises.find((x) => where && (x.code.toLowerCase() === where || x.name.toLowerCase().includes(where) || where.includes(x.name.toLowerCase()))) ||
            premises.find((x) => (where.includes('spell') && x.kind === 'spelling') || (where.includes('pre') && x.kind === 'pre-training')) || fallback;
          if (!p) throw Error(`location "${where}" not found; add --at=<premises code> for rows without one`);
          const code = await nextRef(db, 'horses', 'code', 'H', 2);
          const fo = get(r, 'foaled');
          const [h] = await db.query('insert into horses (code, name, sex, foaled_on, colour, sire, dam, external_id) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id',
            [code, name, guessSex(get(r, 'sex')), fo ? date(dayOf(fo), 'foaled') : null, get(r, 'colour') || null, get(r, 'sire') || null, get(r, 'dam') || null, get(r, 'id') ? `prism:horse:${get(r, 'id')}` : null]);
          const ref = await nextRef(db, 'movements', 'ref', 'M-', 4);
          await db.query(`insert into movements (ref, horse_id, premises_id, moved_at, reason, return_lodged_at, return_reference, recorded_by) values ($1,$2,$3,$4,'Brought across from Prism',$4,'carried over',$5)`,
            [ref, h.id, p.id, now.n, actor]);
          added++;
        } else if (kind === 'owners') {
          const name = get(r, 'name');
          if (!name) throw Error('no owner name');
          if ((await db.query('select 1 from owners where lower(name) = lower($1)', [name])).length) { skipped++; continue; }
          const code = await nextRef(db, 'owners', 'code', 'O', 2);
          const k = /syndicate|partnership/i.test(name) ? 'syndicate' : /pty|ltd|limited|holdings|trust/i.test(name) ? 'company' : 'person';
          await db.query('insert into owners (code, name, kind, email, phone, external_id) values ($1,$2,$3,$4,$5,$6)', [code, name, k, get(r, 'email') || null, get(r, 'phone') || null, get(r, 'id') ? `prism:owner:${get(r, 'id')}` : null]);
          added++;
        } else if (kind === 'shares') {
          const h = await horse(db, get(r, 'horse'));
          const o = await owner(db, get(r, 'owner'));
          const pct = percent(get(r, 'percent'), 'percent');
          const from = get(r, 'from') ? dayOf(get(r, 'from')) : now.d;
          if ((await db.query('select 1 from shares where horse_id = $1 and owner_id = $2 and to_on is null', [h.id, o.id])).length) { skipped++; continue; }
          await db.query('insert into shares (horse_id, owner_id, percent, from_on) values ($1,$2,$3,$4)', [h.id, o.id, pct, from]);
          added++;
        } else {
          const h = await horse(db, get(r, 'horse'));
          const product = get(r, 'product');
          if (!product) throw Error('no treatment or medication');
          const t = (get(r, 'time') || '12:00').match(/^(\d{1,2}):(\d{2})/);
          const given = stamp(`${dayOf(get(r, 'date'))} ${t ? `${t[1]}:${t[2]}` : '12:00'}`, 'date');
          const ext = `prism:treatment:${get(r, 'id') || `${h.code}:${given}:${product}`}`;
          const route = ROUTES.find((x) => get(r, 'route').toLowerCase().includes(x.split('-')[0])) || (/inject|iv|im\b/i.test(get(r, 'route')) ? 'injection' : null);
          const ref = await nextRef(db, 'treatments', 'ref', 'T-', 4);
          // Prism did not keep when each record was written: the given time stands in, so imported rows read as on time.
          const res = await db.query(`insert into treatments (ref, horse_id, given_at, recorded_at, kind, product, route, amount, given_by, reason, external_id)
            values ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (external_id) do nothing returning id`,
          [ref, h.id, given, guessKind(product, get(r, 'kind')), product, route, get(r, 'amount') || null, get(r, 'given_by') || null, get(r, 'reason') || null, ext]);
          if (res.length) added++; else skipped++;
        }
      } catch (e) {
        throw Error(`row ${i + 2}: ${e.message}. Nothing was imported.`);
      }
    }
    if (!dry) await log(db, actor, 'import', `prism:${kind}`, `${added} added, ${skipped} skipped from ${path.basename(args[1])}`);
    await db.exec(dry ? 'rollback' : 'commit');
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
  const next = { horses: 'Import owners next, then shares.', owners: 'Import shares next.', shares: 'Run horses to check every horse adds to 100%.', treatments: 'Run stand-downs: any horse still inside a stand-down shows there.' }[kind];
  return { kind, rows: rows.length, added, skipped, dry_run: dry, next };
}

async function exportAll(db, args, f) {
  const tables = ['settings', 'premises', 'staff', 'owners', 'horses', 'shares', 'movements', 'treatments', 'races', 'trackwork', 'charges', 'invoices', 'invoice_lines', 'owner_updates', 'activity'];
  const out = {};
  for (const t of tables) out[t] = await db.query(`select * from ${t}`);
  const file = f.out || path.join(process.env.OUTPUT_DIR || REPO_ROOT, 'exports', `stable-${today()}.json`);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(out, null, 2));
  return { file, rows: Object.fromEntries(tables.map((t) => [t, out[t].length])) };
}

const all = { ...reads, ...writes, ...drafts, import: importPrism, export: exportAll };
export const commands = Object.keys(all).sort();

export async function run(db, command, args = [], flags = {}) {
  const fn = all[command];
  if (!fn) throw Error(`Unknown command "${command}". Commands: ${commands.join(', ')}`);
  return fn(db, args, flags);
}
