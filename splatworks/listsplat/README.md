# ListSplatTM

**Current documentation:** [SplatWorks Wiki](https://drawsplat.org/wiki/) — setup, installation, licensing, pricing, OAuth, and district privacy review.


Get current packages from [Downloads](https://drawsplat.org/pages/download) and read [release notes](https://drawsplat.org/pages/release-notes). App versions remain independent of the suite release.

ListSplatTM is the SplatWorksTM classroom database app: a private,
browser-based database builder for children, teachers, and classroom projects.

The app should help students collect, organize, search, relate, calculate,
display, and share information without requiring accounts, servers, telemetry,
or cloud storage.

## Development

ListSplatTM now has a working classroom database app foundation.

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
- layout designer with per-view field order, visibility, and locking
- basic number summaries

Remaining release work is limited to tagged-release ZIP publishing for the
ListSplatTM self-host package.

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

## Opening files from another SplatWorks app

Recognized project and Office files open in the matching app in a new tab. The matching app must be installed at the same website; allow popups if prompted. Files transfer through temporary browser storage without an upload. The imported tab uses a separate session draft: save a project file before closing it. Existing saved projects stay in place. See the [SplatWorks FAQ](https://drawsplat.org/wiki/faq#splatworks).

## Access and Base exchange

Import/export table records as CSV. This does not import MDB, ACCDB or ODB database files, forms, queries or relationships. Export each table from Microsoft Access or LibreOffice Base and import its CSV records. See the [ListSplat guide](https://drawsplat.org/pages/listsplat).

## Primary keys and linked records

Open **Keys & Relationships** in the Database Check panel (or Tools → Relationships).
Use **Add an ID primary key** to assign unique numeric IDs to an existing table,
or click a column heading and enable **Primary key** for a text, number, or
automatic-number field whose existing values are unique and nonempty.

Select a parent table and its primary key, then a child table and a foreign-key
field. Use matching types: text to text, or number/automatic number to number.
Choose one-to-many (Students → Assignments) or one-to-one (Students → Profiles).
A foreign key may itself be the child's primary key for a shared-ID one-to-one link.
Existing child values must reference real parent keys; optional foreign keys may
be blank. A foreign key can reference only one parent field.

The diagram lists every table's fields and marks PK/FK columns. Table and form
views show key badges; foreign-key pickers display a parent name plus its ID,
store the ID, and offer an arrow to open the parent record. Parent forms show
related children and an Add related record button.

New key relationships block duplicate/blank primary keys, unmatched foreign keys,
and parent edits/deletions that would leave children without parents. One-to-one
links also reject repeated foreign keys. Remove or reassign child links before
changing a referenced parent. Use **Remove link** to remove a relationship without
deleting its tables or records. Undo and project-file export preserve key metadata.
Legacy value-match relationships continue to work without being silently converted.
