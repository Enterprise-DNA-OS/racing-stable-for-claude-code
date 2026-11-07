---
description: "The monthly owner billing run for a finished month: one invoice per owner, daily fees for the days each horse spent at each property, every unbilled charge, each split by the share held on the day, GST added. Refuses a month twice. Nothing is sent."
---

# bill

The monthly owner billing run for a finished month: one invoice per owner, daily fees for the days each horse spent at each property, every unbilled charge, each split by the share held on the day, GST added. Refuses a month twice. Nothing is sent.

Run `node scripts/stable.mjs bill --month=YYYY-MM [--issued=YYYY-MM-DD] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Run billing-preview first and show the totals. Then npm run docs -- owner-invoice for the documents.
