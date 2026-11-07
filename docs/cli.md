# CLI reference

Every command is `node scripts/stable.mjs <command> [args] [--options]`. Add `--json` to any command for machine-readable output. Every write needs `--actor="<your name>"`. Times are the stable's own clock, written `"YYYY-MM-DD HH:MM"`; dates `YYYY-MM-DD`; months `YYYY-MM`; amounts in dollars (`180`, `1,250.50`).

Names match case-insensitively. A partial name, code or reference works when it is unique; when it is not, the command lists the candidates and stops.

## accept

Accept a nominated horse for its race, with the jockey. Checks the stand-down, the Stable Return and the location again first.

```
node scripts/stable.mjs accept <race ref> [--jockey="<name>"] --actor="<you>"
```

## activity

The activity log: who did what, newest first. --days=N rows (default 30).

```
node scripts/stable.mjs activity [--days=N]
```

## add-horse

Add a horse joining the stable: name, sex, foaling date, breeding and the property it arrives at. Starts a movement waiting for its Stable Return (AR 296(2)(b)).

```
node scripts/stable.mjs add-horse "<name>" --sex=colt|filly|gelding|mare|horse --foaled=YYYY-MM-DD --at=<property> [--sire=] [--dam=] [--colour=] [--when="YYYY-MM-DD HH:MM"] --actor="<you>"
```

## add-owner

Add an owner: a person, a syndicate or a company, with email and phone.

```
node scripts/stable.mjs add-owner "<name>" [--kind=person|syndicate|company] [--email=] [--phone=] --actor="<you>"
```

## add-premises

Add a property: the stable, a pre-training farm or a spelling farm, with the daily rate owners pay while a horse is there.

```
node scripts/stable.mjs add-premises <CODE> --name="<name>" --kind=stable|pre-training|spelling --rate=<dollars a day> [--address=] --actor="<you>"
```

## attention

Show what needs a person today: race entries inside a treatment stand-down, a bisphosphonate given under 4, Stable Returns not lodged, treatment records late or incomplete, acceptances and nominations closing, runners with no fast work, owner invoices overdue, shares not adding to 100%, owner updates due, charges not billed and long spells.

```
node scripts/stable.mjs attention
```

## bill

The monthly owner billing run for a finished month: one invoice per owner, daily fees for the days each horse spent at each property, every unbilled charge, each split by the share held on the day, GST added. Refuses a month twice. Nothing is sent.

```
node scripts/stable.mjs bill --month=YYYY-MM [--issued=YYYY-MM-DD] --actor="<you>"
```

## billing-preview

What the billing run would charge each owner for a month, line by line, before anything is written: daily fees for the days at each property and every unbilled charge, split by the shares held on the day.

```
node scripts/stable.mjs billing-preview --month=YYYY-MM
```

## charge

Add a cost to pass on to a horse's owners: vet, farrier, dentist, transport, nomination, acceptance, gear or other. Shows how it splits by share. --no-gst for a fee charged without GST.

```
node scripts/stable.mjs charge <horse> --kind=<kind> --amount=<dollars> --description="<what>" [--on=YYYY-MM-DD] [--no-gst] --actor="<you>"
```

## charges

Costs spent on horses and passed to owners: vet, farrier, dentist, transport, nomination and acceptance fees, gear. --unbilled shows only those waiting for the next billing run.

```
node scripts/stable.mjs charges [--unbilled]
```

## compliance

Check the records against the rules in docs/compliance.md: treatment stand-downs (AR 86 to 88AA, 249, 255), bisphosphonates under 4 (AR 88A), treatment records by midnight (AR 104), Stable Returns (AR 103, AR 296) and the house rules for owner billing. Breaches first, each with its source.

```
node scripts/stable.mjs compliance
```

## debtors

What each owner owes, split into not yet due, 1 to 30 days late and over 30 days late.

```
node scripts/stable.mjs debtors
```

## draft-chaser

