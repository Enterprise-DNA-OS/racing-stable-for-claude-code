---
description: "Bring horses, owners, shares and treatments across from Prism, or any stable spreadsheet saved as CSV. Dry run first. --map=<field>=<heading> for other headings. Import in that order."
---

# import

Bring horses, owners, shares and treatments across from Prism, or any stable spreadsheet saved as CSV. Dry run first. --map=<field>=<heading> for other headings. Import in that order.

Run `node scripts/stable.mjs import prism <file.csv> --kind=horses|owners|shares|treatments [--at=<property>] [--map=<field>=<heading>] [--dry-run] --actor="<you>"`. Add `--json` when you need every field. Resolve the horse, owner, race, property or invoice by name first; if the CLI says a name is ambiguous, list the candidates and ask. Replace every angle-bracket value with a fact from the records or the trainer. Never run a placeholder.

Always dry run first and show what would come in.
