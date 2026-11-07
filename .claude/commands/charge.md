---
description: "Add a cost to pass on to a horse's owners: vet, farrier, dentist, transport, nomination, acceptance, gear or other. Shows how it splits by share. --no-gst for a fee charged without GST."
---

# charge

Add a cost to pass on to a horse's owners: vet, farrier, dentist, transport, nomination, acceptance, gear or other. Shows how it splits by share. --no-gst for a fee charged without GST.

Run `node scripts/stable.mjs charge <horse> --kind=<kind> --amount=<dollars> --description="<what>" [--on=YYYY-MM-DD] [--no-gst] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Show the split.
