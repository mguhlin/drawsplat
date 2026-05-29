# DrawSplat™ — Language / i18n Roadmap

**Purpose:** referenceable plan for the multi-language work on standalone widgets
(`solutions/`) and games (`games/`). Companion to the existing
`COMPLIANCE-ROADMAP.md`. Keep this file lean and edit-as-you-go.

**Last updated:** 2026-05-29 — Wave 2 shipped on commit `2848888` (Rubric Builder).

---

## 1. Status snapshot (Wave 1 complete)

### Infrastructure
- **`assets/js/widget-i18n.js`** — shared opt-in translation layer, six languages,
  picker auto-build, shared `localStorage.drawsplat.language` with the whiteboard,
  `widget-i18n:changed` event for dynamic re-renders. (Commit `8c1db1e`, fix in
  `4e4c080`.)
- Whiteboard already has its own `assets/js/i18n.js` + `assets/js/locales.js`
  using a substring-scanning approach; widget-i18n.js is the opt-in
  `data-i18n="key"` alternative used by widgets/games.

### Six surfaces converted (Wave 1)
| Surface | Locale dict size | Commit |
|---|---|---|
| `solutions/step-splat/` | 6 × ~250 keys (21 heuristic templates × ~7 steps) | `d3c7ff4` |
| `solutions/brain-sort/` | 6 × ~85 keys (10 topic + 3 effort + 3 when buckets) | `5922ab7` |
| `solutions/clock-wizard/` | 6 × ~190 keys (24 templates × labels + phases + caveats) | `c268e56` |
| `solutions/toneshifter/` | 6 × ~80 keys (8 tones + intensity + diff legend + CTA) | `4a20c86` |
| `solutions/vibe-check/` | 6 × ~95 keys (12 tones + per-tone interpretations) | `9157c18` |
| `games/splatball/` | 6 × ~41 keys (modes + 8 colors + overlays + toolbar) | `270957b` |

All six languages live inside each widget's `locales.js`. Source of truth is the
English section; sister languages can be edited there without touching `index.html`.

---

## 2. Wave 2 — convert remaining `solutions/` widgets — COMPLETE

**Goal:** apply the same i18n pattern (see §6 playbook) to the remaining 16 widgets.

All 16 widgets converted across two sessions. Final actual key counts and
shipping commits:

| Widget | Actual keys | Commit |
|---|---|---|
| `solutions/coinflipping/` | 25 | `a712ba3` |
| `solutions/dice/` | 32 | `2c8ae0c` |
| `solutions/drawsketch/` | 30 | `1d0d999` |
| `solutions/wheel-spinner/` | 41 | `ec01144` |
| `solutions/fortune/` | 95 (teacher + student combined) | `741bb97` |
| `solutions/dotsboxes/` | 38 | `8e56a6e` |
| `solutions/mermaid/` | 112 (chrome added alongside existing template dropdown) | `204dd88` |
| `solutions/storywheel/` | 53 | `ddac11d` |
| `solutions/dicebreakers/` | 122 (creator + play.html, OAuth cloud-save included) | `0d1b231` |
| `solutions/concept-map/` | 245 (12 templates with localized node + relationship labels) | `56a8b37` |
| `solutions/bingo-card-generator/` | 39 | `622356d` |
| `solutions/memepuzzle/` | 49 (teacher + student) | `c565333` |
| `solutions/wordsearch/` | 83 (24 TEKS preset labels) | `956e332` |
| `solutions/bingo-caller/` | 36 | `0db974a` |
| `solutions/markdown-studio/` | 111 (toolbar + find/replace + 5 help cards) | `0df5905` |
| `solutions/rubric-builder/` | 84 | `2848888` |

**Pattern was one commit per widget. Total ≈ 1195 keys × 6 languages.**

---

## 3. Wave 3 — convert remaining `games/`

