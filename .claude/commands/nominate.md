---
description: "Nominate a horse for a race, or plan one (--status=planned). A nomination is refused inside a treatment stand-down (AR 86 to 88AA), for a horse not at the stable (AR 296(4)(a)) and while a Stable Return is not lodged (AR 103(2))."
---

# nominate

Nominate a horse for a race, or plan one (--status=planned). A nomination is refused inside a treatment stand-down (AR 86 to 88AA), for a horse not at the stable (AR 296(4)(a)) and while a Stable Return is not lodged (AR 103(2)).

Run `node scripts/stable.mjs nominate <horse> --venue="<venue>" --date=YYYY-MM-DD [--race=N] [--name="<race>"] [--distance=<m>] [--noms-close="YYYY-MM-DD HH:MM"] [--acceptances="YYYY-MM-DD HH:MM"] [--status=planned|nominated] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

If it is refused, say the rule and the first day it would be allowed.
