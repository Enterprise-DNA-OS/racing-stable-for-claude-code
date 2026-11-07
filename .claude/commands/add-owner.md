---
description: "Add an owner: a person, a syndicate or a company, with email and phone."
---

# add-owner

Add an owner: a person, a syndicate or a company, with email and phone.

Run `node scripts/stable.mjs add-owner "<name>" [--kind=person|syndicate|company] [--email=] [--phone=] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Then offer share to give them a horse.
