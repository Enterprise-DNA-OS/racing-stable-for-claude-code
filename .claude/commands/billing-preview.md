---
description: "What the billing run would charge each owner for a month, line by line, before anything is written: daily fees for the days at each property and every unbilled charge, split by the shares held on the day."
---

# billing-preview

What the billing run would charge each owner for a month, line by line, before anything is written: daily fees for the days at each property and every unbilled charge, split by the shares held on the day.

Run `node scripts/stable.mjs billing-preview --month=YYYY-MM`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Totals per owner, then any line that looks wrong (shares not 100, a horse with no owners).
