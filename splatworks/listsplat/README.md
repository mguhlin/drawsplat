# ListSplatTM

ListSplatTM is the SplatWorksTM classroom database app. It is planned as a
private, browser-based database builder for children, teachers, and classroom
projects.

The app should help students collect, organize, search, relate, calculate,
display, and share information without requiring accounts, servers, telemetry,
or cloud storage.

## Development

ListSplatTM now has a working classroom database app foundation. See
`docs/plan.md` for the full product plan.

Current working surface:

- SplatWorksTM purple/white app chrome
- local autosave
- native `.listsplat.json` save/open
- CSV import/export
- editable tables, fields, and records
- field settings with name, type, description, required, hidden, and starter
  calculation formula controls
- table, form, card, gallery, label, and report views
- quick search across all fields or one field
- sorting
- missing-value and duplicate-value checks
- replace values in a selected field
- printable/exportable HTML report
- classroom template starters
- image fields with upload and paste support
- language switching using the shared SplatWorks preference
- basic relationship builder
- calculation fields with text, math, and table-summary functions
- lookup-style calculation formulas for related records
- Functions and Data quality dialogs for teacher-friendly guidance
- editable teacher notes
- project packet HTML export with teacher notes, relationships, field structure,
  and data-quality checks
- basic number summaries

Planned next:

- richer layout builder
- tagged-release ZIP publishing for the ListSplatTM self-host package

Target app path:

```text
/splatworks/listsplat/
```

Target native file format:

```text
.listsplat.json
```

## License

ListSplatTM is part of the SplatWorksTM GPL-covered app family. Unless a file
inside this directory says otherwise, ListSplatTM code should be GPL-3.0-only.
