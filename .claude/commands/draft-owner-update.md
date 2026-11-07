---
description: "Draft an update to a horse's owners from the records: where it is, its last two weeks of work, its last start and the plan. Written to drafts/, never sent."
---

# draft-owner-update

Draft an update to a horse's owners from the records: where it is, its last two weeks of work, its last start and the plan. Written to drafts/, never sent.

Run `node scripts/stable.mjs draft-owner-update <horse>`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Show the draft. The trainer adds how the horse looks; once sent, record it with update.
