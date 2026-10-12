# GridSplat™ File Format

GridSplat™ native files use JSON with the extension `.gridsplat.json`.

Current import/export support:

- GridSplat™ JSON: `.gridsplat.json`
- Excel: `.xlsx`
- LibreOffice Calc: `.ods`
- CSV: `.csv`
- Markdown tables: `.md` or `.markdown`

Office imports read the first worksheet, up to 2,000 rows, 200 columns and 100,000 cells. Common values, formulas, basic formatting and merged cells are supported. Complex charts, macros and advanced workbook features may not carry over. Keep the original and check the result.

Native JSON also preserves sheet dimensions, cell formatting and merged cells. See the [GridSplat Wiki guide](https://drawsplat.org/pages/gridsplat) for current instructions.

## Version 1

```json
{
  "version": 1,
  "metadata": {
    "createdAt": "2026-06-07T00:00:00.000Z",
    "title": "GridSplat™"
  },
  "sheets": [
    {
      "id": "sheet-1",
      "name": "Sheet 1",
      "cells": [
        ["Name", "Count"],
        ["Apples", "4"]
      ]
    }
  ],
  "charts": [],
  "pictureGraphs": []
}
```

`cells` stores raw cell text, including formulas such as `=SUM(A1:A5)`. Display values are recalculated when a file opens.
