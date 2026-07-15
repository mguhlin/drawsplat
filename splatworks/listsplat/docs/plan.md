# ListSplatTM Development Plan

ListSplatTM is the SplatWorksTM database app: a child-friendly, browser-based
database builder modeled after the approachable parts of FileMaker 5.0 while
using the privacy, portability, and classroom focus of the SplatWorksTM suite.

ListSplatTM and SplatWorksTM are trademarks. In product copy, use
`ListSplatTM` and `SplatWorksTM` in Markdown/plain text, and
`ListSplat&trade;` / `SplatWorks&trade;` in HTML.

## Implementation Status

This plan has been built out for the current static SplatWorksTM release.

- Phase 1, project foundation: complete.
- Phase 2, flat database core: complete.
- Phase 3, import/export/find/sort: complete for current CSV, JSON, search,
  sort, missing-value, duplicate-value, and previewed replace workflows.
- Phase 4, layouts and reports: complete for table, form, card, gallery, label,
  report, printable HTML, layout field order/visibility, and locked layouts.
- Phase 5, calculations and summaries: complete for the curated internal
  formula evaluator, relationship-aware lookup helpers, and basic numeric
  summaries.
- Phase 6, relationships: complete for one-to-many relationships and related
  record lookup workflows.
- Phase 7, classroom templates and teacher tools: complete for starter
  templates, project ideas, teacher notes, project packet export, layout locks,
  and data-quality checks.
- Phase 8, polish and distribution: complete for public launch pages, help
  topics, print styles, and the SplatWorksTM static package.

Remaining release validation is operational: build/test before tagging, package
the self-host ZIP, and verify performance on the target classroom hardware.

## Product Position

ListSplatTM is not Microsoft Access, Airtable, FileMaker Pro, or a cloud
student information system. It is a static classroom database app where students
can build useful databases, learn data habits, make forms and reports, import
and export CSV files, and save durable project files without needing a login or
server.

The app should prioritize:

- fast startup on school Chromebooks
- simple field and table creation
- form, list, table, card, label, and report layouts
- CSV import/export that works with real classroom data
- find, sort, filter, group, and replace tools
- child-friendly calculation fields and summaries
- safe local autosave plus durable `.listsplat.json` files
- project templates and teacher-guided database ideas
- a path from flat-file lists to simple relationships

The app should stay inside the SplatWorksTM family boundary:

- static app under `splatworks/listsplat/`
- public detail page at `pages/listsplat.html`
- launch path `/splatworks/listsplat/`
- native file format `.listsplat.json`
- GPL-3.0-only unless a file in the directory states otherwise
- no required backend, login, telemetry, advertising, or AI service
- separate self-host package once the app is stable enough to distribute

## Core Principles

- **Private by default.** Databases stay in the browser unless the user exports
  or imports a file.
- **Portable by design.** Browser autosave is convenience storage. The durable
  project format is `.listsplat.json`; CSV is the interchange format.
- **Simple first, relational when useful.** A child should be able to make a
  one-table collection in minutes, then later connect tables when the idea
  naturally needs relationships.
- **Layouts are learning tools.** Students should see the same data as a table,
  form, card set, gallery, labels, and report.
- **Teacher-native.** Templates, sample data, project prompts, printable
  reports, and reflection questions are part of the product.
- **Safe calculations.** Functions should be useful, understandable, and clearly
  explained. Avoid spreadsheet-style mystery errors where possible.
- **No hidden data loss.** Imports, exports, deletes, field changes, and type
  conversions must explain what will happen before changing student work.

## SplatWorksTM Design Treatment

ListSplatTM should share suite-level behavior with GridSplatTM, ShowSplatTM,
and WriteSplatTM:

- universal purple and white SplatWorksTM app chrome
- top menu with File, Edit, Insert, Data, Layout, Tools, View, Teacher, and Help
- icon-first toolbar with tooltips and child-readable labels where needed
- large tap targets, visible focus rings, and keyboard access
- document title, author/class, save state, and record count in the status area
- app language switcher matching the rest of SplatWorksTM
- native JSON save/open using `.listsplat.json`
- export dialogs that explain limitations plainly
- task-focused Help that teaches common workflows, not internal phase notes
- no marketing landing screen inside the app; open to the usable database
  workspace or project picker

## Technology Choices

