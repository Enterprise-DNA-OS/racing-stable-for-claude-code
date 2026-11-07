---
description: "Draft a horse's treatment record for the last two years, as the Stewards may ask for it (AR 104(6)), with late entries marked. Written to drafts/."
---

# draft-stewards-record

Draft a horse's treatment record for the last two years, as the Stewards may ask for it (AR 104(6)), with late entries marked. Written to drafts/.

Run `node scripts/stable.mjs draft-stewards-record <horse>`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Say how many records and how many were late.
