# Racing Stable for Claude Code: operating instructions

Claude Code reads this file at the start of every session. It says who this is for, the house rules, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR STABLE], [licensed trainer and the premises you are licensed to train from]
- **Operator:** [YOUR NAME], [your role: trainer, foreman, stable office]
- **What matters most:** [for example: no horse ever entered inside a stand-down, every treatment written up the same day, owners billed on the 2nd and updated every fortnight]

The work is a thoroughbred racing stable in Australia or New Zealand: the stable and the pre-training and spelling farms it uses, horses and their owners' shares, every movement and its Stable Return, treatments and the stand-downs they cause, nominations, acceptances and results, trackwork, the costs passed on to owners, the monthly owner billing run, and owner updates.

## Rules

- Read the CLI result before answering. Every answer about a horse, owner, race, treatment or invoice starts with data from `node scripts/stable.mjs`. Never answer from memory.
- Resolve names first. If the CLI says a name is ambiguous, list the candidates and ask; never pick the first.
- Times are the stable's own clock (`settings.zone`). "6:30" is 6:30 am at the stable. Write them as `--at="2026-11-09 06:30"`.
- A treatment is recorded with what AR 104(2) asks: the product, route, amount, duration, who gave and authorised it, and why. Ask for what is missing; never fill it in yourself. `treat` stamps the record with the time it was written, so a late record shows as late. Never back-date one.
- Never enter or accept a horse inside a stand-down. `nominate` and `accept` refuse it; so do you. Say the rule and the first day the horse is eligible.
- A vet's withholding period goes in `--withhold-days` exactly as the vet gave it. Never guess a detection time.
- Never record a Stable Return, a nomination or an acceptance that nobody lodged. `lodge-return` records what a person already did, with the reference Racing Australia gave.
- Shares must add to 100. A sale goes through `sell-share`, never by editing a row, so the billing run splits each day by who owned the horse that day.
- Every write names `--actor`. That is a label in the activity log, not a verified identity.
- Never invent a treatment, a time, a dose, a race, a prizemoney figure or a fee. Copy them from the vet's note, the trainer, the club or the invoice.
- Never send, lodge, pay or delete. Owner updates, chasers and the Stewards record are drafts in `drafts/`; invoices and reports are in `docs-out/`. A person sends and lodges.
- The rules in `docs/compliance.md` are records checks against the Australian Rules of Racing, not advice from the Stewards. New Zealand trainers run under the New Zealand Rules of Racing: check each rule against them and change it with `/customise` before relying on it. If a rule looks out of date, say so and stop.
- Back up before a schema change. Use a new numbered migration (`/customise`), run `npm test`, and keep real data, exports and credentials out of Git.
- The database owner can bypass every application check. Protect that credential. Row security restricts unrelated database roles; a shared installation needs authenticated access.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| Accept a nominated horse for its race, with the jockey. Checks the stand-down, the Stable Return and the location again first. | `/accept` |
| The activity log: who did what, newest first. --days=N rows (default 30). | `/activity` |
| Add a horse joining the stable: name, sex, foaling date, breeding and the property it arrives at. Starts a movement waiting for its Stable Return (AR 296(2)(b)). | `/add-horse` |
| Add an owner: a person, a syndicate or a company, with email and phone. | `/add-owner` |
| Add a property: the stable, a pre-training farm or a spelling farm, with the daily rate owners pay while a horse is there. | `/add-premises` |
| Show what needs a person today: race entries inside a treatment stand-down, a bisphosphonate given under 4, Stable Returns not lodged, treatment records late or incomplete, acceptances and nominations closing, runners with no fast work, owner invoices overdue, shares not adding to 100%, owner updates due, charges not billed and long spells. | `/attention` |
| The monthly owner billing run for a finished month: one invoice per owner, daily fees for the days each horse spent at each property, every unbilled charge, each split by the share held on the day, GST added. Refuses a month twice. Nothing is sent. | `/bill` |
| What the billing run would charge each owner for a month, line by line, before anything is written: daily fees for the days at each property and every unbilled charge, split by the shares held on the day. | `/billing-preview` |
| Add a cost to pass on to a horse's owners: vet, farrier, dentist, transport, nomination, acceptance, gear or other. Shows how it splits by share. --no-gst for a fee charged without GST. | `/charge` |
| Costs spent on horses and passed to owners: vet, farrier, dentist, transport, nomination and acceptance fees, gear. --unbilled shows only those waiting for the next billing run. | `/charges` |
| Check the records against the rules in docs/compliance.md: treatment stand-downs (AR 86 to 88AA, 249, 255), bisphosphonates under 4 (AR 88A), treatment records by midnight (AR 104), Stable Returns (AR 103, AR 296) and the house rules for owner billing. Breaches first, each with its source. | `/compliance` |
| Make this system yours in plain language. Add a field, rename a stage, change a rule or a rate, add a column to a document. Writes the migration, applies it, updates the commands that touch it. | `/customise` |
| What each owner owes, split into not yet due, 1 to 30 days late and over 30 days late. | `/debtors` |
| Render owner invoices, AR 104 treatment records and horse reports for owners as branded HTML from the records. | `/documents` |
| Draft a polite note to an owner listing their unpaid invoices and the total. Written to drafts/, never sent. | `/draft-chaser` |
| Draft an update to a horse's owners from the records: where it is, its last two weeks of work, its last start and the plan. Written to drafts/, never sent. | `/draft-owner-update` |
| Draft a horse's treatment record for the last two years, as the Stewards may ask for it (AR 104(6)), with late entries marked. Written to drafts/. | `/draft-stewards-record` |
| Export every record to one JSON file the stable owns. | `/export` |
| One horse in full: where it is, its owners and shares, its last ten treatments with the day it is eligible again, its races, recent trackwork and every movement with its Stable Return. | `/horse` |
| Every horse in the stable, in work first, then pre-training and spelling: age on the 1 August birthday, where it is and since when, owners and shares, any stand-down, last fast work, next race and last owner update. --all includes horses that have left. | `/horses` |
| Bring horses, owners, shares and treatments across from Prism, or any stable spreadsheet saved as CSV. Dry run first. --map=<field>=<heading> for other headings. Import in that order. | `/import` |
| The ten questions Prism's screens do not answer directly: race entries inside a stand-down, late treatment records, unlodged Stable Returns, cost against prizemoney by horse, owners due an update, days in work against spelling this season, costs not yet billed, shares not adding to 100, runners with no fast work, and who owes. | `/insights` |
| Owner invoices with subtotal, GST, total and what is still owing. --owing shows only unpaid ones; --month=YYYY-MM one month. | `/invoices` |
| Record that the Stable Return amendment for a movement was lodged, with the reference Racing Australia gave. Only records what a person already lodged. | `/lodge-return` |
| Add a note to the activity log about a horse, owner, race or movement. | `/log` |
| Move a horse to another property or out of the stable (--to=left), at the local time it moved. Starts a Stable Return amendment that AR 296(2)(d) says is lodged immediately. Warns if the horse is entered for a race (AR 296(4)(a)). | `/move` |
| Every horse movement in and out of the stable and between properties, with its Stable Return: lodged (and how many hours after), pending or overdue. --pending shows only those waiting. | `/movements` |
| Add a read-only HTML view (a dashboard page) from a plain-language description, rendered in the stable's brand by `npm run view`. | `/new-view` |
| Nominate a horse for a race, or plan one (--status=planned). A nomination is refused inside a treatment stand-down (AR 86 to 88AA), for a horse not at the stable (AR 296(4)(a)) and while a Stable Return is not lodged (AR 103(2)). | `/nominate` |
| One owner in full: their shares (past and present) and every invoice with what is still owing. | `/owner` |
| Every owner with the horses they hold a share in and what they owe. | `/owners` |
| Record an owner payment against an invoice, in full or in part. | `/paid` |
| The stable, pre-training and spelling properties, each with its daily rate and how many horses are there now. | `/premises` |
| Races coming up: planned, nominated and accepted, with nomination and acceptance deadlines on the stable clock, the jockey, the day each horse is eligible and any problem (a stand-down clash, a Stable Return not lodged, a horse not at the stable). --all includes past and scratched races. | `/races` |
| Record a race result: where the horse finished and its prizemoney. | `/result` |
| Scratch a horse from a race, with the reason. | `/scratch` |
| Move part or all of one owner's share to another from a date. The seller keeps the rest. Reminds you to lodge the transfer within 7 days (AR 295(2)). | `/sell-share` |
| Change a house rule or stable setting: stable_name, zone, gst_bps, invoice_days, update_days, return_hours, work_gap_days or spell_days. | `/set` |
| Give an owner a share of a horse from a date. Refuses a share that would take the horse past 100%. | `/share` |
| The people at the stable: trainer, foreman, vet, farrier, strappers, riders and the office. | `/staff` |
| Every horse still inside a treatment stand-down, the rule and clear days behind it, the day it can race again, and any planned, nominated or accepted race that falls inside it. | `/stand-downs` |
| Record a medication or treatment as AR 104(2) asks: horse, local time given, product, route, amount, duration, who gave and authorised it, and why. Recorded now, so a late record shows as late. Prints the day the horse is eligible again and any race inside the stand-down. | `/treat` |
| The treatment register for the last 30 days (or --days=N, or --horse=<horse>): what was given, how, by whom, why, the day the horse is eligible again under the rule, and whether the record was written by midnight on the day (AR 104). | `/treatments` |
| Record that the owners of a horse were sent an update, with a one-line summary. | `/update` |
| Render the read-only dashboards in views.json (this week, where every horse is, the treatment register, owner accounts) as HTML in your brand. | `/view` |
| Write the Monday stable review to drafts/ from the rules, races coming up, horses stood down, owners who owe and everything that needs a person. | `/weekly-review` |
| Log trackwork: walk, trot, canter, gallop, swim, jump-out or trial, with distance, time, rider and a note. | `/work` |

If an ask fits nothing here, run `node scripts/stable.mjs --help`, answer from the records, then propose a new command for it.

## Where things live

- `scripts/stable.mjs` is the one CLI. `scripts/lib/domain.mjs` holds its rules.
- `supabase/migrations/` is the schema in plain SQL. `clear_days()` holds the stand-down for each kind of treatment and `v_treatments` works out the day each horse is eligible again. `v_races` finds any race inside a stand-down. `billing_lines()` and `bill_month()` are the owner billing run. `v_attention` is everything that needs a person, in one place: the CLI, the views and the documents all read it. `npm run migrate` applies it. `DATABASE_URL` chooses Postgres; unset, it uses PGlite in `.data/`.
- `settings` holds the house rules (`set` changes them). Rules and their sources are in `docs/compliance.md`.
- `views.json` and `documents.json` define the dashboards and documents. `brand.json` is your name, colours and logo.
- `docs/replace-prism.md` is the switching guide. `docs/cli.md` lists every option.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=prism&utm_medium=readme
