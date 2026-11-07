---
description: "Costs spent on horses and passed to owners: vet, farrier, dentist, transport, nomination and acceptance fees, gear. --unbilled shows only those waiting for the next billing run."
---

# charges

Costs spent on horses and passed to owners: vet, farrier, dentist, transport, nomination and acceptance fees, gear. --unbilled shows only those waiting for the next billing run.

Run `node scripts/stable.mjs charges [--unbilled]`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Totals by horse if the trainer asks what a horse is costing.
