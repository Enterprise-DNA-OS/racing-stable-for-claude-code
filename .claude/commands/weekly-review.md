---
description: "Write the Monday stable review to drafts/ from the rules, races coming up, horses stood down, owners who owe and everything that needs a person."
---

# weekly-review

Write the Monday stable review to drafts/ from the rules, races coming up, horses stood down, owners who owe and everything that needs a person.

Run `node scripts/stable.mjs weekly-review`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Summarise in five lines: rules, races, stand-downs, money, owners.
