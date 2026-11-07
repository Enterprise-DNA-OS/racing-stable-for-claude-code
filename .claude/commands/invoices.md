---
description: "Owner invoices with subtotal, GST, total and what is still owing. --owing shows only unpaid ones; --month=YYYY-MM one month."
---

# invoices

Owner invoices with subtotal, GST, total and what is still owing. --owing shows only unpaid ones; --month=YYYY-MM one month.

Run `node scripts/stable.mjs invoices [--owing] [--month=YYYY-MM]`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Late ones first.