| Need | Choice | Notes |
| --- | --- | --- |
| App shell | Vite + TypeScript | Match WriteSplatTM and GridSplatTM maintainability. |
| UI framework | React + TypeScript | Recommended for layout builder, dialogs, records, and state-heavy interactions. |
| Table/grid view | Custom virtualized table or TanStack Virtual | Needs editable cells, field headers, frozen columns, and large child-friendly rows. |
| State model | Internal immutable database model | Keep project data independent from UI views and exports. |
| Formula/calculation engine | Small curated internal evaluator | Use safe functions only; avoid arbitrary JS execution. |
| CSV import/export | PapaParse or small internal parser | PapaParse is acceptable if license notes are recorded. |
| Chart/report export | HTML print plus CSV/JSON | PDF through browser print/save-as-PDF. |
| Storage | localStorage autosave; IndexedDB optional for image-heavy projects | `.listsplat.json` remains the reliable cross-device copy. |
| Icons | Local Lucide icons | Keep offline and suite-consistent. |
| Testing | Vitest + Playwright | Unit-test schema/import/formulas; browser-test layouts and persistence. |

Before adding dependencies, record license notes in `docs/credits.md`.

## Native Project Model

ListSplatTM should own a clear JSON format instead of treating CSV or HTML as
the source of truth.

Minimum `.listsplat.json` shape:

```json
{
  "app": "ListSplatTM",
  "version": 1,
  "createdAt": "2026-06-29T00:00:00.000Z",
  "updatedAt": "2026-06-29T00:00:00.000Z",
  "metadata": {
    "title": "Animal Research Database",
    "author": "",
    "className": ""
  },
  "schema": {
    "tables": [],
    "relationships": []
  },
  "data": {
    "tables": {}
  },
  "layouts": [],
  "teacher": {
    "studentView": false,
    "notes": [],
    "rubric": []
  }
}
```

## Database Concepts

### Tables

A table is a named collection of records. V1 must support multiple tables in one
project, while making the one-table path the default.

Required table actions:

- create, rename, duplicate, and delete table
- add, duplicate, hide/show, reorder, and delete fields
- add, duplicate, delete, and restore records
- import CSV into a new table
- append CSV rows into an existing table
- export one table or all tables as CSV
- view data as table, form, cards, gallery, labels, and report

### Fields

Field creation should feel like making a simple list, not designing a database
schema. Each field needs a name, type, description, visibility, default value,
and optional validation.

Field types:

- short text
- long text
- number
- currency
- percent
- date
- time
- checkbox
- rating
- single choice
- multiple choice
- image
- link
- email
- phone
- calculation
- summary
- lookup
- related records
- auto number
- created/updated timestamp

Field tools:

- rename with warning if formulas/layouts depend on the field
- change type with preview of converted values
- required field toggle
- unique value toggle
- default value
- value list editor for choices
- min/max validation for numbers and dates
- simple pattern validation for email, URL, and phone
- field description shown as a kid-friendly hint

### Records

Students should be able to work with records in multiple ways:

- table row editing
- form view for one record at a time
- card view for visual browsing
- gallery view for image-heavy projects
- quick add record
- duplicate record
- record notes
- attachment/image field support using local embedded data where practical
- undo for record edits and deletions

### Relationships

Relationships should be introduced gently after flat databases work.

V1 relationship model:

- one-to-many relationships between two tables
- lookup fields that display data from a related table
- related-record fields that show a child table list inside a parent record
- simple relationship builder: "One animal can have many observations"
- optional relationship diagram view

Examples:

- Books -> Reviews
- Animals -> Observations
- States -> Cities
- Classes -> Students
- Inventors -> Inventions

Avoid many-to-many relationship builders in V1 unless a template needs one.

## Layout Modes

ListSplatTM should make layout design a core feature, inspired by FileMaker but
simplified for students.

Required modes:

- **Table mode:** spreadsheet-like editable rows and columns.
- **Form mode:** one record at a time, with labels and fields arranged on a page.
- **Card mode:** repeatable record cards for browsing.
- **Gallery mode:** image-first cards for collections.
- **List mode:** compact repeatable rows for directories and inventories.
- **Label mode:** printable labels, name tags, trading cards, or shelf cards.
- **Report mode:** grouped, sorted, printable reports with headers and summaries.
- **Find mode:** clear search form that lets students enter criteria by field.

Layout builder:

- drag fields onto a canvas
- resize and align field boxes
- add text labels, section headers, lines, boxes, images, and page breaks
- choose fonts, sizes, colors, and simple borders
- snap-to-grid and alignment guides
- duplicate layout
- lock teacher-provided layouts
- preview as student
- print current layout

Keep design controls simpler than desktop publishing. The goal is clear reports,
not pixel-perfect print design.

