# GridSplat™ — Modular Build Plan

A child-centered, browser-based spreadsheet, charting, and graphing tool for grades 3–8.

**Audience for this document:** An AI coding agent (Claude Code or OpenAI Codex) building the product, and a non-coder product owner reviewing it. Every module is self-contained so the agent can build "a little at a time" for token management.

**How to use this plan:** Build modules in numeric order. Each module lists its purpose, files to create, dependencies, acceptance criteria, and a "Definition of Done." Do not start a module until the one before it passes its acceptance criteria. Commit after every module.

---

## 0. Read This First (Plain-Language Summary)

GridSplat™ is a website. A child opens it in any browser — laptop, Chromebook, tablet, or phone — and gets a big, colorful, friendly spreadsheet. They can type numbers, make charts, drag pictures to build picture graphs, and save their work to their device or to Google Drive, Dropbox, or OneDrive. Teachers get extra tools: ready-made activities, project ideas, and a presentation mode for the whiteboard. Everything runs in the browser. There is no server doing the math — the child's device does all the work. That keeps it private, cheap to host, and fast.

**The single most important architectural decision:** GridSplat™ is a _static_ web app. It is just HTML, CSS, and JavaScript files sitting on a host (like GitHub Pages). There is no backend database, no login server, no place where student work is stored on the internet by default. Cloud saving is optional and goes directly from the child's browser to _their own_ Google/Dropbox/Microsoft account. This is the right choice for a school product: it is FERPA-friendly, free to host, and cannot leak data it never collects.

---

## 1. Technology Choices (and Why)

Pick boring, stable, well-documented tools. A child-facing education tool must work in 5 years, not chase trends.

| Need                         | Choice                                                                                        | Why this and not something else                                                                                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App framework                | **Vanilla JS + Vite** (build tool) OR **React + Vite**                                        | Vanilla keeps it light and dependency-free; React makes the UI state (drag-drop, menus) far easier to manage. **Recommendation: React + Vite.** The drag-and-drop picture graphs and live-updating charts are much harder to keep bug-free in vanilla JS. |
| Language                     | **TypeScript**                                                                                | Catches mistakes before a child ever sees them. Non-negotiable for a maintainable codebase.                                                                                                                                                               |
| Spreadsheet grid             | **Custom lightweight grid** built on a canvas or virtualized DOM, NOT a heavy commercial grid | Commercial grids (AG Grid, Handsontable) are powerful but adult-oriented, often paid, and hard to make "big-cell + kid-friendly." Build a focused grid. (See Module 3 for the build-vs-buy note.)                                                         |
| Formula engine               | **HyperFormula** (open source, MIT)                                                           | Re-implementing Excel-style formulas (SUM, AVERAGE, IF…) is a multi-month trap. HyperFormula handles ~400 functions, is well-tested, and runs entirely in the browser. Do not write your own formula parser.                                              |
| Charts                       | **Chart.js** (MIT)                                                                            | Simple, mobile-friendly, animated, accessible. Covers bar, line, pie, scatter. For the _drag-drop picture graph_, build custom (Module 7) — Chart.js can't do that.                                                                                       |
| Drag-and-drop                | **@dnd-kit** (MIT)                                                                            | Touch-friendly, accessible, works on phones. Avoid the older react-dnd (weaker touch support).                                                                                                                                                            |
| File parsing (import/export) | **SheetJS (xlsx)** community build for Excel/CSV; **PapaParse** for robust CSV                | SheetJS reads/writes .xlsx, .csv, and more. PapaParse handles messy real-world CSVs gracefully.                                                                                                                                                           |
| Markdown tables              | **Custom small functions** (parse + serialize)                                                | Markdown tables are simple enough to handle in ~80 lines; no library needed.                                                                                                                                                                              |
| Cloud save                   | **Google Drive API**, **Dropbox JS SDK**, **Microsoft Graph (OneDrive)** via OAuth 2.0 PKCE   | These let the browser talk directly to the user's cloud with no server. PKCE is the login flow that works for static sites.                                                                                                                               |
| Local save                   | **File System Access API** with download/upload fallback                                      | Lets returning users re-open the same file. Fallback covers Safari/Firefox where the API is limited.                                                                                                                                                      |
| Hosting                      | **GitHub Pages** (or Netlify/Cloudflare Pages)                                                | Free, fast, static. Matches the "no backend" design.                                                                                                                                                                                                      |
| Testing                      | **Vitest** (unit) + **Playwright** (browser/end-to-end)                                       | Vitest is fast and pairs with Vite. Playwright tests real browser behavior including touch.                                                                                                                                                               |
| Code quality                 | **ESLint + Prettier**                                                                         | Enforces consistent, readable code automatically.                                                                                                                                                                                                         |