| Game | Notes | Est. keys |
|---|---|---|
| `games/lightsout/` | Smallest game; size selector + theme + reset | ~40 |
| `games/floodfill/` | Color buttons + moves counter + reset | ~35 |
| `games/flowfree/` | Level picker + reset + win message | ~40 |
| `games/untangle/` | Difficulty + reset + crossings counter | ~35 |
| `games/funquiz/` | Multiple themed quizzes (smurfs/dwarfs/looney/eggquiz/galveston). Each example HTML may need its own locales OR a shared funquiz/locales.js | ~150 |
| `games/castles/` | Strategy game; resource labels + actions | ~120 |
| `games/tangram/` | Shape/silhouette picker + drag controls | ~50 |

Same pattern as Wave 1 (see §6).

---

## 4. Translation quality review

All Wave 1 translations are **AI-seeded** and need native-speaker review before
districts rely on them in K-16 classrooms. The dictionaries are the only files
reviewers need to touch — widget HTML/JS is independent.

### Review checklist per language
For each `locales.js` file, review:
- **Tone-appropriateness for K-16:** are word choices age-appropriate and free
  of colloquialisms that may not transfer well across regional dialects?
- **Action-verb consistency:** does Step-Splat's "Splat it" translate to a
  consistent action verb across all widgets, or do Spanish/Vietnamese/Arabic/
  Chinese/Hindi use different verbs widget-to-widget?
- **Heuristic template phrasing:** Step-Splat's 21 template arrays contain the
  bulk of user-visible content. Native-speaker pass should rewrite the
  AI-translated phrasing into natural classroom-friendly language.
- **Pluralization:** several places use `stage.meta.steps.one` / `.many` —
  these are crude bins. Arabic has six plural categories (zero/one/two/few/
  many/other); Russian/Czech have similar complexity. See §6.4 for the proper
  fix via `Intl.PluralRules`.
- **RTL nesting:** when an Arabic string contains an English brand name
  (`Anthropic (Claude)`), the bidi markers may need explicit Unicode
  embedding to keep punctuation right.
- **Hindi/Urdu split:** `uh` is treated as LTR Hindi (Devanagari) — see
  `assets/js/widget-i18n.js`. If districts want true Urdu (Nastaliq, RTL),
  promote it to a separate `ur` locale.

### Sourcing reviewers
- **Community PRs** against `solutions/<widget>/locales.js` — the simplest
  ask. Document the convention in `CONTRIBUTING.md` (does not exist yet).
- **Bilingual teacher pilot** — recruit one reviewer per language from the
  district pilot pool; they touch only the locale files.
- **Paid contract translator** — for districts that want certified quality.

---

## 5. Engine multilingual extensions

Several widgets have **English-only heuristic classifiers** that work poorly
on non-English input even with translated UI chrome:

| Widget | English-only engine component | Workaround in production |
|---|---|---|
| Step-Splat | `classify()` regex KEYWORD_MAP (write/plan/clean/…) | AI mode (returns `default` template for non-English input) |
| Brain Sort | `KEYWORDS` array (10 topical regexes) | AI mode + yellow `panel.langNote` warning |
| Clock Wizard | `KEYWORDS` array (25 template regexes) | AI mode + `panel.langNote` warning |
| Toneshifter | All regex (FORMALIZE / CASUALIZE / FILLERS / …) | Strong `panel.langNote`: heuristic is English-only |
| Vibe Check | `TONE_DEFS[].kw` regex per tone | AI mode + `panel.langNote` |

### Options to extend
1. **Per-locale keyword maps.** Add `KEYWORDS.es`, `KEYWORDS.vi`, etc. inside
   each widget. High accuracy, big maintenance burden — every keyword set
   needs translation + native-speaker review for false positives.
2. **Lean on AI mode.** Current approach. Free for users with their own API
   key; nothing to maintain. Documented honestly in `panel.langNote`.
3. **Hybrid via a free upstream language detector.** Auto-detect input
   language, fall back to default template for unsupported languages, show
   a one-line banner "Heuristic doesn't speak {lang}; switch to AI mode for
   accurate sorting." Adds one tiny third-party dep (e.g. `franc-min`).
