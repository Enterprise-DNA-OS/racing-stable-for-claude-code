---
description: "Accept a nominated horse for its race, with the jockey. Checks the stand-down, the Stable Return and the location again first."
---

# accept

Accept a nominated horse for its race, with the jockey. Checks the stand-down, the Stable Return and the location again first.

Run `node scripts/stable.mjs accept <race ref> [--jockey="<name>"] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Confirm the race, the date and the jockey.