**Agent instruction:** Use the exact library names above. Pin versions in `package.json`. If any library is unavailable or deprecated at build time, stop and report it rather than substituting silently.

---

## 2. Project Foundation (Module 1)

**Purpose:** Create the skeleton, tooling, and rules every later module depends on.

**Tasks:**

1. Initialize a Vite + React + TypeScript project.
2. Add ESLint, Prettier, Vitest, Playwright. Add npm scripts: `dev`, `build`, `preview`, `lint`, `format`, `test`, `test:e2e`.
3. Create the folder structure below.
4. Add a `README.md` (what the project is, how to run it) and a `CONTRIBUTING.md` (coding standards — see Section 14).
5. Configure Git. Add `.gitignore` (node_modules, dist, .env).
6. Set up GitHub Actions: on every push, run `lint`, `test`, and `build`. Block merge if any fail.
7. Create a `.env.example` listing the cloud API keys needed (filled in later, never committed).

**Folder structure:**

```
gridsplat/
├── public/                 # static assets: splash images, icon SVGs, sample data
│   ├── images/
│   ├── icons/
│   └── samples/
├── src/
│   ├── components/         # UI pieces (buttons, menus, dialogs)
│   ├── grid/               # the spreadsheet grid (Module 3)
│   ├── formulas/           # HyperFormula wrapper (Module 4)
│   ├── charts/             # chart builders (Module 6)
│   ├── picturegraph/       # drag-drop picture graph (Module 7)
│   ├── io/                 # import/export + cloud save (Modules 8–9)
│   ├── activities/         # built-in activities + TEKS data (Module 10)
│   ├── present/            # presentation mode (Module 11)
│   ├── state/              # app state management
│   ├── utils/              # small shared helpers
│   ├── styles/             # global CSS, design tokens, theme
│   ├── App.tsx
│   └── main.tsx
├── tests/                  # Playwright e2e tests
├── docs/                   # this plan, architecture notes, decisions
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

**Acceptance criteria:** `npm run dev` shows a blank styled page that says "GridSplat™." `npm run lint`, `npm test`, and `npm run build` all pass with no errors. CI runs green on GitHub.

**Definition of Done:** A reviewer can clone the repo, run three commands, and see it work.

---

## 3. The Grid (Module 2 — Core)

**Purpose:** The big-cell, kid-friendly spreadsheet itself.

**Design requirements (the "kid-friendly" part):**

- Cells are **large by default** (e.g., 120px wide × 56px tall) with big, readable type (≥18px). Adults/teachers can shrink via a toggle, but big is the default.
- High color contrast; selected cell has a thick, obvious 4px border.
- Tapping a cell on mobile opens a roomy input — never a tiny one.
- Row/column headers use **friendly labels with a toggle**: show "A, B, C" / "1, 2, 3" by default but offer a "plain language" mode showing nothing intimidating.
- Smooth on a Chromebook with a 20×20 grid; performant up to ~100×50 via virtualization (only render visible cells).
- Full keyboard navigation (arrows, tab, enter) AND full touch support.

**Tasks:**

1. Build a virtualized grid component (render only visible cells; recycle DOM nodes on scroll).
2. Cell model: each cell holds `rawValue` (what the child typed), `displayValue` (what shows), and `type` (number, text, formula).
3. Selection: single cell, range select (drag), select whole row/column by tapping the header.
4. Editing: double-tap or Enter to edit; Escape cancels; Enter commits and moves down.
5. Copy/paste/cut: support pasting from the clipboard including **multi-cell paste** from other spreadsheets and from Markdown/CSV text (hook into Modules 8 here).
6. Undo/redo with a visible, big undo button (kids hit undo constantly).
7. Resize rows/columns by dragging the border.

**Build-vs-buy note for the agent:** Building a grid is the hardest module. Budget the most time here. If a fully custom grid proves too large, the acceptable fallback is **Handsontable's** non-commercial build OR a virtualized table library like **TanStack Table** for structure plus custom cell rendering. Document whichever path is chosen in `docs/decisions.md`. Do NOT silently swap; report the tradeoff.

**Acceptance criteria:** A child can type numbers and text into a 20×20 grid, select a range by dragging, copy and paste it, undo, and it stays smooth on a low-end Chromebook. Works with both mouse and touch.

**Definition of Done:** Playwright test enters data, selects, copies, pastes, and undoes — all passing on desktop and emulated mobile.

---

## 4. Formula Engine (Module 4)

**Purpose:** Make `=SUM(A1:A10)` and friends work, without writing a math parser.

**Tasks:**

1. Wrap **HyperFormula** behind a small interface (`formulas/engine.ts`) so the rest of the app never calls HyperFormula directly. (This is the _adapter pattern_ — if HyperFormula is ever replaced, only this file changes.)
2. On every cell edit, push the change into HyperFormula and read back computed values for all affected cells.
3. Expose a **curated, kid-appropriate function list** for the function menu: SUM, AVERAGE, MIN, MAX, COUNT, ROUND, IF, plus a few. The full ~400 functions stay available by typing, but the menu shows the friendly subset with plain-language descriptions ("AVERAGE — finds the middle/typical value").
4. Friendly error messages: instead of `#DIV/0!`, show "You can't divide by zero 🙂 — check your numbers." Map every error code to a kid-readable sentence.

