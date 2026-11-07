---
description: "Log trackwork: walk, trot, canter, gallop, swim, jump-out or trial, with distance, time, rider and a note."
---

# work

Log trackwork: walk, trot, canter, gallop, swim, jump-out or trial, with distance, time, rider and a note.

Run `node scripts/stable.mjs work <horse> --kind=walk|trot|canter|gallop|swim|jump-out|trial [--distance=<m>] [--time="<time>"] [--rider=] [--note=] [--on=YYYY-MM-DD] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

One line back.
