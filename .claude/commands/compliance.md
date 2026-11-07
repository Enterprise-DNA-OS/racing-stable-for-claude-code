---
description: "Check the records against the rules in docs/compliance.md: treatment stand-downs (AR 86 to 88AA, 249, 255), bisphosphonates under 4 (AR 88A), treatment records by midnight (AR 104), Stable Returns (AR 103, AR 296) and the house rules for owner billing. Breaches first, each with its source."
---

# compliance

Check the records against the rules in docs/compliance.md: treatment stand-downs (AR 86 to 88AA, 249, 255), bisphosphonates under 4 (AR 88A), treatment records by midnight (AR 104), Stable Returns (AR 103, AR 296) and the house rules for owner billing. Breaches first, each with its source.

Run `node scripts/stable.mjs compliance`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Breaches first, then what to fix. These are records checks against the Australian Rules of Racing, not advice from the Stewards.
