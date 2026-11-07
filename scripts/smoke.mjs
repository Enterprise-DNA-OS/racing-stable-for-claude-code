#!/usr/bin/env node
// npm test: a temporary database, the demo stable, every command exercised, then cleaned up.
// Set TEST_DATABASE_URL to run the same checks against an empty Postgres database instead of PGlite.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { migrate } from './migrate.mjs';
import { seed } from './seed.mjs';
import { run, reads, commands, QUESTIONS, stamp, date, month, cents, percent } from './lib/domain.mjs';

const root = mkdtempSync(path.join(os.tmpdir(), 'stable-test-'));
process.env.DATA_DIR = path.join(root, 'db');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || '';
process.env.OUTPUT_DIR = path.join(root, 'out');

let db;
let checks = 0;
const ok = (v, msg) => { assert.ok(v, msg); checks++; };
const eq = (a, b, msg) => { assert.equal(a, b, msg); checks++; };
const fails = async (fn, re, msg) => { await assert.rejects(fn, re, msg); checks++; };
const call = (cmd, args = [], f = {}) => run(db, cmd, args, f);
const A = { actor: 'Test' };
const one = async (sql, p = []) => (await db.query(sql, p))[0];

try {
  db = await getDb();
  await migrate(db);
  eq((await migrate(db)).ran.length, 0, 'migrate twice is a no-op');
  await seed(db);
  const counts = await one('select (select count(*) from horses)::int as h, (select count(*) from treatments)::int as t, (select count(*) from invoices)::int as i');
  await seed(db);
  const again = await one('select (select count(*) from horses)::int as h, (select count(*) from treatments)::int as t, (select count(*) from invoices)::int as i');
  eq(JSON.stringify(again), JSON.stringify(counts), 'seed is idempotent');
  eq(counts.h, 9, 'nine demo horses');
  ok(counts.i >= 5, 'two months ago is billed');
  const T = (await one('select local_today()::text as d')).d;
  const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

  // Every read runs.
  for (const cmd of Object.keys(reads)) {
    const a = { horse: ['Arrow'], owner: ['Fitzroy'] }[cmd] || [];
    const fl = cmd === 'billing-preview' ? { month: T.slice(0, 7) } : {};
    ok(await call(cmd, a, fl), `read ${cmd}`);
  }
  eq(QUESTIONS.length, 10, 'ten questions');
  const ins = await call('insights');
  eq(ins.length, 10);
  ok(ins.every((q) => Array.isArray(q.rows)), 'every question returns rows');
  ok(ins[0].rows.some((r) => r.ref === 'N-001'), 'Q1 finds the Caulfield clash');
  ok(ins[1].rows.some((r) => r.ref === 'T-0004'), 'Q2 finds the late treatment record');
  ok(ins[2].rows.some((r) => r.ref === 'M-0012'), 'Q3 finds the Stable Return not lodged');
  ok(ins[3].rows.some((r) => r.horse === 'Copper Bay' && r.prizemoney === '$31,500.00'), 'Q4 sets prizemoney against cost');
  ok(ins[7].rows.some((r) => r.code === 'H09'), 'Q8 finds Ember Glow at 90%');
  ok(ins[8].rows.some((r) => r.ref === 'N-004'), 'Q9 finds Quiet Achiever with no fast work');
  ok(ins[9].rows.some((r) => r.owner === 'Fitzroy Holdings Pty Ltd'), 'Q10 finds the late owner');

  // Parsing is strict.
  eq(stamp('2026-11-09 6:05', 'x'), '2026-11-09 06:05:00');
  eq(stamp('2026-11-09T14:20', 'x'), '2026-11-09 14:20:00');
  assert.throws(() => stamp('2026-11-09 25:00', 'x'), /impossible/); checks++;
  assert.throws(() => date('2026-02-30', 'x'), /date/); checks++;
  eq(month('2026-10', 'm'), '2026-10-01');
  assert.throws(() => month('2026-13', 'm'), /month/); checks++;
  eq(cents('1,250.50', 'a'), 125050); eq(cents('$180', 'a'), 18000);
  assert.throws(() => cents('12.345', 'a'), /amount/); checks++;
  eq(percent('33.33%', 'p'), 33.33);
  assert.throws(() => percent('0', 'p'), /share/); checks++;
  assert.throws(() => percent('101', 'p'), /share/); checks++;

  // The rules, straight from the database.
  const age = async (f, d) => (await one('select horse_age($1::date, $2::date) as a', [f, d])).a;
  eq(await age('2022-09-14', '2026-07-31'), 3, 'a September 2022 foal is 3 until 31 July 2026');
  eq(await age('2022-09-14', '2026-08-01'), 4, 'and 4 from 1 August');
  eq(await age('2023-07-20', '2023-08-01'), 1, 'a July foal turns 1 on its first 1 August');
  const elig = async (kind, given, foaled = '2018-09-01', withhold = null) => (await one(`with h as (insert into horses (code, name, sex, foaled_on) values ('X' || substr(md5(random()::text), 1, 6), 'Test ' || md5(random()::text), 'gelding', $3) returning id),
      t as (insert into treatments (ref, horse_id, given_at, recorded_at, kind, product, withhold_days) select 'X-' || substr(md5(random()::text), 1, 8), id, $2::timestamp, $2::timestamp, $1, 'test', $4 from h returning ref)
      select 1`, [kind, given, foaled, withhold]), await (async () => { const e = (await one(`select eligible_on::text as e from v_treatments where product = 'test'`)).e;
      await db.query(`delete from treatments where product = 'test'`); return e; })());
  // The rules' own worked examples: given on Monday the 1st.
  eq(await elig('shockwave', '2024-07-01 08:00'), '2024-07-09', 'AR 86 note: shockwave Monday 1st, eligible Tuesday 9th');
  eq(await elig('intra-synovial', '2024-07-01 08:00'), '2024-07-10', 'AR 87 note: eligible Wednesday 10th');
  eq(await elig('vaccine', '2024-07-01 08:00'), '2024-07-07', 'AR 88 note: eligible Sunday 7th');
  eq(await elig('bisphosphonate', '2024-07-01 08:00'), '2024-08-01', 'AR 88AA: 30 clear days');
  eq(await elig('stomach-tube', '2024-07-01 08:00'), '2024-07-03', 'AR 255: not race day or the 1 clear day before');
  eq(await elig('medication', '2024-07-01 08:00'), '2024-07-02', 'AR 249: not on race day');
  eq(await elig('medication', '2024-07-01 08:00', '2018-09-01', 4), '2024-07-06', 'a vet withholding period extends it');
  eq(await elig('other-treatment', '2024-07-01 08:00'), '2024-07-01', 'no stand-down for other treatments');
  eq(await elig('bisphosphonate', '2024-07-01 08:00', '2021-10-01'), '2025-08-01', 'AR 88A: under 4, not before 1 August of the year it turns 4');
  eq(await elig('bisphosphonate', '2025-03-01 08:00', '2021-10-01'), '2026-03-01', 'AR 88A: and at least 12 months');
  await db.query(`delete from treatments where product = 'test'`);
  await db.query(`delete from horses where name like 'Test %'`);

  // Attention and compliance on the demo.
  const att = await call('attention');
  for (const item of ['race clash', 'under-4 bisphosphonate', 'stable return overdue', 'treatment recorded late', 'treatment record incomplete', 'no fast work before race',
    'nominations close soon', 'invoice overdue', 'shares not 100%', 'charges not billed', 'owner update due', 'long spell']) ok(att.some((a) => a.item === item), `attention: ${item}`);
  eq(att[0].item, 'race clash', 'a race clash comes first');
  const comp = await call('compliance');
  eq(comp.length, 7, 'seven rules');
  eq(comp.filter((c) => c.standing === 'breach').length, 5, 'five breaches in the demo');
  ok(comp.every((c) => c.source), 'every rule cites its source');

  // Nominating: stand-downs, location and Stable Returns all refuse an entry.
  await fails(() => call('nominate', ['Southern Arrow'], { ...A, venue: 'Bendigo', date: addDays(T, 5) }), /not eligible.*AR 87/, 'inside the intra-synovial stand-down');
  const nOk = await call('nominate', ['Southern Arrow'], { ...A, venue: 'Bendigo', date: addDays(T, 6), race: '4', distance: '1400', acceptances: `${addDays(T, 4)} 10:00` });
  eq(nOk.status, 'nominated', 'eligible on the day after the 8th clear day');
  await fails(() => call('nominate', ['Tin Soldier'], { ...A, venue: 'Sale', date: addDays(T, 9) }), /spelling.*AR 296\(4\)/, 'a spelling horse cannot be entered');
  await fails(() => call('nominate', ['Harbour Lights'], { ...A, venue: 'Sale', date: addDays(T, 9) }), /Stable Return not lodged.*AR 103/, 'no entry before the return');
  await fails(() => call('nominate', ['Copper Bay'], { ...A, venue: 'Sale', date: addDays(T, -1) }), /been run/);
  const planned = await call('nominate', ['Harbour Lights'], { ...A, venue: 'Sale', date: addDays(T, 9), status: 'planned' });
  eq(planned.status, 'planned', 'a planned race is just a plan');
  await fails(() => call('accept', [planned.race], A), /Stable Return/, 'acceptance re-checks the return');
  await fails(() => call('accept', ['N-001'], A), /not eligible/, 'acceptance re-checks the stand-down');
  await fails(() => call('lodge-return', ['M-0001'], { ...A, reference: 'x' }), /not found/, 'only waiting movements take a return');
  const lr = await call('lodge-return', ['Harbour'], { ...A, reference: 'SR-57001' });
  eq(lr.movement, 'M-0012'); ok(lr.hours_after_move > 24, 'hours recorded');
  const acc = await call('accept', [planned.race], { ...A, jockey: 'Kate Moran' });
  eq(acc.status, 'accepted');
  await fails(() => call('result', ['N-001'], { ...A, finish: '1' }), /only an accepted runner/);
  const sc = await call('scratch', ['N-001'], { ...A, reason: 'Stood down after joint injection' });
  eq(sc.status, 'scratched');
  ok(!(await call('attention')).some((a) => a.item === 'race clash'), 'scratching clears the clash');
  const res = await call('result', ['N-002'], { ...A, finish: '2', prizemoney: '8,400' });
  eq(res.prizemoney, '$8,400.00');

  // Treatments: recorded now, stand-down worked out, clashes and breaches named.
  const tr = await call('treat', ['Lucky Ledger'], { ...A, kind: 'bisphosphonate', product: 'Tildren (tiludronic acid)', route: 'injection', amount: '1 vial', 'given-by': 'Dr Priya Nair', reason: 'Hock soreness' });
  eq(tr.record, 'on time'); eq(tr.eligible_on, addDays(T, 31)); ok(!tr.breach, 'a four-year-old may have it');
  ok(tr.races_inside?.some((r) => r.startsWith('N-003')), 'a planned race inside the stand-down is named');
  const tm = await call('treat', ['Copper Bay'], { ...A, kind: 'medication', product: 'Electrolyte paste', at: `${addDays(T, -1)} 17:00` });
  eq(tm.record, 'late', 'yesterday written today is late'); ok(/AR 104\(1\)/.test(tm.breach)); ok(/route, reason, who gave it/.test(tm.missing));
  await fails(() => call('treat', ['Copper Bay'], { ...A, kind: 'medication', product: 'x', at: `${addDays(T, 1)} 09:00` }), /after it is given/);
  await fails(() => call('treat', ['Copper Bay'], { ...A, kind: 'magic', product: 'x' }), /--kind must be one of/);
  const tb = await call('treat', ['Ember Glow'], { ...A, kind: 'bisphosphonate', product: 'Tildren', route: 'injection', 'given-by': 'Vet', reason: 'test' });
  ok(/AR 88A\(2\)/.test(tb.breach), 'a three-year-old bisphosphonate is a breach');
  ok(tb.races_inside?.some((r) => r.startsWith('N-005')), 'and its accepted race is named');

  // Movements.
  const mv = await call('move', ['Tin Soldier'], { ...A, to: 'CRAN', reason: 'Back into work' });
  ok(/AR 296\(2\)\(d\)/.test(mv.stable_return));
  await fails(() => call('move', ['Tin Soldier'], { ...A, to: 'CRAN' }), /already at/);
  const mv2 = await call('move', ['Southern Arrow'], { ...A, to: 'GLEN', reason: 'Short let-up' });
  ok(/AR 296\(4\)\(a\)/.test(mv2.warning), 'moving an entered horse to a spelling farm warns');
  const out = await call('move', ['Velvet Rain'], { ...A, to: 'left', reason: 'Sold' });
  eq(out.to, 'Left the stable');
  ok((await call('movements', [], { pending: true })).length >= 3, 'three returns waiting');

  // Horses, owners, shares.
  const nh = await call('add-horse', ['Silver Thread'], { ...A, sex: 'filly', foaled: '2023-10-02', at: 'RIDGE', sire: 'Silver Lining' });
  eq(nh.horse, 'H10');
  const no = await call('add-owner', ['Ana Torres'], { ...A, email: 'ana@example.com' });
  eq(no.owner, 'O07');
  await call('share', ['Silver Thread', 'Ana Torres'], { ...A, percent: '70' });
  await fails(() => call('share', ['Silver Thread', 'Margaret'], { ...A, percent: '40' }), /would make 110/);
  await call('share', ['Silver Thread', 'Margaret'], { ...A, percent: '30' });
  eq((await one(`select shares_percent::text as p from v_horses where code = 'H10'`)).p, '100.00');
  const sale = await call('sell-share', ['Southern Arrow'], { ...A, 'from-owner': 'Raj', 'to-owner': 'Torres', percent: '20', on: addDays(T, -3) });
  eq(sale.seller_keeps, 30); ok(/AR 295/.test(sale.next));
  const arrowShares = await db.query(`select o.name, s.percent::text as p from shares s join owners o on o.id = s.owner_id join horses h on h.id = s.horse_id where h.code = 'H01' and s.to_on is null order by o.name`);
  eq(arrowShares.map((s) => `${s.name} ${s.p}`).join(', '), 'Ana Torres 20.00, Margaret Chen 50.00, Raj Patel 30.00');
  await fails(() => call('sell-share', ['Southern Arrow'], { ...A, 'from-owner': 'Raj', 'to-owner': 'Torres', percent: '40', on: T }), /holds 30/);
  await fails(() => call('add-horse', ['Nope'], { ...A, sex: 'unicorn', at: 'CRAN' }), /--sex/);
  await fails(() => call('horse', ['e']), /ambiguous/);

  // Work, charges, updates, settings.
  await call('work', ['Quiet Achiever'], { ...A, kind: 'gallop', distance: '1000', time: '61.0', rider: 'Liam Doyle' });
  ok(!(await call('attention')).some((a) => a.item === 'no fast work before race' && a.ref === 'N-004'), 'a gallop clears the no-fast-work flag');
  const ch = await call('charge', ['Ember Glow'], { ...A, kind: 'vet', amount: '240', description: 'Scope' });
  eq(ch.split.length, 2, 'split by the two owners');
  await fails(() => call('charge', ['Ember Glow'], { ...A, kind: 'vet', amount: 'lots', description: 'x' }), /amount/);
  await call('update', ['Tin Soldier'], { ...A, summary: 'Back in work' });
  const st = await call('set', ['update_days', '21'], A);
  eq(st.was, '14');
  await fails(() => call('set', ['nope', '1'], A), /No setting/);
  await fails(() => call('charge', ['Ember Glow'], { kind: 'vet', amount: '1', description: 'x' }), /--actor is required/, 'every write needs an actor');

  // The billing run: last month, split by share and day, GST, charges marked, once only.
  const last = (await one(`select to_char(date_trunc('month', local_today()) - interval '1 month', 'YYYY-MM') as m`)).m;
  const prev = await call('billing-preview', [], { month: last });
  ok(prev.some((l) => l.horse === 'Southern Arrow' && l.kind === 'fee'), 'preview has fees');
  const b = await call('bill', [], { ...A, month: last });
  eq(b.invoices.length, 6, 'one invoice per owner with a horse last month');
  await fails(() => call('bill', [], { ...A, month: last }), /already billed/);
  await fails(() => call('bill', [], { ...A, month: T.slice(0, 7) }), /not over yet/);
  const days = Number((await one(`select extract(day from (date_trunc('month', local_today()) - interval '1 day'))::int as d`)).d);
  const fee = await one(`select l.days, l.amount_cents::int as a from invoice_lines l join invoices i on i.id = l.invoice_id join owners o on o.id = i.owner_id join horses h on h.id = l.horse_id
    where i.month = $1::date and o.code = 'O01' and h.code = 'H01' and l.kind = 'fee'`, [`${last}-01`]);
  eq(fee.days, days, 'a full month in work'); eq(fee.a, Math.round(13500 * days * 0.5), 'half the training fee for a half share');
  const gale = await one(`select l.days from invoice_lines l join invoices i on i.id = l.invoice_id join horses h on h.id = l.horse_id where i.month = $1::date and h.code = 'H08' and l.kind = 'fee'`, [`${last}-01`]);
  eq(gale.days, 12, 'Northern Gale billed until the day it left');
  const acc341 = await one(`select l.amount_cents::int as a, l.gst from invoice_lines l join charges c on c.id = l.charge_id where c.ref = 'C-0005' order by l.amount_cents limit 1`);
  eq(acc341.a, 17050, 'acceptance fee split in half'); eq(acc341.gst, false, 'no GST where none was charged');
  const tot = await one(`select sum(subtotal_cents)::int as s, sum(gst_cents)::int as g, bool_and(total_cents = subtotal_cents + gst_cents) as t from invoices where month = $1::date`, [`${last}-01`]);
  ok(tot.t, 'totals add up');
  eq((await one(`select count(*)::int as n from charges where billed_month is null and on_date < date_trunc('month', local_today())`)).n, 0, 'every charge before this month billed');
  const fz = (await call('invoices', [], { owing: true })).find((i) => i.owner === 'Fitzroy Holdings Pty Ltd' && i.days_overdue > 0);
  const pp = await call('paid', [fz.number], { ...A, amount: '1,000' });
  ok(pp.owing !== '$0.00' && !pp.paid_on, 'part payment leaves it open');
  const pf = await call('paid', [fz.number], A);
  eq(pf.owing, '$0.00'); ok(pf.paid_on, 'paid in full');
  await fails(() => call('paid', [fz.number], A), /already paid/);

  // Drafts never send.
  const wr = await call('weekly-review');
  ok(existsSync(path.join(process.env.OUTPUT_DIR, wr.file)), 'weekly review drafted');
  const ou = await call('draft-owner-update', ['Copper Bay']);
  const ouText = readFileSync(path.join(process.env.OUTPUT_DIR, ou.file), 'utf8');
  ok(ouText.includes('manager@baysidesyndicate.example') && ouText.includes('Sandown Hillside'), 'owner update addressed and written from the records');
  const chs = await call('draft-chaser', ['Raj']);
  ok(chs.invoices >= 1);
  await fails(() => call('draft-chaser', ['Torres']), /owes nothing/);
  const sr = await call('draft-stewards-record', ['Quiet Achiever']);
  eq(sr.late, 1, 'the stewards record shows the late entry');

  // Import from Prism: dry run, real, repeat, rollback.
  const ex = (f) => path.join(REPO_ROOT, 'examples', 'prism', f);
  const h0 = (await one('select count(*)::int as n from horses')).n;
  const dry = await call('import', ['prism', ex('horses.csv')], { ...A, kind: 'horses', 'dry-run': true });
  eq(dry.added, 2); eq((await one('select count(*)::int as n from horses')).n, h0, 'dry run writes nothing');
  eq((await call('import', ['prism', ex('horses.csv')], { ...A, kind: 'horses' })).added, 2);
  eq((await call('import', ['prism', ex('horses.csv')], { ...A, kind: 'horses' })).skipped, 2, 'repeat rows skipped');
  const ml = await one(`select h.sex, h.foaled_on::text as f, l.kind from horses h join v_location l on l.horse_id = h.id where h.name = 'Midnight Ledger'`);
  eq(ml.sex, 'gelding'); eq(ml.f, '2021-10-12', 'DD/MM/YYYY read'); eq(ml.kind, 'stable');
  eq((await one(`select l.kind from horses h join v_location l on l.horse_id = h.id where h.name = 'Coastal Breeze'`)).kind, 'spelling', 'location matched by name');
  eq((await call('import', ['prism', ex('owners.csv')], { ...A, kind: 'owners' })).added, 2);
  eq((await one(`select kind from owners where name = 'Southbank Racing Partnership'`)).kind, 'syndicate');
  eq((await call('import', ['prism', ex('shares.csv')], { ...A, kind: 'shares' })).added, 3);
  eq((await one(`select shares_percent::text as p from v_horses where name = 'Midnight Ledger'`)).p, '100.00');
  const ti = await call('import', ['prism', ex('treatments.csv')], { ...A, kind: 'treatments' });
  eq(ti.added, 2);
  eq((await call('import', ['prism', ex('treatments.csv')], { ...A, kind: 'treatments' })).skipped, 2, 'treatments not doubled');
  eq((await one(`select kind from treatments where product = 'Equivac 2 in 1'`)).kind, 'vaccine', 'vaccine recognised');
  const bad = path.join(root, 'bad.csv');
  writeFileSync(bad, 'Horse Name,Owner Name,Share %\nMidnight Ledger,Ana Torres,10\nNo Such Horse,Ana Torres,10\n');
  const s0 = (await one('select count(*)::int as n from shares')).n;
  await fails(() => call('import', ['prism', bad], { ...A, kind: 'shares' }), /row 3.*Nothing was imported/);
  eq((await one('select count(*)::int as n from shares')).n, s0, 'a bad row rolls back the whole file');
  await fails(() => call('import', ['prism', bad], { ...A, kind: 'shares', map: 'nope=x' }), /--map key/);

  // Export.
  const exp = await call('export');
  ok(existsSync(exp.file) && exp.rows.treatments > 5, 'export written');

  // Database checks hold even without the CLI.
  await fails(() => db.query(`insert into shares (horse_id, owner_id, percent, from_on) select h.id, o.id, 120, current_date from horses h, owners o limit 1`), /check/);
  await fails(() => db.query(`insert into charges (ref, horse_id, on_date, kind, description, amount_cents) select 'C-X', id, current_date, 'vet', 'x', 0 from horses limit 1`), /check/);
  await fails(() => db.query(`select bill_month('2026-01-15', '2026-02-01')`), /whole month/);

  // HTML is escaped in views and documents.
  await db.query(`update horses set name = '<script>x</script> Glow' where code = 'H09'`);
  await db.close(); db = null;
  for (const script of ['view.mjs', 'docs.mjs']) {
    const r = spawnSync(process.execPath, [path.join('scripts', script)], { cwd: REPO_ROOT, env: process.env, encoding: 'utf8' });
    eq(r.status, 0, `${script} runs: ${r.stderr}`);
  }
  const week = readFileSync(path.join(process.env.OUTPUT_DIR, 'views', 'week.html'), 'utf8');
  ok(week.includes('&lt;script&gt;') && !week.includes('<script>x'), 'views escape HTML');
  ok(readdirSync(path.join(process.env.OUTPUT_DIR, 'docs-out')).length === 3, 'three document types rendered');

  // Every CLI command has a slash command and a routing row.
  const md = readdirSync(path.join(REPO_ROOT, '.claude', 'commands')).map((f) => f.replace(/\.md$/, ''));
  const claude = readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8');
  for (const c of commands) { ok(md.includes(c), `/${c} has a command file`); ok(claude.includes(`\`/${c}\``), `/${c} is routed in CLAUDE.md`); }

  console.log(`PASS: ${checks} checks, ${commands.length} CLI commands, ${md.filter((m) => m !== 'README').length} slash commands (${process.env.DATABASE_URL ? 'postgres' : 'pglite'})`);
} finally {
  await db?.close();
  rmSync(root, { recursive: true, force: true });
}
