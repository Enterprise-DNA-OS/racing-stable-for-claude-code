---
description: "Every horse still inside a treatment stand-down, the rule and clear days behind it, the day it can race again, and any planned, nominated or accepted race that falls inside it."
---

# stand-downs

Every horse still inside a treatment stand-down, the rule and clear days behind it, the day it can race again, and any planned, nominated or accepted race that falls inside it.

Run `node scripts/stable.mjs stand-downs`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Races inside a stand-down first: each one has to be scratched or never entered.
