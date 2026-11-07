---
description: "The treatment register for the last 30 days (or --days=N, or --horse=<horse>): what was given, how, by whom, why, the day the horse is eligible again under the rule, and whether the record was written by midnight on the day (AR 104)."
---

# treatments

The treatment register for the last 30 days (or --days=N, or --horse=<horse>): what was given, how, by whom, why, the day the horse is eligible again under the rule, and whether the record was written by midnight on the day (AR 104).

Run `node scripts/stable.mjs treatments [--days=N] [--horse=<horse>]`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Late and incomplete records first, with what AR 104(2) still needs.