Draft a polite note to an owner listing their unpaid invoices and the total. Written to drafts/, never sent.

```
node scripts/stable.mjs draft-chaser <owner>
```

## draft-owner-update

Draft an update to a horse's owners from the records: where it is, its last two weeks of work, its last start and the plan. Written to drafts/, never sent.

```
node scripts/stable.mjs draft-owner-update <horse>
```

## draft-stewards-record

Draft a horse's treatment record for the last two years, as the Stewards may ask for it (AR 104(6)), with late entries marked. Written to drafts/.

```
node scripts/stable.mjs draft-stewards-record <horse>
```

## export

Export every record to one JSON file the stable owns.

```
node scripts/stable.mjs export [--out=<file>]
```

## horse

One horse in full: where it is, its owners and shares, its last ten treatments with the day it is eligible again, its races, recent trackwork and every movement with its Stable Return.

```
node scripts/stable.mjs horse <horse>
```

## horses

Every horse in the stable, in work first, then pre-training and spelling: age on the 1 August birthday, where it is and since when, owners and shares, any stand-down, last fast work, next race and last owner update. --all includes horses that have left.

```
node scripts/stable.mjs horses [--all]
```

## import

Bring horses, owners, shares and treatments across from Prism, or any stable spreadsheet saved as CSV. Dry run first. --map=<field>=<heading> for other headings. Import in that order.

```
node scripts/stable.mjs import prism <file.csv> --kind=horses|owners|shares|treatments [--at=<property>] [--map=<field>=<heading>] [--dry-run] --actor="<you>"
```

## insights

The ten questions Prism's screens do not answer directly: race entries inside a stand-down, late treatment records, unlodged Stable Returns, cost against prizemoney by horse, owners due an update, days in work against spelling this season, costs not yet billed, shares not adding to 100, runners with no fast work, and who owes.

```
node scripts/stable.mjs insights
```

## invoices

Owner invoices with subtotal, GST, total and what is still owing. --owing shows only unpaid ones; --month=YYYY-MM one month.

```
node scripts/stable.mjs invoices [--owing] [--month=YYYY-MM]
```

## lodge-return

Record that the Stable Return amendment for a movement was lodged, with the reference Racing Australia gave. Only records what a person already lodged.

```
node scripts/stable.mjs lodge-return <movement or horse> --reference=<receipt> [--at="YYYY-MM-DD HH:MM"] --actor="<you>"
```

## move

Move a horse to another property or out of the stable (--to=left), at the local time it moved. Starts a Stable Return amendment that AR 296(2)(d) says is lodged immediately. Warns if the horse is entered for a race (AR 296(4)(a)).

```
node scripts/stable.mjs move <horse> --to=<property>|left [--at="YYYY-MM-DD HH:MM"] [--reason=] --actor="<you>"
```

## movements

Every horse movement in and out of the stable and between properties, with its Stable Return: lodged (and how many hours after), pending or overdue. --pending shows only those waiting.

```
node scripts/stable.mjs movements [--pending]
```

## nominate

Nominate a horse for a race, or plan one (--status=planned). A nomination is refused inside a treatment stand-down (AR 86 to 88AA), for a horse not at the stable (AR 296(4)(a)) and while a Stable Return is not lodged (AR 103(2)).

```
node scripts/stable.mjs nominate <horse> --venue="<venue>" --date=YYYY-MM-DD [--race=N] [--name="<race>"] [--distance=<m>] [--noms-close="YYYY-MM-DD HH:MM"] [--acceptances="YYYY-MM-DD HH:MM"] [--status=planned|nominated] --actor="<you>"
```

## owner

One owner in full: their shares (past and present) and every invoice with what is still owing.

```
node scripts/stable.mjs owner <owner>
```

## owners

Every owner with the horses they hold a share in and what they owe.

```
node scripts/stable.mjs owners
```

## paid

Record an owner payment against an invoice, in full or in part.

