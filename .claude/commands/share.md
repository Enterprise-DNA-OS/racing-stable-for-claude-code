---
description: "Give an owner a share of a horse from a date. Refuses a share that would take the horse past 100%."
---

# share

Give an owner a share of a horse from a date. Refuses a share that would take the horse past 100%.

Run `node scripts/stable.mjs share <horse> <owner> --percent=<n> [--from=YYYY-MM-DD] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Say what the horse is held at now.
