---
description: "Add a horse joining the stable: name, sex, foaling date, breeding and the property it arrives at. Starts a movement waiting for its Stable Return (AR 296(2)(b))."
---

# add-horse

Add a horse joining the stable: name, sex, foaling date, breeding and the property it arrives at. Starts a movement waiting for its Stable Return (AR 296(2)(b)).

Run `node scripts/stable.mjs add-horse "<name>" --sex=colt|filly|gelding|mare|horse --foaled=YYYY-MM-DD --at=<property> [--sire=] [--dam=] [--colour=] [--when="YYYY-MM-DD HH:MM"] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Then remind them to lodge the Stable Return and add the owners with share.
