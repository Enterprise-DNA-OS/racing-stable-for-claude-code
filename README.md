<h1 align="center">Racing Stable for Claude Code</h1>

<p align="center">
  <strong>The open-source racing stable system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Prism data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=prism">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/prism?utm_source=github&utm_medium=readme&utm_campaign=prism">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-prism">Instead of Prism</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Racing Stable for Claude Code does the job you pay Prism for, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and it can answer questions the Prism dashboard cannot.

Prism prices each module by the number of horses you train: from $30 a month per module for 1 to 14 horses, $90 for 15 to 49, $125 for 50 to 99 and $150 for 100 or more, before setup and onboarding fees ([prism.horse pricing](https://www.prism.horse/pricing), checked 7 November 2026). A stable on Stable Management, Finance and Communications pays for three modules, and every horse that comes in can move it up a band. Here the database is yours, and the hundredth horse costs what the first one did.

Want the same thing with an owner portal, or a treatment form on the strappers' phones? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=prism).

It covers a thoroughbred racing stable in Australia or New Zealand, from a ten-horse trainer to a stable with pre-training and spelling farms. Every treatment is recorded the way AR 104 asks, and the day each horse is eligible again is worked out from the Australian Rules of Racing (shockwave 7 clear days, intra-synovial 8, vaccines 5, bisphosphonates 30, and no bisphosphonate at all under 4). A nomination inside a stand-down is refused. Every movement carries its Stable Return, and the monthly owner billing run splits each day's training fee, pre-training or agistment by the shares held that day.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No modules, no horse bands, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/racing-stable-for-claude-code.git
cd racing-stable-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type `/attention`. Try `/stand-downs`, `/races` and `/insights` next.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

| Command | What it does |
|---|---|
| `/attention` | Everything that needs a person today, rule breaches first: race clashes, Stable Returns, late treatment records, closing acceptances, owners who owe. |
| `/compliance` | The records checked against the Australian Rules of Racing, each rule with its source. |
| `/stand-downs` | Every horse still inside a stand-down, the rule, the day it can race and any race inside it. |
| `/races` | Races coming up with nominations and acceptances closing, the jockey and any problem. |
| `/treat` | Record a treatment as AR 104(2) asks. Prints the eligible date and any race it clashes with. |
| `/treatments` | The treatment register, late and incomplete records flagged. |
| `/nominate`, `/accept`, `/scratch`, `/result` | The race week. Entries inside a stand-down, away from the stable or before the Stable Return are refused. |
| `/move`, `/lodge-return`, `/movements` | Horses in, out and between properties, each with its Stable Return (AR 296). |
| `/horses`, `/horse` | Where every horse is, its owners, its stand-down, last fast work and next race. |
| `/share`, `/sell-share` | Owners' shares from a date. A sale splits billing on the day it happens. |
| `/charge`, `/billing-preview`, `/bill`, `/paid` | Costs passed on, the month's owner billing run with GST, and payments. |
| `/invoices`, `/debtors` | Owner accounts and who is late. |
| `/draft-owner-update`, `/draft-chaser`, `/draft-stewards-record` | Owner updates, payment notes and the AR 104 record for the Stewards, drafted from the records. Never sent. |
| `/weekly-review` | The Monday stable review, written from the records. |
| `/insights` | Ten questions Prism's screens do not answer directly. |
| `/import` | Horses, owners, shares and treatments from Prism or a spreadsheet, dry run first. |
| `/customise` | Change a field, a rate or a rule in plain language. |

The rest: `/add-horse`, `/add-owner`, `/add-premises`, `/work`, `/update`, `/set`, `/log`, `/owners`, `/owner`, `/premises`, `/staff`, `/charges`, `/activity`, `/export`, `/view`, `/documents` and `/new-view`. 47 commands in all; [docs/cli.md](docs/cli.md) lists every option.

Names match case-insensitively. A partial name or reference works when it is unique; when it is not, the command lists the candidates and stops.

## The gates

- `/nominate` and `/accept` refuse a horse inside a treatment stand-down (AR 86 to 88AA), a horse at a pre-training or spelling property (AR 296(4)(a)), and a horse whose Stable Return is not lodged (AR 103(2)).
- `/treat` records the time it was written, so a treatment written up after midnight shows as late (AR 104(1)). It names what AR 104(2) still needs, and calls out a bisphosphonate given under 4 (AR 88A).
- `/share` refuses a share that would take a horse past 100%. `/sell-share` closes the seller's share the day before the sale.
- `/bill` bills a month once, only after it has finished, and marks every charge it billed.

The software records and checks; the trainer and the vet decide, and the Stewards have the last word. It is not advice, and it lodges, sends and pays nothing.

## Instead of Prism

Save your horses, owners, shares and treatments from Prism as CSV, then import them in that order, dry run first:

```bash
node scripts/stable.mjs import prism horses.csv --kind=horses --at=CRAN --actor="Your name" --dry-run
node scripts/stable.mjs import prism treatments.csv --kind=treatments --actor="Your name" --dry-run
```

Any horse still inside a stand-down shows in `/stand-downs` straight away. The [switching guide](docs/replace-prism.md) covers the headings it reads, `--map` for other headings, what comes across and what does not. Imports are atomic: repeat rows are skipped and one bad row stops the whole file.

## Ten questions answered from your records

`/insights` runs all ten today.

1. Which horses are nominated or accepted for a race they are not eligible to run in because of a treatment?
2. Which treatment records were written after midnight on the day the treatment was given?
3. Which horses moved without the Stable Return amendment being lodged, and for how long?
4. What has each horse cost its owners in the last 90 days against the prizemoney it won?
5. Which horses have owners who have not had an update in the last two weeks?
6. How many days has each horse spent in work, pre-training and spelling this season?
7. Which costs have been spent on a horse but not yet billed to its owners?
8. Which horses have shares that do not add up to 100%, and who holds the rest?
9. Which horses are entered to race with no gallop, jump-out or trial in the two weeks before?
10. Which owners owe money, how much, and how late?

## Your first hour: ten things to ask for

1. What needs my attention today?
2. Who is stood down, and can Southern Arrow still run at Caulfield?
3. Priya gave Copper Bay a hyaluronic injection in the near fore at 7.15 this morning for heat in the joint. Record it.
4. Harbour Lights came in from Ridgeview two days ago. Lodge the return: the reference is SR-57001.
5. Nominate Lucky Ledger for the Pakenham maiden on the 17th.
6. Raj is selling 20% of Southern Arrow to Ana Torres from Monday.
7. What would last month's owner invoices come to? Then bill it.
8. Who owes us money, and draft a note to the ones over 30 days.
9. Write the owner update for Copper Bay after Sandown.
10. Put our name, logo and ABN on the owner invoices through `/customise`.

## Verification

`npm test` runs every command on a temporary database with the demo stable: migrations, repeatable seed data, the 1 August birthday, every stand-down against the rules' own worked examples (shockwave, intra-synovial, vaccine, bisphosphonate at 4 and under 4, stomach tube, race-day medication, a vet's withholding period), nominations and acceptances refused inside a stand-down, away from the stable and before the Stable Return, late and incomplete treatment records, movements and returns, shares that cannot pass 100 and a mid-month share sale, the billing run (days at each property, shares by day, a horse that left mid-month, GST and GST-free charges, once only, finished months only), part and full payments, drafts, Prism imports with dry run, repeats and rollback, export, the activity log, database checks, views, documents and escaped HTML. Set `TEST_DATABASE_URL` to run the same checks on an empty Postgres database.

Read the [operating rules](CLAUDE.md), the [rules and sources](docs/compliance.md), the [selection evidence](docs/research.md) and [why there is no front end](docs/why-no-front-end.md).

## Architecture

```
racing-stable-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/stable.mjs        the one CLI the commands drive
  scripts/lib/domain.mjs    its rules
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema, views and the billing run
  supabase/seed.sql         demo data (Hollow Creek Racing, fictional)
  views.json, documents.json  dashboards and documents in your brand
  docs/                     rules and sources, the switching guide, the CLI reference
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Racing Stable for Claude Code for your stable, migrates your Prism data, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=prism)
- Read more: [enterprisedna.co/omni/instead-of/prism](https://enterprisedna.co/omni/instead-of/prism?utm_source=github&utm_medium=readme&utm_campaign=prism)

## License

MIT. Copyright (c) 2026 Enterprise DNA.
