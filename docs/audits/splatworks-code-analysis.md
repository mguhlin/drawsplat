# SplatWorks code analysis and release verification

## Scope

Reviewed the registered SplatWorks/DrawSplat apps, classroom tools and games through source analysis, registered entry points, existing automated checks, and targeted failure injection. Particular attention went to office project isolation and saving, GraphSplat, Bingo Caller, and PDFSplat's complete browser suite. This is a bounded audit, not proof that every feature of every app is defect-free.

Baseline source: `26b209f`. The checkout matched `origin/main`. The unrelated, untracked `pages/audit_instructions.md` was preserved. Parent AGENTS.md instructions authorize testing, committing, pushing, deployment and production verification. No application data or real classroom submission was sent during testing.

## Findings and fixes

| Impact | Trigger and defect | Repair and verification |
| --- | --- | --- |
| High | Block browser storage. Unguarded reads stopped office, video, classroom and admin startup. | Optional preference reads/writes tolerate blocked APIs. WriteSplat, ShowSplat, ListSplat, GridSplat, VideoSplat, SplatBot Studio, Dicebreakers, Bingo Caller and administration receive targeted startup checks. Admin starts locked; viewer preview remains available. |
| High | Deny storage or exhaust quota during office editing. WriteSplat's save timer threw; ListSplat mutations could stop before rendering and show a stale save state. | Preserve live edits, show explicit file-download recovery, keep undo and project export available, and never claim a failed write succeeded. Browser tests inspect downloaded project content and reverse a failed-save edit. |
| High | Open an office transfer while session storage is blocked. Isolation detection itself could abort startup. | Remember transferred-workspace identity in memory, keep persistent and imported-tab drafts separate, and let actual save failures reach the app's recovery path. A fault-injection test proves that the original local draft cannot be overwritten. |
| Medium | Restore malformed ListSplat browser JSON. Parsing/validation stopped startup. | Fall back to a usable starter without deleting the stored draft; project import remains available. |
| Medium | Generate Bingo Caller cards. Each cell reshuffled its column independently, allowing repeated column values. | Shuffle each column once and deal distinct entries; a deterministic seeded regression checks repeated card generation. |
| Medium | Switch Bingo rooms. The original receiver remained subscribed and each save created another unclosed channel. | Maintain one channel per room, close it on switching/page exit, reconnect after a back/forward-cache return, and validate received state. A three-tab test verifies isolation and delivery in both rooms. |
| Medium | Clear Bingo marks and reload, or read corrupt saved cards/state. New games could retain old marks; cleared marks were not persisted; malformed storage could break the game. | Reset marks on a new game, persist cleared marks, validate saved data, and retain a playable in-memory game when saving is blocked. |
| Medium | Import a GraphSplat project saved in another workspace. The top-level mode was never restored, and generated descriptions could replace authored descriptions. | Validate and restore workspace identity and preserve a supplied description. Test a fresh-browser equation project round trip and an existing function project. |
| Medium | Put markup in a rejected GraphSplat expression, then show its value table. Raw strings were inserted into table/error HTML. | Escape table cells and use textContent for errors. Regression confirms markup stays text; no exploit bypass of the site's CSP is claimed. |
| Medium | Evaluate `root(-4,2)` or a zeroth root. The evaluator returned mathematically invalid real values. | Enforce the real-number domain while retaining negative odd roots. Model tests cover both accepted and rejected cases. |
| Low | A malformed GraphSplat project index or unreadable input interfered with opening work. | Validate the saved index shape, report file-read errors, and clear the file picker for retry. |

A runner-only phone-layout failure was traced to wider system-font metrics pushing the translated header navigation beyond 390 pixels. The header now wraps instead of overflowing. A diagnostic layout check and CI screenshot artifact preserve bounds and visual evidence when future regressions occur.

## Separately requested GraphSplat addition

Equation Studio is an explicit feature request made during the audit. It adds local LaTeX formatting, 18 insertion templates, eight editable examples, SVG/PNG/JPEG and printable output, LaTeX/MathML copying, native project round trips, and reading of a reviewed description with a local browser voice. It does not implement handwriting recognition, speech-to-math, automatic solving, chemistry prediction, or office extensions.

The follow-up StyleLaTeX request adds validated `.tex` equation imports; complete LaTeX, Markdown and self-contained HTML export; escaped CSV/TSV-to-booktabs conversion; three editable table examples; and numeric matrix insertion. Table input/settings survive project export/import. Imported equations validate before replacing work, and delayed reads cannot overwrite newer edits or a changed workspace. Recognition, AI repair, whole-document conversion and full TeX compilation remain proposals.

MathJax and its SVG font data are bundled from a locked dependency tree; no runtime package loader or remote font request is needed. The engine loads only for Equation Studio. The bundle includes license notices. Invalid notation disables stale-result export. Render-generation checks prevent a delayed engine load from overwriting a replacement workspace.

The [next-generation improvement plan](../next-gen-improvements.md) remains a proposal backlog. Its PDFSplat project packages, search, forms, reading-order review and other proposals were not implemented.

## Baseline and historical evidence

- Broad initial Chromium run: 120 passed, one static consistency failure. That failure reported ClipSplat, FontSplat and MemeSplat language integration.
- ClipSplat already has a native `src/i18n.js`; the static test recognized only `.ts`. Detection now includes either actual language module. FontSplat and MemeSplat still need a substantive localization implementation; these remain in the plan.
- Shared model/backend baseline: 43 passed, six skipped because the corresponding database integration environment was absent.
- App model baselines: WriteSplat 51 passed; ListSplat 43; GridSplat 46 with one skipped; AudioSplat 14; MediaSplat 35; VideoSplat 134.
- Earlier Whiteboard audits documented data-loss, import cancellation, export and service-worker repairs. The broad regression selection includes Whiteboard workflows and existing typing/game checks; it does not claim to repeat every historical long-session or hardware scenario.
- Existing open accessibility issues cover keyboard game alternatives, reduced motion, administrator localization and Whiteboard screen-reader/keyboard support. The PDFSplat issue for physical Chromebook/ChromeVox and constrained devices remains applicable.

