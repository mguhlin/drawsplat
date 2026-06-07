# GridSplat™ File Format

GridSplat™ native files use JSON with the extension `.gridsplat.json`.

Current import/export support:

- GridSplat™ JSON: `.gridsplat.json`
- CSV: `.csv`
- Markdown tables: `.md` or `.markdown`

Excel `.xlsx` support is deferred until a maintained, vulnerability-free parser is selected.

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