**Acceptance criteria:** Typing `=SUM(A1:A5)` with numbers above returns the right total and updates live when a number changes. Errors show friendly messages.

**Definition of Done:** Unit tests cover the curated functions and the error-message mapping.

---

## 5. Design System & UI Shell (Module 5)

**Purpose:** The colorful, big-icon, friendly look — defined once, reused everywhere.

**Tasks:**

1. Create design tokens (`styles/tokens.css`): a small palette of bright, high-contrast, accessible colors; large spacing units; big font sizes; rounded corners.
2. Build core components: **BigButton**, **IconButton** (extra-large, ≥48px tap target — Apple/Google accessibility minimum), **DropdownMenu**, **Dialog**, **Tooltip**, **Toast** (for friendly messages).
3. All icons are **labeled with text**, not icon-only — children may not recognize a floppy-disk "save" icon, so pair every icon with a word.
4. Build the app shell: a top toolbar with dropdown menus (File, Edit, Insert, Chart, Activities, Present, Help), the grid in the center, a colorful splash/welcome screen on first load.
5. Splash screen: friendly welcome with big buttons — "New Sheet," "Open a File," "Try an Activity."
6. Honor `prefers-reduced-motion` (some kids are motion-sensitive). Animations gentle and skippable.

**Accessibility (build in from the start, not bolted on):**

- WCAG AA color contrast minimum.
- Every interactive element keyboard-reachable with a visible focus ring.
- ARIA labels on the grid and controls so screen readers work.
- Tap targets ≥48px.
- Test with a screen reader at least once per release.

**Acceptance criteria:** All menus open and close by mouse, keyboard, and touch. Buttons are large and labeled. Splash screen appears on first load.

**Definition of Done:** A reviewer navigates the entire shell with keyboard only and with touch only.

---

## 6. Charts (Module 6)

**Purpose:** Turn data into bar, line, pie, and scatter charts kids can make in two taps.

**Tasks:**

