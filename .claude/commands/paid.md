---
description: "Record an owner payment against an invoice, in full or in part."
---

# paid

Record an owner payment against an invoice, in full or in part.

Run `node scripts/stable.mjs paid <invoice> [--amount=<dollars>] [--on=YYYY-MM-DD] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Say what is still owing.