4. **Server-side proxy with a small embedded model.** Out of scope until
   Phase 5+; would require backend deployment.

**Recommendation:** option 2 (current) is fine for v1. Revisit if district
pilots ask for it.

---

## 6. Per-widget conversion playbook (so future-me can execute Wave 2/3 fast)

The pattern below has been applied to all six Wave 1 surfaces. Replicate it
verbatim for new widgets.

### 6.1 Required HTML changes

```html
<head>
  ...
  <script src="../../assets/js/widget-i18n.js"></script>
  <!-- Picker styles (light-theme widget; dark-theme games need adjustments) -->
  <style>
    .header-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
    .i18n-picker select { padding: 9px 12px; border: 2px solid var(--border); border-radius: var(--radius); background: var(--white); color: var(--gray-90); font-weight: 700; font-size: .85rem; cursor: pointer; min-height: 42px; }
    .i18n-picker select:focus { border-color: var(--blue); outline: none; box-shadow: 0 0 0 4px rgba(108, 40, 217, .18); }
  </style>
</head>
<body>
  <header class="site">
    <div class="title-block">
      <p class="eyebrow"><a href="../../pages/features.html" data-i18n="header.eyebrow">…</a></p>
      <h1 data-i18n="header.h1">…</h1>
      <p class="tagline" data-i18n="header.tagline">…</p>   <!-- or data-i18n-html if it has <strong>/<sup> -->
    </div>
    <div class="header-actions">
      <div class="i18n-picker" data-i18n-picker></div>
      <a class="home-link" href="../../index.html" data-i18n="header.home">Home</a>
    </div>
  </header>

  <!-- annotate every user-visible text node, input placeholder, button label, modal field -->

  <script src="./locales.js"></script>   <!-- loads BEFORE the inline widget script -->
  <script>
    const t = (k, vars) => WidgetI18n.t(k, vars);
    /* widget code, with all hardcoded strings replaced by t('key') */
  </script>
</body>
```

### 6.2 Required JS patterns

- **Define `t`** at the top: `const t = (k, vars) => WidgetI18n.t(k, vars);`
- **Replace all** `showToast("...")` / `confirm("...")` / `element.title = "..."` /
  `element.textContent = "..."` / template strings emitting user-facing text
  with `t(...)` calls.
- **`refreshModePill()`** — for widgets with the AI mode pill: set/remove the
  `data-i18n` attribute based on whether a key is saved, so the
  widget-i18n applier only touches it in heuristic mode.
  ```js
  function refreshModePill() {
    if (settings.apiKey) {
      modePill.className = "mode-pill ai";
      modePill.removeAttribute("data-i18n");
      modePill.textContent = t("mode.ai", { provider: settings.provider === "openai" ? "OpenAI" : "Claude" });
    } else {
      modePill.className = "mode-pill heuristic";
      modePill.setAttribute("data-i18n", "mode.heuristic");
      modePill.textContent = t("mode.heuristic");
    }
  }
  ```
- **`buildPrompt()`** — for widgets that call AI providers, append a language
  hint using the dictionary's `ai.lang` value:
  ```js
  return `… Respond entirely in ${t("ai.lang")}. …`;
  ```
- **`bootI18nDependentUI()`** — at the bottom of the inline script, define a
  function that re-renders any dynamically-built UI (chips, mode pill,
  result cards) and call it once at boot + on `widget-i18n:changed`:
  ```js
  function bootI18nDependentUI() {
    renderExamples();
    refreshModePill();
    if (currentResult) render(currentResult);   // re-translate result if loaded
  }
  bootI18nDependentUI();
  window.addEventListener("widget-i18n:changed", bootI18nDependentUI);
  ```

### 6.3 Required `solutions/<widget>/locales.js` shape

