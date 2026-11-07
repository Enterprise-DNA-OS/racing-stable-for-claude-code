---
description: "The ten questions Prism's screens do not answer directly: race entries inside a stand-down, late treatment records, unlodged Stable Returns, cost against prizemoney by horse, owners due an update, days in work against spelling this season, costs not yet billed, shares not adding to 100, runners with no fast work, and who owes."
---

# insights

The ten questions Prism's screens do not answer directly: race entries inside a stand-down, late treatment records, unlodged Stable Returns, cost against prizemoney by horse, owners due an update, days in work against spelling this season, costs not yet billed, shares not adding to 100, runners with no fast work, and who owes.

Run `node scripts/stable.mjs insights`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

One line per question with the answer, then the rows that matter.
