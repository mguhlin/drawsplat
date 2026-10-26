# ListSplatTM

**Current documentation:** [SplatWorks Wiki](https://drawsplat.org/wiki/) — setup, installation, licensing, pricing, OAuth, and district privacy review.


Get current packages from [Downloads](https://drawsplat.org/pages/download) and read [release notes](https://drawsplat.org/pages/release-notes). App versions remain independent of the suite release.

ListSplatTM is the SplatWorksTM classroom database app: a private,
browser-based database builder for children, teachers, and classroom projects.

The app should help students collect, organize, search, relate, calculate,
display, and share information without requiring accounts, servers, telemetry,
or cloud storage.

## Development

ListSplatTM v0.2.0 includes the following classroom database workflows.

Current working surface:

- SplatWorksTM purple/white app chrome
- local autosave
- native `.listsplat.json` save/open
- CSV/TSV import/export and Markdown table paste/file import with column previews
- editable tables, fields, and records
- field settings with name, type, description, required, hidden, and starter
  calculation formula controls
- nine views: table, form, cards, gallery, list, board, calendar, labels, and report
- quick search across all fields or one field
- sorting
- missing-value and duplicate-value checks
- replace values in a selected field
- printable/exportable HTML report
- 15 classroom starters with 12 records per table, including two connected-table projects
- image fields with upload and paste support
- language switching using the shared SplatWorks preference
- primary/foreign keys, one-to-many and one-to-one relationships, name/ID pickers, and reference validation
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

## Import Markdown tables

Choose **File → Import → Markdown table**. Paste Markdown or load a `.md`/`.markdown`
file, choose a table if the document contains several, give it a name, and select
**Preview columns**. Map columns and types, then create a new table or append to
the current table using the same preview and duplicate-handling controls as CSV.
The importer supports optional outer pipes, alignment separators, escaped pipes,
empty cells, and tables embedded in longer documents. Cell content remains plain
text. File actions are in File; Undo/Redo are in Edit and retain their shortcuts.


## Classroom starters in v0.2.0

Every template table has **12 records**. The 15 starters contain 17 tables and
204 practice records in total; a new Animals project also starts with 12 records.
Loading a template adds its tables to the current project and preserves existing
records. Existing saved projects keep their original data; load a starter to try
the expanded examples. Every load gets fresh table, field, record and relationship IDs.

| Starter | Classroom task |
| --- | --- |
| Classroom Library Catalog | Sort fictional books and recommend a reading choice. |
| Science Observation Log | Compare simulated plant growth and written observations. |
| State Facts Database | Locate capitals and add source notes from a class atlas. |
| Book Review Collection | Compare fictional reader ratings and supporting evidence. |
| Vocabulary Word Bank | Search cross-subject words and revise example sentences. |
| Simple Survey Results | Summarize anonymous simulated group preferences. |
| Museum Exhibit Cards | Curate sample objects and print visitor labels. |
| Weather Watch | Compare simulated temperature, rain and sky conditions. |
| School Garden Planner | Allocate beds, teams, seed packets and growing space. |
| Class Project Budget | Calculate pretend supply costs and spending priorities. |
| Reading Goal Tracker | Calculate pages remaining for fictional reader aliases. |
| Classroom Jobs Rotation | Compare team workloads and plan a fair rotation. |
| Makerspace Inventory | Find low stock and group supplies by storage bin. |
| Library Books & Loans | Open 12 books and 12 loans with a working one-to-many link. |
| Investigations & Trials | Open 12 investigations and 12 simulated trial results with linked IDs. |

People, books, observations and measurements are fictional practice data. State
capitals and animal notes are starting points for a research task; students should
verify factual claims and add sources. No real student records are included.

Open **Database Check → Classroom Templates** and choose **Use template**.
Reflection questions load into teacher notes. Numeric and date columns use their
appropriate field types so students can sort, summarize and try calendar views.
The two linked starters include primary/foreign key badges and parent record
pickers immediately. Use Keys & Relationships to inspect the diagram.

The v0.2.0 refresh also includes a cleaner purple workspace, icons on actions and
views, contextual relationship examples, reversible table-tab closing, top-right
close buttons on dialogs, Markdown import, and file actions in the File menu.
