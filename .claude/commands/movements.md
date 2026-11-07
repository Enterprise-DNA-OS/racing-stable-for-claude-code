---
description: "Every horse movement in and out of the stable and between properties, with its Stable Return: lodged (and how many hours after), pending or overdue. --pending shows only those waiting."
---

# movements

Every horse movement in and out of the stable and between properties, with its Stable Return: lodged (and how many hours after), pending or overdue. --pending shows only those waiting.

Run `node scripts/stable.mjs movements [--pending]`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Overdue returns first, with hours since the move.