```js
/* <Widget> — locale dictionary. AI-seeded; native-speaker review pending. */
WidgetI18n.register('<widget-key>', {
  en: { /* source of truth — keys + English strings */ },
  es: { /* same keys, Spanish */ },
  vi: { /* Vietnamese */ },
  ar: { /* Arabic — note: <html dir="rtl"> auto-flips */ },
  zh: { /* Simplified Chinese */ },
  uh: { /* Hindi (Devanagari, LTR) — Urdu fallback in some labels */ },
});
```

Required key conventions:
- `doc.title`, `header.eyebrow`, `header.h1`, `header.home`
- `panel.intro` (heuristic mode explainer) + `panel.langNote` (English-only
  caveat if applicable)
- `mode.heuristic`, `mode.ai` (with `{provider}` placeholder)
- `settings.h3`, `settings.providerLabel`, `settings.anthropic`,
  `settings.openai`, `settings.keyLabel`, `settings.keyPh`, `settings.modelLabel`,
  `settings.modelPh`, `settings.privacy.html`, `settings.clearKey`,
  `settings.cancel`, `settings.save`
- `toast.empty`, `toast.copied`, `toast.copyFailed`, `toast.aiReady`,
  `toast.heuristic`, `toast.keyCleared`, `toast.aiFailed` (with `{err}`)
- `footer.html`
- `ai.lang` — the BCP-47 native-name string that gets dropped into the AI
  prompt (`"English"`, `"Spanish (español)"`, etc.)

### 6.4 Common pitfalls discovered in Wave 1
1. **Stripping a greeting leaves a lowercase first letter** — re-capitalize.
   Pattern lives in Toneshifter's `stripExistingGreeting`.
2. **Trailing-period guard for sign-offs** — Formal/Friendly closers like
   `"Best regards,"` should NOT get a `.` appended. See Toneshifter's
   `ensureTrailingDot`.
3. **`stageTitle.textContent = userInput`** — when rendering user-supplied
   text into a heading that normally has a `data-i18n` attribute, **remove
   that attribute** so the next language-switch doesn't overwrite the user
   text. Restore it on Clear.
4. **AI prompt language hint placement** — append `Respond entirely in
   <langName>` AFTER all the rules, not inside them, so the LLM keeps the
   structured-output rules clear.
5. **Naive plural keys (`stage.meta.steps.one` / `.many`)** are wrong for
   Arabic/Russian/Czech. Switch to `Intl.PluralRules` (see §7.1 below)
   before any locale that needs it goes through native-speaker review.
6. **The picker is dark-themed for games.** Splatball uses a light `<select>`
   inside `ds-games-header-actions` to match the white header bar. New games
   with dark headers will need custom styling — don't blindly copy the
   light-widget CSS.

---

## 7. Infrastructure improvements (i18n module itself)

In rough priority order:

### 7.1 Proper pluralization via `Intl.PluralRules`
Replace the ad-hoc `.one` / `.many` keys with CLDR plural categories. New API:
```js
WidgetI18n.tp('stage.meta.steps', count, { n: count })
// internally picks the category (one/two/few/many/other) per locale
```
Dictionary shape becomes `{ one: '...', other: '...{n} steps' }` per key,
expandable to full CLDR for Arabic.

### 7.2 Browser language detection refinement
`normalizeLang()` currently picks up `es-MX` → `es`. Acceptable, but doesn't
distinguish regional preferences. Consider:
- `es-419` (Latin American Spanish) vs `es-ES` (peninsular Spanish)
- `zh-Hans` (Simplified) vs `zh-Hant` (Traditional) — currently all map to `zh`
- `ar-EG` vs `ar-SA` — currently all map to `ar`

If districts ask for Traditional Chinese, add a separate `zh-tw` locale.

### 7.3 RTL CSS audit for Arabic
Layouts mostly inherit `<html dir="rtl">` cleanly because they use flexbox.
Spot-check needed:
- `transform: translateX(...)` directions (animations may need flipping)
- `border-left` / `border-right` accents — switch to `border-inline-start` /
  `border-inline-end`
