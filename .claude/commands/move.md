---
description: "Move a horse to another property or out of the stable (--to=left), at the local time it moved. Starts a Stable Return amendment that AR 296(2)(d) says is lodged immediately. Warns if the horse is entered for a race (AR 296(4)(a))."
---

# move

Move a horse to another property or out of the stable (--to=left), at the local time it moved. Starts a Stable Return amendment that AR 296(2)(d) says is lodged immediately. Warns if the horse is entered for a race (AR 296(4)(a)).

Run `node scripts/stable.mjs move <horse> --to=<property>|left [--at="YYYY-MM-DD HH:MM"] [--reason=] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Lead with the Stable Return to lodge now.
