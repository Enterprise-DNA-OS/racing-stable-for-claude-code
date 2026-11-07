# Moving off Prism

Bring your horses, owners, shares and treatments across in an afternoon. Keep Prism running until the first billing run here matches.

## 1. Get your records out of Prism

From Prism's reports, save each of these lists as a spreadsheet, then as CSV:

1. **Horses**: name, sex, foal date, colour, sire, dam and where each horse is now.
2. **Owners**: name, email and phone.
3. **Shares**: horse, owner and share percentage.
4. **Treatments** (the last two years at least, AR 104(5)): horse, date, time, treatment or medication, route, dose, who gave it and why.

Prism does not publish its export format. The import reads the common headings (Horse Name or Horse, Foal Date or DOB, Share % or Percentage, Administered By or Vet) and `--map=<field>=<your heading>` covers anything else. `examples/prism/` shows the shape.

## 2. Set up your properties

```bash
node scripts/stable.mjs add-premises CRAN --name="Cranbourne stables" --kind=stable --rate=135 --actor="You"
node scripts/stable.mjs add-premises GLEN --name="Glenmore Park spelling" --kind=spelling --rate=32 --actor="You"
```

The rate is what owners pay per horse per day at that property, before GST.

## 3. Import, dry run first, in this order

```bash
node scripts/stable.mjs import prism horses.csv --kind=horses --at=CRAN --actor="You" --dry-run
node scripts/stable.mjs import prism horses.csv --kind=horses --at=CRAN --actor="You"
node scripts/stable.mjs import prism owners.csv --kind=owners --actor="You"
node scripts/stable.mjs import prism shares.csv --kind=shares --actor="You"
node scripts/stable.mjs import prism treatments.csv --kind=treatments --actor="You"
```

Each file is all or nothing: one bad row stops it and nothing is written. Repeat rows are skipped, so a second run is safe.

## What comes across

| Prism | Here |
|---|---|
| Horse, sex, foal date, colour, sire, dam | `horses` (sex letters C, F, G, M, H read as colt, filly, gelding, mare, horse) |
| Current location | the horse's first movement, at the property whose name matches, Stable Return marked as carried over |
| Owner name, email, phone | `owners` (syndicates and companies recognised by name) |
| Share percentage | `shares` from the import day, or the date in the file |
| Treatment, route, dose, who gave it, reason | `treatments`, with its kind (vaccine, intra-synovial, shockwave, bisphosphonate, stomach tube, other) read from the product name; check each |

## What does not come across

- **Past invoices and payments.** Bring opening balances across as one charge per owner, or keep Prism read-only for history.
- **Trackwork history, race history, documents and photos.** Ask Claude Code to map the CSV if you have it; attachments stay in your Prism copy.
- **When each treatment was written up.** Prism's list does not say, so imported records read as on time. Records you write from here on carry the real time.
- **Racing Australia's daily file and the owner portal.** Here a person lodges Stable Returns and records them; owners get updates by email.

## Check it

```bash
node scripts/stable.mjs horses
node scripts/stable.mjs stand-downs
node scripts/stable.mjs billing-preview --month=<last month>
```

Every horse should show 100% shares. Compare the preview with Prism's last invoice run before you bill from here.