## Find, Sort, Filter, and Replace

Search is a central database skill.

Required find tools:

- quick search across visible fields
- field-specific find
- advanced find with AND/OR conditions
- operators: equals, contains, starts with, ends with, greater than, less than,
  between, is empty, is not empty
- saved finds
- find duplicates
- find missing values
- clear current find

Required sorting/filtering:

- sort by one or more fields
- ascending/descending toggle
- group records in report mode
- filter chips with clear labels
- saved views

Required replace tools:

- replace in current field
- replace across selected fields
- replace within found set only
- case-sensitive option
- whole-word option for text fields
- preview changes before applying
- undo the last replace

## Calculations, Summaries, and Functions

ListSplatTM should include database-style calculations, not a full spreadsheet
clone. Calculations should be safe, deterministic, and teacher-readable.

Formula examples:

- `Full Name = First Name & " " & Last Name`
- `Total = Quantity * Price`
- `Age = YEARS_BETWEEN(Birthdate, TODAY())`
- `Reading Minutes = SUM(Related Reading Log::Minutes)`

Curated function groups:

- **Text:** JOIN, LEFT, RIGHT, MID, LENGTH, UPPER, LOWER, TITLECASE, TRIM,
  SUBSTITUTE, CONTAINS
- **Number:** ROUND, ABS, MIN, MAX, CLAMP
- **Date/time:** TODAY, NOW, YEAR, MONTH, DAY, DAYS_BETWEEN, YEARS_BETWEEN
- **Logic:** IF, AND, OR, NOT, IS_EMPTY
- **Summary:** COUNT, SUM, AVERAGE, MINIMUM, MAXIMUM
- **Related data:** LOOKUP, RELATED_COUNT, RELATED_SUM, RELATED_AVERAGE

Function UI:

- function picker with plain-language examples
- insert-field picker so children do not need to type exact field names
- friendly validation messages
- test calculation with sample record
- show which layouts/reports use a calculation field

Never evaluate arbitrary JavaScript from a project file.

## Import and Export

ListSplatTM must treat CSV as a first-class school workflow.

CSV import:

- drag/drop or file picker
- delimiter detection for comma, tab, and semicolon
- header row detection
- field type suggestions
- encoding support for UTF-8
- import preview
- map columns to existing fields
- create new fields from unmapped columns
- skip columns
- append or replace options
- duplicate handling options
- plain-language import summary

CSV export:

- export current table
- export found set
- export selected fields
- export all tables as separate CSV files in a ZIP
- include/exclude headers

Other exports:

- `.listsplat.json` full project
- printable HTML report
- labels/cards as printable HTML
- Markdown table for simple data
- JSON data export for technical use

Imports must never overwrite the current project without a clear warning and
undo/backup path.

## Teacher and Student Features

Teacher tools should be in a far-right Teacher menu, consistent with
WriteSplatTM.

Teacher menu:

- Template Library
- Project Ideas
- Sample Data
- Student View
- Lock Layout
- Hide Teacher Notes
- Add Reflection Questions
- Print Project Packet
- Export Student Copy
- Reset Sample Records

Student supports:

- field hints written in friendly language
- project checklist
- "What can I learn from this data?" prompts
- data-quality badges for missing values, duplicates, and inconsistent entries
- guided find/sort challenges
- glossary for database terms

Teacher-only content:

- instructions
- answer keys
- sample records
- rubrics
- discussion prompts
- locked layouts

Student View should hide teacher-only notes and optionally simplify menus.

## Built-In Classroom Templates

ListSplatTM should ship with templates that teach database thinking. Templates
should include fields, sample records, layouts, project prompts, and extension
ideas.

Initial templates:

- Animal research field guide
- Classroom library catalog
- Book review collection
- Science observation log
- Rock and mineral collection
- State facts database
- Famous people biography database
- Invention timeline
- Weather tracker
- Plant growth journal
- Reading log
- Vocabulary word bank
- Simple survey results
- Classroom jobs and responsibilities
- Sports/team statistics
- Museum exhibit cards
- Family history interview collection
- Community helpers directory
- Recycling or cafeteria waste audit
- Field trip scavenger database

Each template should include:

- suggested grade band
- learning goal
- tables and fields
- sample records
- form layout
- report layout
- reflection questions
- export/print suggestion

## Help System

The Help menu must be task-focused and teacher-friendly.

Required Help topics:

- Start a new database
- Add fields
- Add records
- Import a CSV file
- Find records
- Sort and filter
- Replace values safely
- Make a form
- Make a printable report
- Connect two tables
- Save and open `.listsplat.json`
- Export CSV
- Teacher tools
- Privacy and local storage
- Keyboard shortcuts

