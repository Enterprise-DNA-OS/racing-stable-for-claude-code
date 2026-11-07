---
description: "Record a race result: where the horse finished and its prizemoney."
---

# result

Record a race result: where the horse finished and its prizemoney.

Run `node scripts/stable.mjs result <race ref> --finish=N [--prizemoney=<dollars>] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Offer draft-owner-update for the horse.