An early concurrent cross-browser/PDFSplat run produced timeouts under memory pressure. It was stopped and rerun with one browser worker. Initial new-test corrections included targeting actual editable elements, dismissing SplatBot's introduction, waiting for a held module at DOMContentLoaded instead of the browser load event, and comparing network requests with the configured origin. These failed attempts are not counted as passing coverage.

## Verification results

- Affected-app and GraphSplat checks: **114 passed** across installed Chrome 157.0.8103.50, Playwright Firefox 150.0.2 and WebKit 26.4, with 38 cases per engine.
- PDFSplat full suite: **269 passed, seven skipped** across Chrome and Firefox. Skips cover mobile-only cases, opt-in production smoke checks, and a Chromium-only touch test running under Firefox. The earlier isolated crop/export/core-workflow selection also passed all 22 cases.
- Shared model/backend and equation checks: **46 passed, six database-dependent skips**. Four RSS Python tests passed.
- Fresh model checks after the repairs: WriteSplat **51 passed**, ListSplat **43**, GridSplat **46 passed, one skipped**, VideoSplat **134 passed**.
- Registry validation covers **69 destinations**. Office entry-point/resource checks and generated privacy-inventory checks pass. The equation bundle rebuild and locked dependency install succeed; its dependency audit reports no vulnerabilities.

The initial broader selection ran 222 cases: 211 passed and 11 failed. Ten failures were traced to outdated PDF language-menu/label assumptions, consolidated site navigation and download versions, or the new ListSplat save announcement creating a second broad status selector. The language/navigation checks now exercise the actual menus, download checks compare matching current package versions, and the save announcement uses a separate polite live region. The first corrected selection passed all 21 cases. The FontSplat/MemeSplat localization check remains a disclosed failure. The corrected broader run finished with **221 passed and one disclosed localization failure**. All **18 archives** passed SHA-256 and ZIP CRC validation. Critical equation, office-transfer and Bingo files were compared with source. The extracted modules passed **32 startup checks** in Chromium/Firefox, and Equation Studio passed **22 additional workflow checks** from the Tools ZIP. All **18 displayed download sizes** match measured ZIP/unpacked sizes. The archive base is `d96cfdb4cf70a273781eda7728b623cc30ab57ba`, with final source/catalog changes applied atomically and verified; the exact packaged source and changed files are recorded in the release manifest; `v3.1.50-verification.json` and the consolidated checksum manifest accompany the release. The earlier production runtime passed 11 Equation Studio and 17 storage/recovery checks. SplatBot startup readiness now waits for Blockly initialization before dismissing its introduction; mission options appear earlier during asynchronous startup. Final converter publication evidence is recorded below. The audit uses actual desktop Chrome, bundled Firefox and WebKit; phone/tablet viewport and touch checks are emulation. Physical mobile hardware, ChromeOS, ChromeVox and a live school database are outside this run.

The final affected-app, GraphSplat and converter regression run passes **126 checks** across Chrome, Firefox and WebKit. The refreshed wiki/navigation/district selection passes **33 checks**, and four RSS tests pass. The converter model suite passes all seven checks. Initial converter/browser coverage passed 72 checks across Chrome, Firefox and WebKit; the final equation-only rerun passed 45, including delayed-import preservation. These are overlapping runs, not additive unique coverage. HTML exports were opened with network requests blocked; table values, literal markup, quoted CSV/newlines, error recovery, file round trips and phone layouts were verified. Full external TeX compilation was not run.

## Known limits

FontSplat and MemeSplat lack the language-switcher integration required by the existing static suite check. These are disclosed rather than hidden by relaxing the test. Read-aloud and MathML output require review in the intended device, assistive technology and destination app. A working desktop emulation does not certify hardware capture, mobile background behavior or accessibility conformance.

## Publication

[SplatWorks v3.1.50](https://github.com/mguhlin/drawsplat/releases/tag/v3.1.50) publishes all 18 archives and three checksum/provenance files. GitHub reports every asset as uploaded; all remote SHA-256 digests and sizes match local verification. Existing releases are retained. The runtime and package source is `c0552ba1e35fec9380a2b72c6dbc2419c845e4b1`. The archive manifest records the original build base and the source files applied atomically to the three GraphSplat-containing packages; other module archives retain their already-verified content.

The refreshed Tools ZIP passes **45 Equation Studio/conversion checks** across Chrome, Firefox and WebKit. Production passes **32 equation/conversion/storage checks on SplatWorks.org** and **15 equation/conversion checks on DrawSplat.org**. Across both domains, 46 critical application, bundle, guide, blog, release-note and download resources match source SHA-256 hashes. The scheduled-post handler reserializes RSS; the GraphSplat entry fields match source on both domains. All 18 displayed package sizes match measured ZIP and unpacked sizes.

[GraphSplat CI](https://github.com/mguhlin/drawsplat/actions/runs/43352198121), [wiki consistency CI](https://github.com/mguhlin/drawsplat/actions/runs/43352390040) and [production source deployment](https://github.com/mguhlin/drawsplat/actions/runs/43352389082) pass. Main-branch publication serves the verified runtime on both public domains. No additional manual deployment was needed. Source, built assets, wiki/search index, blog/RSS, release notes, offline cache handling, packages, sizes and checksums are published. The separate next-generation plan remains proposals only; its recognition, PDF and suite-wide roadmap items were not implemented.