Help content should avoid development phases and internal roadmap labels.

## Privacy, Safety, and Storage

Storage rules:

- autosave current project to localStorage or IndexedDB
- named local project library
- `.listsplat.json` export/import as the durable copy
- optional browser File System Access API save/open when available
- no required remote calls
- no analytics
- no telemetry
- no AI service
- no hidden cloud sync

The UI must clearly explain that browser storage is tied to the current browser
profile and device. Exported project files are the reliable cross-device backup.

## Accessibility and Usability

ListSplatTM must work for children and teachers with keyboard, mouse, and touch.

Requirements:

- WCAG AA contrast
- visible keyboard focus
- table navigation by keyboard
- large default row heights and field controls
- labels on icon buttons via tooltip or visible text
- reduced-motion support
- no information conveyed by color alone
- printable reports with readable type
- friendly error messages
- undo for risky edits

## Development Phases

### Phase 1 - Project Foundation

Status: complete.

- create Vite + React + TypeScript app
- SplatWorksTM chrome, language switcher, and menus
- local autosave shell
- `.listsplat.json` save/open
- project picker and sample empty database
- unit and Playwright test setup

Deliverable: a branded SplatWorksTM app shell that can create, save, open, and
autosave a blank ListSplatTM project.

### Phase 2 - Flat Database Core

Status: complete.

- one-table project support
- field editor
- record editor
- table view
- form view
- field types: text, number, date, checkbox, choice, image, link
- undo/redo

Deliverable: students can build and use a simple one-table database.

### Phase 3 - Import, Export, Find, Sort

Status: complete for current classroom CSV and cleanup workflows.

- CSV import wizard
- CSV export
- quick search
- advanced find
- sort/filter
- find duplicates and missing values
- replace in one or more fields with preview

Deliverable: classroom CSV workflows work end to end.

### Phase 4 - Layout Builder and Reports

Status: complete for the current simplified classroom layout model.

- card, gallery, list, label, and report layouts
- draggable field layout canvas
- report grouping and summaries
- printable HTML output
- locked teacher layouts

Deliverable: students can make forms, cards, labels, and printable reports from
their data.

### Phase 5 - Calculations and Summaries

Status: complete for the curated internal evaluator and summary helpers.

- calculation fields
- summary fields
- curated function picker
- formula validation
- calculation tests
- friendly errors

Deliverable: useful database calculations and summaries without arbitrary code.

### Phase 6 - Relationships

Status: complete for one-to-many relationships and lookup-style formulas.

- multiple tables
- one-to-many relationship builder
- lookup fields
- related-record sections
- relationship diagram
- relationship-aware templates

Deliverable: children can move from flat lists to simple relational databases.

### Phase 7 - Classroom Templates and Teacher Tools

Status: complete.

- template library
- sample data
- project ideas
- Student View
- teacher notes
- rubrics and reflection prompts
- print project packet

Deliverable: the app is classroom-ready for teachers who do not want to build a
database from scratch.

### Phase 8 - Polish and Distribution

Status: complete, pending only tagged self-host packaging validation.

- visual design pass
- task-focused Help
- keyboard shortcut pass
- cross-browser testing
- package as SplatWorksTM self-host artifact
- public ListSplatTM page
- README and release notes

Deliverable: shippable ListSplatTM package.

## Key Technical Risks

- **Editable grid complexity.** Table view needs spreadsheet-like editing but
  should not become GridSplatTM. Keep the grid focused on records and fields.
- **Layout builder scope.** FileMaker-style layout design can expand quickly.
  V1 should support clear classroom forms and reports, not full desktop
  publishing.
- **Formula safety.** Never evaluate arbitrary code. Use a tiny parser/evaluator
  or controlled expression library with a strict allowlist.
- **Relationship UX.** Relationships are powerful but confusing. Build them only
  after flat tables, imports, layouts, and reports are solid.
- **Large files.** Image fields and big CSVs may exceed localStorage. Use
  IndexedDB for large project state if needed.

## Quick Self-Check Before Each Phase Ships

1. Can a child complete the main workflow without reading documentation?
2. Does autosave work, and does `.listsplat.json` restore the whole project?
3. Can the user export their data in a useful, open format?
4. Are risky edits previewed or undoable?
5. Are teacher-only notes hidden in Student View?
6. Does nothing phone home?
7. Does the app still match the SplatWorksTM visual and packaging pattern?
