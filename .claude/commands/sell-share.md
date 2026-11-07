---
description: "Move part or all of one owner's share to another from a date. The seller keeps the rest. Reminds you to lodge the transfer within 7 days (AR 295(2))."
---

# sell-share

Move part or all of one owner's share to another from a date. The seller keeps the rest. Reminds you to lodge the transfer within 7 days (AR 295(2)).

Run `node scripts/stable.mjs sell-share <horse> --from-owner=<owner> --to-owner=<owner> --percent=<n> --on=YYYY-MM-DD --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Then the AR 295 transfer reminder.