- Icon margins (`margin-right: 8px` on a status pill should become
  `margin-inline-end`)
- Chip rows that scroll horizontally

Run through Splatball, Toneshifter (diff view), and Brain Sort (sorted
groups) in Arabic and screenshot any visual breakage.

### 7.4 Missing-key linter
Currently a missing key returns the key string itself ("toast.empty" instead
of "Type a task first."). Add an opt-in dev-mode flag that logs missing keys
to the console so contributors notice fast:
```js
WidgetI18n.setDevMode(true);  // logs missing keys + falls back to en + key suffix
```

### 7.5 Per-widget loader convenience
The current pattern requires two script tags + careful order. Consider a
single auto-loader: `<script src="../../assets/js/widget-i18n.js"
data-locales="./locales.js" data-widget="step-splat">` — module loads locales
itself and registers under the named key. Reduces boilerplate by 1 line per
widget.

### 7.6 Dictionary diff tool
A tiny CLI: `node scripts/i18n-diff.js solutions/step-splat/locales.js` that
prints missing/extra keys per language vs `en`. Useful for reviewers and
for catching silently-stale translations as English evolves.

### 7.7 Locale `<select>` styling consistency
Each widget currently styles `#i18nSwitcher` in its own CSS. Consider moving
the baseline styling into `widget-i18n.js` (injected `<style>` tag once),
with widgets overriding via `select#i18nSwitcher { ... }` only when needed.

---

## 8. Discoverability and nav

- **Language toggle on the index page** — landing page links to translated
  whiteboard entry pages (`languages/index-{sp,vn,ab,cn,uh}.html`) but
  doesn't list which widgets support each language. Add a "supported in your
  language" badge on `pages/features.html` per widget once Wave 2 ships.
- **`?lang=es` URL parameter** — supported now. Document this so teachers
  can share Spanish-direct links (`drawsplat.org/solutions/step-splat/?lang=es`).
- **Per-language landing page for widgets** — analogous to the existing
  `languages/index-sp.html` for the whiteboard, build `languages/widgets-sp.html`
  that lists all six (eventually all 29) tools with one-line descriptions
  per language.

---

## 9. Open questions for the user

Decisions to revisit before Wave 2 starts in earnest:

1. **One commit per widget, or batch the tiny ones?** Wave 1 used one
   commit per widget; bundling coinflipping + dice + drawsketch + wheel-spinner
   into a single commit would still be clean.
2. **Where to land Wave 2 work in calendar terms?** No-rush
   (community-driven) vs. focused-sprint (you direct another marathon
   conversion session).
3. **Promote Urdu to its own `ur` locale?** Currently `uh` = Hindi
   (Devanagari, LTR). If districts request true Urdu (Nastaliq, RTL), it
   should be a separate locale, not a shared one.
4. **What to do about Mermaid's existing `langSelect` UI?** It controls
   diagram templates (Spanish/Vietnamese sample diagrams etc.) and is
   semantically different from the widget-i18n picker (UI chrome). Convert
   without breaking the existing template translator — probably means
   renaming the existing select to `#templateLangSelect` to avoid the
   `#i18nSwitcher` collision.
5. **Centralized scripts for diff and validation?** Worth standing up
   `scripts/i18n-validate.js` to:
   - Verify every `en` key exists in `es/vi/ar/zh/uh`
   - Verify no widget HTML has `data-i18n="key"` for keys missing from
     `locales.js`
   - Spot-check `<sup class="tm">TM</sup>` is preserved across `*.html`
     translations

---

## 10. How to use this file in future sessions

Refer Claude to this file with something like:

> Look at `futuremap.md` and start Wave 2: convert
> `solutions/coinflipping/` and `solutions/dice/` to the same i18n pattern.

Claude should read §6 (playbook) and any directly-relevant subsections, then
proceed widget-by-widget.

After each wave, edit the **Status snapshot (§1)** at the top of this file
to reflect what shipped so future sessions stay calibrated.