1. "Make a Chart" flow: child selects a range, taps Chart menu, picks a type from a **visual picker** (big preview thumbnails, not a text list).
2. Wrap **Chart.js**. Auto-detect labels vs. values from the selected range (first column = labels is a sensible default; let them swap).
3. Charts update live when underlying data changes.
4. Kid-friendly defaults: bright colors, big labels, a clear title prompt ("What is your chart about?").
5. Charts are movable/resizable on a canvas layer over the sheet.
6. Export a chart as a PNG image (for slides/reports).

**Acceptance criteria:** From 5 rows of data, a child makes a bar chart in under 5 taps, retitles it, and exports it as an image.

**Definition of Done:** e2e test: select data → bar chart → change a number → chart updates → export PNG.

---

## 7. Picture Graphs — The Signature Feature (Module 7)

**Purpose:** The drag-and-drop picture graph (pictograph) where children increase/decrease quantities by dragging pictures. This is the standout, TEKS-aligned, grade-3 favorite.

**Design:**

- Categories run along the bottom (e.g., "Apples, Bananas, Oranges").
- The child **drags a picture up to add one**, or taps a big **+ / −** under each category. Each picture = a unit (with an optional "each picture = 2" key for older grades).
- A live count and an optional linked data table update together — change the table, the pictures change; drag pictures, the table changes. (Two-way binding teaches the data-to-graph connection.)
- A picture library: fruits, animals, shapes, sports, weather, simple objects — bright, clear, classroom-appropriate clip-art-style SVGs. Let children pick the picture per category.

**Tasks:**

1. Build the pictograph component with **@dnd-kit** for touch-friendly dragging.
2. Implement the two-way binding between pictures and a small data table.
3. Implement the "each picture equals N" scale key.
4. Bundle an open-license SVG icon set (verify licenses; document sources in `docs/credits.md`).
5. Export the pictograph as an image and as data.

**Acceptance criteria:** A child drags pictures to build a graph, the count and table stay in sync both directions, and the scale key works.

**Definition of Done:** e2e test exercises drag-to-add, tap-to-add, table-edit-reflects-in-graph, and scale key — on emulated touch.

---

## 8. Import / Export (Module 8)

**Purpose:** Get data in and out in many formats, easily.

**Formats:**

- **Import:** CSV (PapaParse), Excel .xlsx (SheetJS), JSON (native format), Markdown table (custom parser), paste-from-clipboard.
- **Export:** CSV, .xlsx, JSON (native save format), Markdown table, PNG (charts/graphs).

**Tasks:**

1. Define the **native JSON save format** (`io/format.ts`) — a versioned schema holding sheet data, charts, picture graphs, and metadata. Include a `version` field from day one so future versions can upgrade old files. Document the schema in `docs/file-format.md`.
2. Build importers and exporters, each in its own file, each behind a common interface.
3. Markdown: parse pasted Markdown tables into the grid; copy/export selection as a Markdown table (the user specifically wants both directions).
4. Validate imported files; on bad data, show a friendly "We couldn't read that file — here's why" message rather than crashing.

**Acceptance criteria:** Round-trip test: export a sheet to each format, re-import it, and the data matches. Markdown copy/paste works both ways.

**Definition of Done:** Unit tests for every importer/exporter; one e2e round-trip per format.

---

## 9. Save Anywhere — Local + Cloud (Module 9)

**Purpose:** Save and reopen work on the device, and optionally to Google Drive, Dropbox, OneDrive — with no backend server.

**Tasks:**

1. **Local save/open:** Use the File System Access API where supported (lets users re-save to the same file). Fallback: download a `.gridsplat.json` file / upload to open. Always provide the fallback — Safari and Firefox don't fully support the modern API.
2. **Cloud save (OAuth 2.0 with PKCE, browser-only):**
   - Google Drive API
   - Dropbox JavaScript SDK
   - Microsoft Graph API (OneDrive)
   - Each gets its own adapter behind a shared `CloudProvider` interface (`io/cloud/`). The UI ("Save to…") doesn't know which cloud it's talking to — only the adapter does.
