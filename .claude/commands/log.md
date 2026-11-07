---
description: "Add a note to the activity log about a horse, owner, race, movement, treatment or invoice."
---

# log

Add a note to the activity log about a horse, owner, race, movement, treatment or invoice.

Run `node scripts/stable.mjs log <horse, owner or ref> --note="<note>" --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Confirm it.
