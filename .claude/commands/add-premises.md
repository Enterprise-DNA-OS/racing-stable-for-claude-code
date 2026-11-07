---
description: "Add a property: the stable, a pre-training farm or a spelling farm, with the daily rate owners pay while a horse is there."
---

# add-premises

Add a property: the stable, a pre-training farm or a spelling farm, with the daily rate owners pay while a horse is there.

Run `node scripts/stable.mjs add-premises <CODE> --name="<name>" --kind=stable|pre-training|spelling --rate=<dollars a day> [--address=] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Confirm the rate before saving it.
