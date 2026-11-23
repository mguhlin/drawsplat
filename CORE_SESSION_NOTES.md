# SplatWorks core-app development handoff

The regression pass fixed ListSplat project-file integrity and GridSplat merged
cells. Browser applications belong in this repository; the Go/Wails adapters and
native releases belong in the sibling `splatworks-desktop` repository.

## Implemented behavior

| App/workflow | Result | Evidence |
| --- | --- | --- |
| ListSplat project import | SUPPORTED: validate nested tables, fields, records, settings and identifiers before replacing the workspace or browser draft; retain unknown version-1 properties | 54 unit tests; malformed-import and damaged-autosave browser checks |
| GridSplat merged cells | SUPPORTED: clearing values retains merge metadata through saving and reopening; sorting affected merged rows reports an actionable message without changing data or undo history | 48 unit tests pass, one existing skip; 28 applicable desktop/mobile browser cases pass |
| WriteSplat | Existing document-model checks and cross-app handoffs PASS | 51 unit tests and production file-routing checks |
| ShowSplat | Existing writing/presentation handoffs PASS | Production DOCX/PPTX routing and CI Office-format checks |
| LayoutSplat | Built entry point and local runtime-resource check PASS | `scripts/check-splatworks-builds.mjs`; remaining publishing work stays in `splatworks/ROADMAP.md` |

ListSplat rejects malformed project structures before any autosave write. Its
startup loader ignores a damaged browser draft so the app remains usable. Valid
classroom templates, comments, history, saved views and extension properties have
acceptance checks. Semantic relationship repairs remain distinct from structural
file validation.

GridSplat keeps merge-owner and covered-cell metadata when clearing values. Sort
rejection happens before creating an undo entry. Unmerged rows outside a merged
region remain sortable. The freeze-cancellation browser test waits for initial
autosave before asserting a gesture status, preventing an unrelated save message
from racing that assertion.

## Source and delivery

- `f064c39`: ListSplat and GridSplat fixes, production bundles and regression tests.
- `1597bca`: canonical privacy output and production merge checks in CI.
- The download page links [PDF/Cipher v1.0.0-rc.10](https://github.com/mguhlin/splatworks-desktop/releases/tag/v1.0.0-rc.10)
  and [six standalone apps tools-v1.0.0-rc.4](https://github.com/mguhlin/splatworks-desktop/releases/tag/tools-v1.0.0-rc.4).
  The native repository's `SESSION_NOTES.md` records platform checks, public hashes
  and signing/device limits.
- Production checks passed at [ListSplat](https://splatworks.org/splatworks/listsplat/)
  and [GridSplat](https://splatworks.org/splatworks/gridsplat/) using isolated browser
  profiles and fictional data. They exercise damaged import/draft recovery and
  merge clearing, reload and sort rejection.
- App bundles: `listsplat/assets/index-CwabZXy4.js` and
  `gridsplat/assets/index-DcQA343K.js`. These identify the tested application code.

## Verification and future builds

153 core unit checks passed across ListSplat, GridSplat and WriteSplat, with one
existing GridSplat skip. Production interoperability checks, the three live
regression cases, and the app-entry/resource checker passed. GridSplat lint and
TypeScript/production builds passed. ListSplat's TypeScript/production build passed.
The shared interoperability workflow includes ListSplat and GridSplat regression
files so later edits keep these safeguards exercised.

Install locked dependencies with `npm ci --ignore-scripts` in each app before
running its tests. GridSplat builds into `dist/`; publish those files into its
site directory after its development server has stopped. Its development wrapper
restores the deployment entry point on normal shutdown. ListSplat's build script
copies its production files into the site tree directly.

After app builds, run `python3 scripts/build-privacy-controls.py`; Vite folds the
privacy stylesheet into the app bundle, while the canonical site output also
requires its explicit shared link. Run the script's `--check` mode and
`node scripts/check-privacy-coverage.cjs`. After download/wiki changes, run
`python3 scripts/build-support-wiki.py` and commit its generated search index.
Keep maintenance dates out of templates, generated content and public notes.

## Evidence boundaries

| Gate | Result and limits |
| --- | --- |
| Task/design/accessibility | Selected UI workflows, keyboard actions and automated accessibility smoke checks PASS; human assistive-technology qualification NOT_RUN. |
| Privacy/education applicability | Fictional browser-local drafts and explicit exports exercised; no school accounts, cloud documents or production records were changed. |
| Security boundaries | Damaged project rejection preserves open work and saved bytes; this is scoped regression evidence, not a full audit. |
| Recoverable delivery | Production app assets, live changed behavior and reproducible generated output verified; browser drafts still require user backups. |

Decision: GO for the tested browser fixes. Desktop stable publication remains
CONDITIONAL on publisher signing and physical-device evidence. Do not set native
approval flags or claim hardware qualification from browser automation.

The unrelated untracked `pages/audit_instructions.md` was preserved.
