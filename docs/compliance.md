# Rules and where they come from

`/compliance` checks the records against these rules. Each check cites its source. They are records checks, not advice from the Stewards: the trainer and the vet make every call, and the Stewards have the last word.

Source for every rule below: the **Australian Rules of Racing**, Racing Australia, as at 1 October 2026, https://www.racingaustralia.horse/FreeServices/Australian_Rules_Of_Racing.aspx (checked 7 November 2026). Principal racing authorities can add local rules on top; add yours with `/customise`.

**New Zealand trainers:** the New Zealand Rules of Racing govern you, not the Australian Rules. The checks here follow the same ideas (treatment records, stand-downs, horse locations) but the rule numbers and clear-day counts may differ. Check each one against the current New Zealand Rules and change `clear_days()` and these citations with `/customise` before you rely on them.

## How clear days are counted

Every stand-down rule says the horse is ineligible "for N clear days following midnight on the day" of the treatment. The rules' own notes give worked examples, and `npm test` checks each one:

| Treatment | Rule | Clear days | Given Monday the 1st, eligible |
|---|---|---|---|
| Shockwave therapy | AR 86(1) | 7 | Tuesday the 9th |
| Intra-synovial injection | AR 87(1) | 8 | Wednesday the 10th |
| Vaccine (races) | AR 88(1) | 5 | Sunday the 7th |
| Bisphosphonate, horse 4 or older | AR 88AA(2) | 30 | the 1st of the following month (day 32) |
| Stomach tube | AR 255(1) | 1 (not race day or the day before) | Wednesday the 3rd |
| Any medication | AR 249(1) | not on race day before the race | Tuesday the 2nd |

So the horse is eligible on the treatment day plus the clear days plus one. A vet's withholding period, entered as `--withhold-days`, extends this when it is longer.

## The rules checked

### No horse entered or started inside a stand-down (AR 86, 87, 88, 88AA, 249, 255)

- AR 86(1): after shockwave therapy "the horse is ineligible for; and a trainer must not enter or start the horse in, any race, official trial, or jump-out for 7 clear days following midnight on the day of the therapy."
- AR 87(1): the same for an intra-synovial injection, for 8 clear days.
- AR 88(1): a trainer must not, without permission, enter or permit a horse given a vaccine "to participate in any race during the 5 clear days following midnight on the day the dose of vaccine was administered." AR 88(2): the vaccine goes in the treatment record.
- AR 88AA(2): a horse 4 or older given any bisphosphonate "is ineligible to participate in any race, official trial or jump-out at any time during the 30 clear days following midnight on the day of the administration."
- AR 249(1): no medication on race day before the horse's race without the Stewards' permission.
- AR 255(1): no stomach-tubing on race day before the event, or during "the 1 clear day prior to 12.00am on the day of the scheduled race".

`nominate` and `accept` refuse an entry inside a stand-down. `v_races.clash` names any planned, nominated or accepted race that falls inside one, and `/attention` puts it first.

### No bisphosphonate given to a horse under 4 (AR 88A)

- AR 88A(2): a person must not administer, or be party to administering, "any bisphosphonate to a horse aged less than 4 years."
- AR 88A(3): such a horse is ineligible to race, trial, jump out or do trackwork "for a minimum of 12 months from the date of administration" and "not permitted to race until 1 August of the year the horse turns 4."
- AR 88A(4)(a): the trainer or owner notifies the Stewards as soon as practicable.

Age follows the 1 August birthday (`horse_age()`). A record of one is a breach and the eligible date is the later of the two dates above.

### Every treatment recorded by midnight on the day (AR 104)

- AR 104(1): "A trainer must record any medication or treatment administered to any horse in the trainer's care by midnight on the day on which the administration was given."
- AR 104(2): each record includes the horse, the date and time, the treatment or medication (brand name or active constituent), the route (injection, stomach tube, oral, topical or inhalation), the amount, the duration, the name of the person who gave and authorised it, and the reason.
- AR 104(3) and (4): "treatment" includes shockwave, acupuncture and laser, chiropractic, electrical stimulation, magnetic field therapy, ultrasound, oxygen therapy and taking a blood sample; "medication" includes scheduled, prescription, injectable, alkalinising and herbal preparations.
- AR 104(5): records are kept for at least 2 years. AR 104(6): they are made available to the Stewards on request (`/draft-stewards-record`, `npm run docs -- treatment-record`).

`treat` stamps each record with the time it was written. A record written after midnight on the day shows as late; one missing the route, the reason or who gave it shows as incomplete.

### Stable Return amended immediately when a horse joins, leaves or moves (AR 296)

- AR 296(2)(b): lodge a Stable Return "immediately upon a horse joining the trainer's stable".
- AR 296(2)(d): lodge an amendment immediately if the particulars change or "a horse leaves or joins the trainer's stable, or moves to another of the trainer's premises".
- AR 296(3)(b): when a horse leaves to spell, disclose the property it will be at.

"Immediately" is a house rule here: `return_hours` (24 by default). A movement past it with no return lodged is a breach; before it, pending.

### A Stable Return lodged before a horse is entered (AR 103)

- AR 103(2): a horse trained in Australia may not be entered for a race, official trial or jump-out unless a Stable Return for it is lodged before entries close.

`nominate` and `accept` refuse a horse with a movement still waiting for its return.

### An entered horse stabled at the licensed premises (AR 296(4))

- AR 296(4)(a): from entry to arrival on course, "except with the permission of the Stewards, the horse must be stabled only at the premises from which the horse's trainer is licensed to train". AR 296(5): for races with entries closing more than 60 days out, this runs from 6 days before the race.

`nominate` refuses a horse at a pre-training or spelling property, and `move` warns when an entered horse leaves the stable.

### Share transfers (AR 295)

- AR 295(2): a named horse transfer of ownership is lodged within 7 days of the transfer, or at least 24 hours before the horse is entered, whichever is earlier. AR 295(8): until it is registered, the horse cannot start without permission.

`sell-share` records the change in the stable's books from the day it happens and reminds you to lodge it.

## House rules (yours to change with `set`)

| Setting | Default | What it does |
|---|---|---|
| `return_hours` | 24 | Hours after a move before an unlodged Stable Return is a breach |
| `work_gap_days` | 14 | Most days between fast work (gallop, jump-out or trial) and a race |
| `update_days` | 14 | Most days between owner updates on a horse |
| `invoice_days` | 14 | Days an owner has to pay |
| `gst_bps` | 1000 | GST added to fees and to charges marked GST, in basis points (1000 = 10%; 1500 for New Zealand) |
| `spell_days` | 90 | A spell longer than this is raised for a decision |
| `zone` | Australia/Melbourne | The stable's clock |

Owner billing follows your training agreement: a daily rate at each property (training fee, pre-training, agistment) for each day the horse was there, plus costs passed on, each split by the share held on the day.
