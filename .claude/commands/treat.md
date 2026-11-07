---
description: "Record a medication or treatment as AR 104(2) asks: horse, local time given, product, route, amount, duration, who gave and authorised it, and why. Recorded now, so a late record shows as late. Prints the day the horse is eligible again and any race inside the stand-down."
---

# treat

Record a medication or treatment as AR 104(2) asks: horse, local time given, product, route, amount, duration, who gave and authorised it, and why. Recorded now, so a late record shows as late. Prints the day the horse is eligible again and any race inside the stand-down.

Run `node scripts/stable.mjs treat <horse> --kind=medication|vaccine|intra-synovial|shockwave|bisphosphonate|stomach-tube|other-treatment --product="<product>" --route=injection|stomach-tube|oral|topical|inhalation|other [--amount=] [--duration=] --given-by="<name>" [--authorised-by=] --reason="<why>" [--at="YYYY-MM-DD HH:MM"] [--withhold-days=N] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Lead with the eligible date and any race that now has to be scratched.