```
node scripts/stable.mjs paid <invoice> [--amount=<dollars>] [--on=YYYY-MM-DD] --actor="<you>"
```

## premises

The stable, pre-training and spelling properties, each with its daily rate and how many horses are there now.

```
node scripts/stable.mjs premises
```

## races

Races coming up: planned, nominated and accepted, with nomination and acceptance deadlines on the stable clock, the jockey, the day each horse is eligible and any problem (a stand-down clash, a Stable Return not lodged, a horse not at the stable). --all includes past and scratched races.

```
node scripts/stable.mjs races [--all]
```

## result

Record a race result: where the horse finished and its prizemoney.

```
node scripts/stable.mjs result <race ref> --finish=N [--prizemoney=<dollars>] --actor="<you>"
```

## scratch

Scratch a horse from a race, with the reason.

```
node scripts/stable.mjs scratch <race ref> --reason="<why>" --actor="<you>"
```

## sell-share

Move part or all of one owner's share to another from a date. The seller keeps the rest. Reminds you to lodge the transfer within 7 days (AR 295(2)).

```
node scripts/stable.mjs sell-share <horse> --from-owner=<owner> --to-owner=<owner> --percent=<n> --on=YYYY-MM-DD --actor="<you>"
```

## set

Change a house rule or stable setting: stable_name, zone, gst_bps, invoice_days, update_days, return_hours, work_gap_days or spell_days.

```
node scripts/stable.mjs set <key> <value> --actor="<you>"
```

## share

Give an owner a share of a horse from a date. Refuses a share that would take the horse past 100%.

```
node scripts/stable.mjs share <horse> <owner> --percent=<n> [--from=YYYY-MM-DD] --actor="<you>"
```

## staff

The people at the stable: trainer, foreman, vet, farrier, strappers, riders and the office.

```
node scripts/stable.mjs staff
```

## stand-downs

Every horse still inside a treatment stand-down, the rule and clear days behind it, the day it can race again, and any planned, nominated or accepted race that falls inside it.

```
node scripts/stable.mjs stand-downs
```

## treat

Record a medication or treatment as AR 104(2) asks: horse, local time given, product, route, amount, duration, who gave and authorised it, and why. Recorded now, so a late record shows as late. Prints the day the horse is eligible again and any race inside the stand-down.

```
node scripts/stable.mjs treat <horse> --kind=medication|vaccine|intra-synovial|shockwave|bisphosphonate|stomach-tube|other-treatment --product="<product>" --route=injection|stomach-tube|oral|topical|inhalation|other [--amount=] [--duration=] --given-by="<name>" [--authorised-by=] --reason="<why>" [--at="YYYY-MM-DD HH:MM"] [--withhold-days=N] --actor="<you>"
```

## treatments

The treatment register for the last 30 days (or --days=N, or --horse=<horse>): what was given, how, by whom, why, the day the horse is eligible again under the rule, and whether the record was written by midnight on the day (AR 104).

```
node scripts/stable.mjs treatments [--days=N] [--horse=<horse>]
```

## update

Record that the owners of a horse were sent an update, with a one-line summary.

```
node scripts/stable.mjs update <horse> --summary="<what they were told>" [--on=YYYY-MM-DD] --actor="<you>"
```

## weekly-review

Write the Monday stable review to drafts/ from the rules, races coming up, horses stood down, owners who owe and everything that needs a person.

```
node scripts/stable.mjs weekly-review
```

## work

Log trackwork: walk, trot, canter, gallop, swim, jump-out or trial, with distance, time, rider and a note.

```
node scripts/stable.mjs work <horse> --kind=walk|trot|canter|gallop|swim|jump-out|trial [--distance=<m>] [--time="<time>"] [--rider=] [--note=] [--on=YYYY-MM-DD] --actor="<you>"
```

## log

Add a note to the activity log about a horse, owner, race or movement.

```
node scripts/stable.mjs log <horse, owner or ref> --note="<note>" --actor="<you>"
```