3. Store API client IDs in environment variables, injected at build time. **No secrets in the code.** PKCE means no client _secret_ is needed (correct for static sites).
4. Friendly auth flow: "Connect your Google Drive" with a clear, big button and a plain explanation of what access is granted ("GridSplat™ can only see files it creates").
5. Handle the offline case gracefully: if there's no internet, cloud buttons are disabled with a friendly note; local save still works.

**Critical caveats to surface to the product owner (you said you don't code — read these):**

- Cloud APIs require **registering an app** with Google, Dropbox, and Microsoft and getting client IDs. This is free but is a manual setup step you (or an admin) must do once. The plan can't do it for you.
- Google in particular may require an **app verification / review** before students outside your own organization can use Drive save. Budget weeks for this if you go public. Until then, it works for your own org/test accounts.
- School Google/Microsoft accounts are often **locked down by the district** — third-party app access may be blocked by admins. Test with a real student account early. This is the #1 thing that will surprise you.

**Acceptance criteria:** A user saves locally and reopens. With test cloud credentials, a user connects one cloud provider, saves, and reloads the file from it.

**Definition of Done:** Local save/open works in all major browsers (with fallback). At least one cloud adapter works end-to-end with test credentials; the other two are structurally complete and documented.

---

## 10. Built-in Activities, Projects & TEKS Alignment (Module 10)

**Purpose:** The teacher-facing curriculum value — ready activities, project ideas, and standards alignment.

**Scope you set:**

- **Math and Science TEKS.**
- Real, coded alignment for **number TEKS and chart/graph-friendly TEKS**.
- "Aligned in spirit" (no specific code) for the rest.

**Tasks:**

1. Create a TEKS data file (`activities/teks.json`) listing the relevant Math (and Science) standards with their official codes, grade, and a plain-language description. **Pull exact codes from the official Texas Essential Knowledge and Skills source; do not invent codes.** Flag any code you're unsure of for human review rather than guessing.
2. Build an **Activities Library**: each activity has a title, grade band, the TEKS it hits (coded where applicable), a kid-facing instruction card, and a pre-loaded sample dataset. Examples to include:
   - _Favorite Fruit Pictograph_ (Grade 3, picture graph)
   - _Class Pet Survey Bar Graph_
   - _Daily Temperature Line Graph_ (Science crossover)
   - _Plant Growth Over Two Weeks_ (Science, line graph)
   - _Lunch Count Tally → Bar Chart_
   - _Rolling Dice Probability_ (number sense)
   - _Recycling Sort Pictograph_ (Science crossover)
3. Build a **Project Ideas** section: longer, open-ended prompts ("Track the weather for a week and make a graph," "Survey your class and present your findings").
4. Each activity loads its sample data into a fresh sheet with one tap.
5. A small "Teacher Notes" panel per activity (collapsed by default) with the standard, the goal, and discussion questions.
6. Add a **Templates Library** with common everyday sheets for grades 3–8 plus teacher/student financial-literacy sheets such as allowance tracking, a check register, classroom store budgets, a simple gradebook, reading logs, homework planners, observation logs, and attendance.

**Important honesty note for the product owner:** TEKS codes change over time and exact wording matters for school adoption. The plan will _structure_ the alignment, but a Texas educator (you) must verify the codes against the current official TEKS before publishing. The agent should not present invented or approximate codes as official.

**Acceptance criteria:** At least 7 activities load with sample data and correct (verified) TEKS tags. At least 8 everyday/financial-literacy/teacher templates load with one tap. Project ideas display. Teacher notes toggle.

**Definition of Done:** Activities render, load data, and show alignment; `teks.json` is documented with its source.

---

## 11. Presentation Mode (Module 11)

**Purpose:** An integrated way to present sheets, charts, and picture graphs on a classroom screen.

**Tasks:**

1. A "Present" mode that goes full-screen with large type, hides editing chrome, and shows one item at a time (a sheet view, a chart, or a picture graph) as "slides."
2. Build slides by adding sheets/charts/graphs to a slide list; reorder by drag.
3. Big next/previous controls and arrow-key/tap navigation; works on a touchscreen/whiteboard.
4. A "spotlight" option to enlarge a single chart or graph.
5. Export the presentation as a set of PNG images or a simple printable view (no need to build full PowerPoint export — keep scope tight).

**Acceptance criteria:** A teacher assembles 3 slides (a sheet, a chart, a picture graph), enters Present mode, and navigates them full-screen by keyboard and touch.

**Definition of Done:** e2e test builds and navigates a 3-slide presentation.

---

## 12. Help, Onboarding & Safety (Module 12)

**Purpose:** Make it learnable by an 8-year-old and safe by design.

**Tasks:**

1. First-run friendly tour (skippable, replayable from Help): 4–5 steps pointing at the toolbar, a cell, the Chart button, and Save.
2. A Help menu with short, illustrated how-tos (no walls of text).
3. **No data collection.** No analytics that track individual children, no ads, no third-party trackers. State this plainly in a one-paragraph kid/parent-friendly privacy note. (This is both an ethical stance and a practical one — student-data privacy laws like FERPA/COPPA make tracking minors a serious liability.)
4. All processing stays on-device except optional, user-initiated cloud save.

**Acceptance criteria:** Tour runs on first load and can be replayed. Help how-tos open. No third-party tracker network calls in the build (verify in browser dev tools).

**Definition of Done:** A reviewer confirms zero analytics/tracker requests and a clear privacy note.

---

## 13. What You Might Be Missing (Added to the Plan)

You asked. Here is what's easy to overlook and is now folded into the modules above or listed here as required:

1. **Undo/redo** — kids rely on it heavily. (In Module 3.)
2. **Autosave to browser storage** — if a tab closes, work shouldn't vanish. Add a debounced save to the browser's local storage as a safety net (NOT a substitute for real save). (Add to Module 9.)
3. **Accessibility** — keyboard, screen reader, contrast, motion sensitivity, big tap targets. (Built into Module 5.) Many education products fail procurement on accessibility (Section 508). Don't.
4. **Offline use** — Chromebooks lose Wi-Fi constantly. Make the app a **PWA (Progressive Web App)** so it loads and runs offline and can be "installed." (Add as Module 14.)
5. **Number formatting kids understand** — whole numbers vs. decimals, simple currency, percentages, with friendly toggles.
6. **Localization hooks (Spanish)** — Texas classrooms are heavily bilingual. You don't have to ship Spanish day one, but **structure all text as translatable strings** from the start so adding Spanish later is cheap, not a rewrite. (Add to Module 5: an `i18n` string table.)
7. **Sample/seed data** — never show a child a blank grid with no idea what to do. Ship sample sheets. (In Module 10.)
8. **Print support** — teachers print. Add a clean print stylesheet.
9. **Error recovery** — if something breaks, show a friendly "Oops — your work is safe, let's reload" screen, not a white crash page. (Add an error boundary in Module 1/5.)
10. **A way to clear/reset** — a big, confirmable "Start Over" that can't be hit by accident.
11. **Browser/device support matrix** — decide and document which browsers and screen sizes you officially support (e.g., last 2 versions of Chrome/Edge/Safari/Firefox; phones ≥360px wide). (In `docs/`.)
12. **Versioned file format** — already in Module 8; flagged again because skipping it makes old files unopenable later.

---

## 14. Coding Standards & Best Practices (Apply to Every Module)

The agent must follow these throughout. The product owner can use this section to check the work.

**Comments and readability:**

- Comment the _why_, not the _what_. Good: `// Children frequently mis-tap, so require confirmation before clearing.` Bad: `// set x to 5`.
- Every file starts with a short header comment: its purpose and how it fits the app.
- Every non-trivial function has a docstring (JSDoc/TSDoc) describing inputs, outputs, and edge cases.
- Name things in plain English: `selectedCellRange`, not `scr`.

**Structure:**

- One responsibility per file/component. If a file passes ~300 lines, consider splitting.
- Wrap third-party libraries behind your own small interface (adapter pattern) so they can be swapped: HyperFormula, Chart.js, each cloud SDK. This already appears in Modules 4, 6, 9.
- Keep state management in `src/state/`; don't scatter app state across components.

**Quality gates (enforced by CI — Module 1):**

- Code must pass ESLint and Prettier before merge.
- Each module ships with tests; overall, aim for meaningful coverage of core logic (grid, formulas, import/export, file format).
- No `any` types in TypeScript without a written reason.
- No secrets, keys, or passwords in the repository — ever.

**Version control:**

- Small, frequent commits with clear messages ("Add CSV import with PapaParse," not "stuff").
- One module per branch; merge only when its acceptance criteria pass.

**Performance:**

- Test on a low-end device profile, not just a fast laptop. Chromebooks are the target.
- Virtualize the grid; lazy-load heavy modules (charts, cloud SDKs) so first load is fast.

**Documentation:**

- Keep `docs/decisions.md` — every time you choose between options (e.g., build-vs-buy the grid), write one paragraph on what and why.
- Keep `README.md` current: how to install, run, build, and deploy.

---

## 15. Module Build Order (Checklist for the Agent)

Build in this order. Do not skip ahead. Commit and run CI after each.

1. ☑ **Module 1** — Foundation, tooling, CI, folder structure, error boundary.
2. ☑ **Module 5** — Design system + UI shell + i18n string table + splash. _(Built early so later modules have buttons/menus to use.)_
3. ☑ **Module 3** — The grid (hardest; budget the most time).
4. ☑ **Module 4** — Formula engine (HyperFormula wrapper).
5. ☐ **Module 8** — Import/export + versioned JSON file format + Markdown both directions. CSV, JSON, Markdown, clipboard paste, and PNG exports are complete; Excel import/export is intentionally deferred.
6. ☑ **Module 6** — Charts.
7. ☑ **Module 7** — Picture graphs (signature feature).
8. ☐ **Module 9** — Local save + browser-storage autosave + cloud adapters. Local save, autosave, offline handling, and provider scaffolds are complete; cloud save end-to-end is intentionally deferred.
9. ☑ **Module 10** — Activities, projects, TEKS data (codes verified by a human) + everyday and financial-literacy templates.
10. ☑ **Module 11** — Presentation mode.
11. ☑ **Module 12** — Help, onboarding, privacy note.
12. ☑ **Module 14** — PWA / offline support + print stylesheet + device support matrix.
13. ☐ Final pass: full e2e test suite, accessibility audit, low-end-device check, deploy to GitHub Pages.

**For token management:** Each numbered module is a safe stopping point. Finish a module, commit, run its acceptance test, then start the next in a fresh context. Carry forward only: this plan, `docs/decisions.md`, and the file-format/schema doc.

---

## 16. Honest Risk List (Read Before Building)

Since you don't code, here are the things most likely to bite you, ranked:

1. **District-locked school accounts will block cloud save.** This is the biggest real-world risk and it's outside your code's control. Test with an actual student Google/Microsoft account in week one, not at launch.
2. **Cloud provider app verification (especially Google) takes time and paperwork** for public use. Plan for it; it's not a coding problem your AI agent can solve.
3. **The grid is genuinely hard to build well.** If progress stalls, the documented fallback (Handsontable/TanStack Table + custom rendering) is acceptable — just record the decision.
4. **TEKS codes must be human-verified.** An AI can structure the alignment but should not be trusted to produce official standard codes. You verify before publishing.
5. **Performance on cheap Chromebooks** is easy to neglect on a developer's fast machine. Test on the slow target deliberately.
6. **Scope creep.** This is a big plan already. Resist adding "just one more feature" mid-build; ship the modules, then iterate.

---

_End of plan. The agent should report back after each completed module with: what was built, whether acceptance criteria passed, and any decision recorded in `docs/decisions.md`._
