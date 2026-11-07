# Examples

`prism/` holds four small files in the shape a stable's records come out of Prism or a spreadsheet: horses, owners, shares and treatments.
Column headings are matched loosely (Horse Name or Horse, Foal Date or DOB, Share % or Percentage); `--map=<field>=<your heading>` covers anything else.

```
node scripts/stable.mjs import prism examples/prism/horses.csv --kind=horses --at=CRAN --actor="You" --dry-run
```

Import in this order: horses, owners, shares, treatments.
