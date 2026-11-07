-- Demo data: Hollow Creek Racing, a fictional thoroughbred stable at Cranbourne, Victoria.
-- Dates are relative to today, so the attention list always has something to say:
-- a nominated horse inside an intra-synovial stand-down, a Stable Return not lodged, a treatment
-- recorded the morning after, a bisphosphonate given to a three-year-old, shares adding to 90%,
-- an owner two months behind, a long spell and charges waiting for the billing run.
-- Running it twice does nothing.
do $$
declare
  t date := local_today();
  now_l timestamp := local_now();
  m2 date := (date_trunc('month', local_today()) - interval '2 months')::date;
  p_stable uuid; p_pre uuid; p_spell uuid;
  h1 uuid; h2 uuid; h3 uuid; h4 uuid; h5 uuid; h6 uuid; h7 uuid; h8 uuid; h9 uuid;
  o1 uuid; o2 uuid; o3 uuid; o4 uuid; o5 uuid; o6 uuid;
  arrive timestamp := (date_trunc('month', local_today()) - interval '5 months')::timestamp + interval '9 hours';
begin
  if exists (select 1 from horses where code = 'H01') then return; end if;

  insert into settings (key, value, note) values
    ('stable_name', 'Hollow Creek Racing', 'Your stable name on every document'),
    ('zone', 'Australia/Melbourne', 'The stable''s clock: treatment records, Stable Returns and deadlines use it'),
    ('gst_bps', '1000', 'GST in basis points (1000 = 10%), added to fees and to charges marked gst'),
    ('invoice_days', '14', 'Days to pay an owner invoice'),
    ('update_days', '14', 'Most days between owner updates on a horse'),
    ('return_hours', '24', 'House rule for AR 296 "immediately": hours to lodge a Stable Return amendment'),
    ('work_gap_days', '14', 'Most days between fast work (gallop, jump-out or trial) and a race'),
    ('spell_days', '90', 'A spell longer than this is raised for a decision')
  on conflict (key) do nothing;

  insert into premises (code, name, kind, address, daily_rate_cents) values
    ('CRAN', 'Cranbourne stables', 'stable', 'Training Track Lane, Cranbourne VIC', 13500) returning id into p_stable;
  insert into premises (code, name, kind, address, daily_rate_cents) values
    ('RIDGE', 'Ridgeview pre-training', 'pre-training', 'Ridge Road, Pakenham VIC', 8500) returning id into p_pre;
  insert into premises (code, name, kind, address, daily_rate_cents) values
    ('GLEN', 'Glenmore Park spelling', 'spelling', 'Glenmore Road, Tooradin VIC', 3200) returning id into p_spell;

  insert into staff (code, name, role, email) values
    ('S01', 'Ellen Hart', 'trainer', 'ellen@hollowcreek.example'),
    ('S02', 'Marco Silva', 'foreman', 'marco@hollowcreek.example'),
    ('S03', 'Dr Priya Nair', 'vet', 'priya@equinevets.example'),
    ('S04', 'Tom Ashby', 'farrier', null),
    ('S05', 'Jess Coombe', 'strapper', null),
    ('S06', 'Liam Doyle', 'rider', null),
    ('S07', 'Nora Walsh', 'office', 'office@hollowcreek.example');

  insert into owners (code, name, kind, email, phone) values ('O01', 'Margaret Chen', 'person', 'margaret.chen@example.com', '0412 000 101') returning id into o1;
  insert into owners (code, name, kind, email, phone) values ('O02', 'Bayside Racing Syndicate', 'syndicate', 'manager@baysidesyndicate.example', '0412 000 102') returning id into o2;
  insert into owners (code, name, kind, email, phone) values ('O03', 'Raj Patel', 'person', 'raj.patel@example.com', '0412 000 103') returning id into o3;
  insert into owners (code, name, kind, email, phone) values ('O04', 'Fitzroy Holdings Pty Ltd', 'company', 'accounts@fitzroyholdings.example', '03 9000 0104') returning id into o4;
  insert into owners (code, name, kind, email, phone) values ('O05', 'Dave and Lou Morgan', 'person', 'morgans@example.com', '0412 000 105') returning id into o5;
  insert into owners (code, name, kind, email, phone) values ('O06', 'Sarah O''Neill', 'person', 'sarah.oneill@example.com', '0412 000 106') returning id into o6;

  insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ('H01', 'Southern Arrow', 'gelding', make_date(season_year(t) - 5, 9, 14), 'bay', 'Arrowfield Star', 'Southern Belle') returning id into h1;
  insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ('H02', 'Copper Bay', 'mare', make_date(season_year(t) - 4, 10, 2), 'chestnut', 'Bay Harbour', 'Copper Penny') returning id into h2;
  insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ('H03', 'Velvet Rain', 'filly', make_date(season_year(t) - 3, 9, 30), 'brown', 'Rain Affair', 'Velvet Glove') returning id into h3;
  insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ('H04', 'Tin Soldier', 'gelding', make_date(season_year(t) - 6, 11, 8), 'grey', 'Iron Guard', 'Tin Lizzie') returning id into h4;
  insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ('H05', 'Harbour Lights', 'colt', make_date(season_year(t) - 2, 10, 20), 'bay', 'Bay Harbour', 'City Lights') returning id into h5;
  insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ('H06', 'Lucky Ledger', 'gelding', make_date(season_year(t) - 4, 9, 5), 'bay', 'Ledger Line', 'Lucky Find') returning id into h6;
  insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ('H07', 'Quiet Achiever', 'mare', make_date(season_year(t) - 5, 8, 28), 'black', 'Silent Witness', 'Achieve More') returning id into h7;
  insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ('H08', 'Northern Gale', 'gelding', make_date(season_year(t) - 7, 10, 11), 'chestnut', 'Gale Force', 'North Wind') returning id into h8;
  insert into horses (code, name, sex, foaled_on, colour, sire, dam) values ('H09', 'Ember Glow', 'filly', make_date(season_year(t) - 3, 11, 1), 'chestnut', 'Firestorm', 'Glow Worm') returning id into h9;

  -- Shares from the day each horse arrived. Ember Glow's 10% sale was never recorded: 90%.
  insert into shares (horse_id, owner_id, percent, from_on) values
    (h1, o1, 50, arrive::date), (h1, o3, 50, arrive::date),
    (h2, o2, 100, arrive::date),
    (h3, o4, 60, arrive::date), (h3, o6, 40, arrive::date),
    (h4, o5, 100, arrive::date),
    (h5, o2, 75, arrive::date), (h5, o1, 25, arrive::date),
    (h6, o3, 100, arrive::date),
    (h7, o4, 100, arrive::date),
    (h8, o5, 100, arrive::date),
    (h9, o6, 50, arrive::date), (h9, o1, 40, arrive::date);

  -- Movements. All arrived at Cranbourne five months ago, with returns lodged within the day.
  insert into movements (ref, horse_id, premises_id, moved_at, reason, return_lodged_at, return_reference, recorded_by) values
    ('M-0001', h1, p_stable, arrive, 'Joined the stable', arrive + interval '3 hours', 'SR-55120', 'Nora Walsh'),
    ('M-0002', h2, p_stable, arrive, 'Joined the stable', arrive + interval '3 hours', 'SR-55121', 'Nora Walsh'),
    ('M-0003', h3, p_stable, arrive, 'Joined the stable', arrive + interval '3 hours', 'SR-55122', 'Nora Walsh'),
    ('M-0004', h4, p_stable, arrive, 'Joined the stable', arrive + interval '3 hours', 'SR-55123', 'Nora Walsh'),
    ('M-0005', h5, p_pre, arrive, 'Joined for pre-training', arrive + interval '4 hours', 'SR-55124', 'Nora Walsh'),
    ('M-0006', h6, p_stable, arrive, 'Joined the stable', arrive + interval '3 hours', 'SR-55125', 'Nora Walsh'),
    ('M-0007', h7, p_stable, arrive, 'Joined the stable', arrive + interval '3 hours', 'SR-55126', 'Nora Walsh'),
    ('M-0008', h8, p_stable, arrive, 'Joined the stable', arrive + interval '3 hours', 'SR-55127', 'Nora Walsh'),
    ('M-0009', h9, p_stable, arrive, 'Joined the stable', arrive + interval '3 hours', 'SR-55128', 'Nora Walsh'),
    -- Tin Soldier out to the spelling farm 120 days ago: a long spell.
    ('M-0010', h4, p_spell, (t - 120)::timestamp + interval '10 hours', 'Spell after autumn campaign', (t - 120)::timestamp + interval '15 hours', 'SR-55301', 'Nora Walsh'),
    -- Northern Gale retired and left last month.
    ('M-0011', h8, null, (date_trunc('month', t) - interval '1 month')::timestamp + interval '12 days 11 hours', 'Retired to a riding home', (date_trunc('month', t) - interval '1 month')::timestamp + interval '12 days 16 hours', 'SR-56010', 'Nora Walsh'),
    -- Harbour Lights came in from pre-training two days ago. The Stable Return amendment was never lodged.
    ('M-0012', h5, p_stable, (t - 2)::timestamp + interval '7 hours', 'Into work from pre-training', null, null, 'Marco Silva');

  -- Treatments (AR 104).
  insert into treatments (ref, horse_id, given_at, recorded_at, kind, product, route, amount, duration, given_by, authorised_by, reason, withhold_days) values
    ('T-0001', h2, (t - 40)::timestamp + interval '7 hours', (t - 40)::timestamp + interval '8 hours', 'vaccine', 'Equivac 2 in 1 (tetanus and strangles)', 'injection', '1 mL', null, 'Dr Priya Nair', 'Dr Priya Nair', 'Annual booster', null),
    ('T-0002', h6, (t - 2)::timestamp + interval '7 hours 30 minutes', (t - 2)::timestamp + interval '9 hours', 'vaccine', 'Equivac HeV (Hendra virus)', 'injection', '1 mL', null, 'Dr Priya Nair', 'Dr Priya Nair', 'Hendra booster, six monthly', null),
    -- Southern Arrow: intra-synovial injection three days ago, nominated to race in five days. Ineligible.
    ('T-0003', h1, (t - 3)::timestamp + interval '10 hours', (t - 3)::timestamp + interval '11 hours', 'intra-synovial', 'Triamcinolone acetonide, left fore fetlock', 'injection', '10 mg', null, 'Dr Priya Nair', 'Ellen Hart', 'Fetlock heat after last gallop', null),
    -- Quiet Achiever: given at 6 pm, written up the next morning. A late record.
    ('T-0004', h7, (t - 6)::timestamp + interval '18 hours', (t - 5)::timestamp + interval '8 hours 15 minutes', 'medication', 'Phenylbutazone paste', 'oral', '2 g', '3 days', 'Jess Coombe', 'Dr Priya Nair', 'Mild hoof soreness', 4),
    -- Velvet Rain: a bisphosphonate at three years old. AR 88A forbids it.
    ('T-0005', h3, (t - 60)::timestamp + interval '9 hours', (t - 60)::timestamp + interval '10 hours', 'bisphosphonate', 'Tildren (tiludronic acid)', 'injection', '1 vial', null, 'Dr Priya Nair', 'Ellen Hart', 'Shin soreness', null),
    ('T-0006', h9, (t - 1)::timestamp + interval '15 hours', (t - 1)::timestamp + interval '16 hours', 'other-treatment', 'Laser therapy, near hind', 'topical', null, '20 minutes', 'Marco Silva', null, null, null),
    ('T-0007', h2, (t - 9)::timestamp + interval '6 hours', (t - 9)::timestamp + interval '7 hours', 'shockwave', 'Shockwave therapy, right hind suspensory', 'other', null, '1 session', 'Dr Priya Nair', 'Dr Priya Nair', 'Suspensory soreness', null);

  -- Races: one clash, one acceptance closing, nominations closing, one with no fast work for weeks, two runs last month.
  insert into races (ref, horse_id, race_date, venue, race_no, race_name, distance_m, noms_close_at, acceptances_at, status, jockey, finish, prizemoney_cents) values
    ('N-001', h1, t + 5, 'Caulfield', 6, 'BM78 Handicap', 1400, (t - 2)::timestamp + interval '12 hours', (t + 3)::timestamp + interval '10 hours', 'nominated', null, null, 0),
    ('N-002', h2, t + 2, 'Sandown Hillside', 4, 'BM70 Handicap', 1600, (t - 5)::timestamp + interval '12 hours', (t)::timestamp + interval '10 hours', 'accepted', 'Kate Moran', null, 0),
    ('N-003', h6, t + 10, 'Pakenham', 5, 'Maiden Plate', 1200, (t + 2)::timestamp + interval '12 hours', (t + 8)::timestamp + interval '10 hours', 'planned', null, null, 0),
    ('N-004', h7, t + 6, 'Mornington', 3, 'F&M BM64 Handicap', 1300, (t - 1)::timestamp + interval '12 hours', (t + 4)::timestamp + interval '10 hours', 'nominated', null, null, 0),
    ('N-005', h9, t + 1, 'Geelong', 2, '3YO Fillies Maiden', 1100, (t - 6)::timestamp + interval '12 hours', (t - 1)::timestamp + interval '10 hours', 'accepted', 'Ben Rowe', null, 0),
    ('N-006', h2, t - 25, 'Moonee Valley', 5, 'BM70 Handicap', 1500, (t - 32)::timestamp + interval '12 hours', (t - 27)::timestamp + interval '10 hours', 'ran', 'Kate Moran', 1, 3150000),
    ('N-007', h1, t - 32, 'Flemington', 7, 'BM78 Handicap', 1400, (t - 39)::timestamp + interval '12 hours', (t - 34)::timestamp + interval '10 hours', 'ran', 'Ben Rowe', 4, 225000),
    ('N-008', h6, t - 30, 'Sale', 3, 'Maiden Plate', 1200, (t - 37)::timestamp + interval '12 hours', (t - 32)::timestamp + interval '10 hours', 'ran', 'Kate Moran', 7, 0);

  insert into trackwork (horse_id, on_date, kind, distance_m, time_text, rider, note) values
    (h1, t - 4, 'gallop', 1000, '61.2', 'Liam Doyle', 'Felt the left fore pulling up'),
    (h2, t - 6, 'gallop', 800, '49.8', 'Liam Doyle', 'Strong'),
    (h2, t - 1, 'canter', 2000, null, 'Liam Doyle', null),
    (h3, t - 3, 'jump-out', 800, '48.9', 'Liam Doyle', 'Settled well'),
    (h5, t - 1, 'trot', 1600, null, 'Jess Coombe', 'First day back in work'),
    (h6, t - 5, 'gallop', 1000, '62.0', 'Liam Doyle', null),
    (h6, t - 11, 'trial', 1000, '60.4', 'Ben Rowe', 'Third in the Cranbourne trial'),
    (h7, t - 19, 'gallop', 800, '50.6', 'Liam Doyle', null),
    (h7, t - 2, 'canter', 2400, null, 'Jess Coombe', null),
    (h9, t - 5, 'gallop', 800, '50.1', 'Liam Doyle', 'Ready');

  -- Charges: some billed two months ago with the fees, the rest waiting for the next run.
  insert into charges (ref, horse_id, on_date, kind, description, amount_cents, gst) values
    ('C-0001', h1, m2 + 4, 'farrier', 'Shoes all round', 18000, true),
    ('C-0002', h2, m2 + 10, 'vet', 'Scope and blood count', 32000, true),
    ('C-0003', h3, m2 + 15, 'dentist', 'Teeth rasped', 15000, true),
    ('C-0004', h5, m2 + 20, 'transport', 'Float Pakenham to Cranbourne and back for a trial', 22000, true),
    ('C-0005', h1, (date_trunc('month', t) - interval '1 month')::date + 7, 'acceptance', 'Flemington acceptance fee', 34100, false),
    ('C-0006', h2, (date_trunc('month', t) - interval '1 month')::date + 9, 'vet', 'Shockwave course', 66000, true),
    ('C-0007', h6, (date_trunc('month', t) - interval '1 month')::date + 11, 'transport', 'Float to Sale', 28000, true),
    ('C-0008', h9, (date_trunc('month', t) - interval '1 month')::date + 14, 'farrier', 'Shoes all round, racing plates', 19500, true),
    ('C-0009', h1, t - 3, 'vet', 'Joint injection, left fore fetlock', 48000, true);

  -- Two months ago is billed. Fitzroy Holdings has not paid; the rest have.
  perform bill_month(m2, (m2 + interval '1 month')::date + 1);
  update invoices set paid_cents = total_cents, paid_on = due_on - 3 where month = m2 and owner_id <> o4;

  insert into owner_updates (horse_id, sent_on, by_name, summary) values
    (h1, t - 4, 'Ellen Hart', 'Galloped well, a little heat in the left fore afterwards; vet to look'),
    (h2, t - 6, 'Ellen Hart', 'Sharp after the shockwave course, heading to Sandown'),
    (h3, t - 20, 'Ellen Hart', 'Jumping out next week'),
    (h4, t - 30, 'Ellen Hart', 'Spelling at Glenmore, condition good'),
    (h6, t - 5, 'Ellen Hart', 'Trialled third, Pakenham maiden the target'),
    (h7, t - 16, 'Ellen Hart', 'Mornington the plan'),
    (h9, t - 5, 'Ellen Hart', 'Accepted at Geelong, Ben Rowe rides');

  insert into activity (actor, action, ref, detail) values ('seed', 'seed', null, 'Hollow Creek Racing demo data loaded');
end $$;
