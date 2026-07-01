# WebDeck Project Instructions v3.0

**Version rule:** Keep the version number in this title. For every future revision, increment the version number and briefly note what changed before sharing or reusing the instructions.

**What changed in v3.0:** This version is optimized for GenAI chatbots. It gives a stricter build contract, clearer output rules, a required single-file runtime, ShowSplat-friendly iframe behavior, stronger responsive and accessibility requirements, and a practical validation checklist. It keeps PPTX/image import guidance but separates it from the core deck requirements so chatbots do not confuse optional import work with the finished HTML deliverable.

Use these instructions to turn source material into a polished, self-contained HTML slide deck called a **WebDeck**. A WebDeck should open directly from disk, run on GitHub Pages or any static host, embed cleanly in an LMS or WordPress iframe, and work well as a ShowSplat webdeck.

## Core Goal

Create exactly one finished `.html` file that contains the complete slide deck:

- HTML structure
- CSS in one internal `<style>` block
- JavaScript in one or two internal `<script>` blocks
- Slide content in one editable JavaScript data array
- Speaker notes
- Navigation controls
- Presenter tools
- Responsive styling

The file must not require a build step, package manager, framework, CDN script, image folder, server API, storage permission, or external asset directory.

The only optional external network request is Google Fonts. If offline durability matters more than typography, use system fonts instead.

## Non-Negotiable Output Rules

When generating a WebDeck, the AI must:

1. Return one complete HTML document, starting with `<!doctype html>` and ending with `</html>`.
2. Put all deck content in a single `const SLIDES = [...]` array.
3. Keep rendering, navigation, presenter mode, notes, and controls generic. Do not hard-code slide content into the engine.
4. Include no external JavaScript libraries, CSS libraries, icon libraries, analytics, trackers, iframes, or remote images.
5. Use inline SVG, CSS shapes, gradients, and embedded data URI images for visual assets.
6. Use real HTML text for normal slide content. Only use text baked into images when importing a finished slide design.
7. Work from a `file://` path, on a static web host, and inside a sandboxed iframe.
8. Avoid `localStorage`, `sessionStorage`, cookies, IndexedDB, service workers, module imports, top-window redirects, and APIs that fail in iframes.
9. Open external links in a new tab with `target="_blank"` and `rel="noopener"`.
10. Include a final validation note listing the checks performed or the checks the user should run.

If a chatbot cannot attach a file directly, it should provide the full HTML in one fenced `html` code block and clearly name the intended filename.

## ShowSplat Compatibility

A ShowSplat-ready WebDeck is a single-file HTML experience that behaves well when uploaded, hosted, or embedded. Build for these conditions:

- **Iframe-safe:** The deck must not depend on access to `window.top`, browser storage, cross-origin APIs, or parent-page scripts.
- **No asset paths:** Do not reference `./assets/...`, `/images/...`, CDN images, or local file paths. Every required visual must be inline SVG, CSS, or a data URI.
- **No build-time assumptions:** The deck must run without Vite, React, npm, bundling, transpilation, or TypeScript compilation.
- **Responsive viewport ownership:** Use `100dvh` with fallbacks and make the deck fill its container without forcing the parent page to scroll horizontally.
- **Safe fullscreen:** Include a fullscreen button, but do not require fullscreen for usability. Fullscreen may be unavailable inside some embeds.
- **Safe presenter mode:** Presenter view may use `window.open()` and `BroadcastChannel`, but the audience view must remain fully usable when pop-ups are blocked or unsupported.
- **Hash navigation:** Support `#1`, `#2`, and so on. The deck must also respond to live `hashchange` events.
- **No console errors:** The browser console should be clean after load and after navigating through all slides.
- **Small file target:** Keep the final file as small as practical. Aim for under 5 MB; under 2 MB is better. If image-heavy imports make that impossible, explain why.

## Recommended HTML Skeleton

The exact implementation can vary, but every WebDeck should include these major elements:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Deck Title</title>
  <style>
    /* All CSS here */
  </style>
</head>
<body>
  <main id="deck" class="webdeck" aria-live="polite"></main>
  <div id="progress" aria-hidden="true"></div>
  <nav id="controls" aria-label="Slide controls"></nav>
  <aside id="notesPanel" aria-label="Speaker notes"></aside>
  <section id="helpOverlay" aria-label="Keyboard shortcuts"></section>
  <script>
    const DECK = { title: 'Deck Title', subtitle: '', author: '' };
    const SLIDES = [
      {
        bg: 'dark',
        title: 'Opening',
        html: `<h1>Deck Title</h1><p class="lead">Short promise or framing.</p>`,
        notes: `I am opening by naming the topic and giving the audience a clear reason to listen.`
      }
    ];
  </script>
  <script>
    /* Generic WebDeck engine here */
  </script>
</body>
</html>
```

## Slide Data Contract

Every slide object must use this shape:

```js
{
  bg: 'light' | 'dark' | 'navy' | 'accent' | 'section' | 'imgslide',
  title: 'Concise presenter cue',
  html: `Visible slide markup`,
  notes: `First-person speaker notes in the presenter's voice.`
}
```

Optional fields are allowed when useful:

```js
{
  id: 'short-stable-id',
  classes: 'custom-layout another-class',
  links: [
    { href: 'https://example.com', label: 'Resource name' }
  ]
}
```

Rules:

- Use template literals for slide `html` and `notes` when content spans multiple lines.
- Escape backticks inside template literals or avoid them.
- Do not store raw user content in the engine.
- Do not splice slides by fragile line numbers. Edit whole slide objects.
- After editing slide data, syntax-check the file or at least inspect the browser console for `SLIDES is not defined`, unterminated strings, or unexpected tokens.

## Required User Features

### Navigation

Include all of these:

- Right Arrow, Space, Page Down, and Down Arrow move forward.
- Left Arrow, Page Up, and Up Arrow move backward.
- Home jumps to the first slide.
- End jumps to the last slide.
- Number hash links like `#5` open slide 5.
- Live `hashchange` updates the current slide.
- Swipe left and right works on touch devices.
- Click navigation works only on the left and right thirds of the slide area.
- The center third does nothing, so content clicks are safe.
- Click navigation must ignore clicks on links, buttons, controls, notes, overlays, form fields, and selectable text.

### Floating Control Bar

Add a floating rounded-pill control bar near the bottom of the viewport.

The bar must include:

- Deck title or short label on larger screens
- Previous and next buttons
- Dots for each slide
- Current slide indicator
- Slide counter
- Notes button
- Help button
- Fullscreen button
- Presenter button

Implementation rules:

- Position it above the bottom edge, not flush to `bottom: 0`.
- Use a capped width so it does not sprawl on wide projectors.
- Use translucent background, subtle blur, and a thin border.
- Keep it clickable at every viewport size.
- Hide the deck title and optionally the counter on narrow phones.
- Keep touch targets at least 2.2rem on coarse-pointer devices.

### Speaker Notes

Include a notes panel that slides up over the deck.

Rules:

- Notes are hidden by default.
- Closed notes must use `pointer-events: none`.
- Open notes must use `pointer-events: auto`.
- The panel must sit above the floating control bar, not under it.
- Notes should update when the current slide changes.
- Notes must not appear in the audience view unless the presenter opens them.

### Presenter View

Include a presenter mode that:

- Opens a second browser window for the audience view.
- Converts the original window into a presenter console.
- Shows the current slide preview.
- Shows current slide notes.
- Shows the next slide title or cue.
- Shows a running timer.
- Keeps windows in sync with `BroadcastChannel`.
- Continues to work as a normal single-window deck if pop-ups are blocked.

Warn the user in notes or final instructions that the browser may require pop-ups to be allowed for presenter mode.

### Help Overlay

Include a help overlay showing all keyboard shortcuts and controls. It should open and close with `?` or `h`, and close with Escape.

### Fullscreen

Include a fullscreen button and keyboard shortcut. The deck must remain usable when fullscreen is unavailable.

### Progress

Include a thin progress bar across the top that fills as the user advances.

## Speaker Notes Voice

Write notes as the presenter would actually say them.

Rules:

- First person is preferred.
- Orient the listener to what is on the slide.
- Explain why it matters.
- Bridge to the next idea.
- Keep most notes between 80 and 130 words.
- Do not include stage directions like "pause here" or "click next."
- Do not include generic hype, apologies, or assumptions about the audience's feelings.

## Visual Direction

Default to a clean, high-contrast, professional style:

- Dark title slide
- Light content slides
- Dark section breaks
- Dark closing slide
- One repeating motif across the deck
- Two or three accent colors plus neutrals
- CSS variables for every color, shadow, radius, and spacing scale
- A display face for headings, a clean body face, and a monospace face for code or prompts

Good slide patterns:

- Title slide
- Section break
- Big idea statement
- Statement plus one statistic
- Three-card or four-card framework
- Two-column explanation
- Comparison table
- Timeline or process
- Browser-frame mockup
- Prompt or code block
- Resource grid
- Closing call-to-action

Avoid:

- Tiny text
- Dense paragraphs
- Overloaded slides
- Decorative clutter
- Low-contrast text
- Text that overlaps the control bar
- Content that only works at one screen size
- A one-note color palette dominated by one hue

## Responsive Requirements

The deck must work from a wide projector down to a narrow phone.

Use:

- `clamp()` for headings, leads, and body text.
- `100dvh` with fallback to `100vh`.
- `box-sizing: border-box`.
- Slide padding that leaves room for the floating control bar.
- `overflow-y: auto` on slides when content is taller than the viewport.
- Responsive grids that step down gradually.
- Horizontal scrolling wrappers for wide tables.
- `@media (max-width: 1024px)`, `768px`, `560px`, and `380px` or equivalent layered breakpoints.
- `@media (hover: none)` or `(pointer: coarse)` for touch target adjustments.
- `@media (prefers-reduced-motion: reduce)` to remove or shorten animation.
- A landscape-phone rule using `max-height` and `orientation: landscape`.

On phones:

- Hide decorative elements that crowd content.
- Stack columns.
- Reduce large margins.
- Keep controls usable.
- Let slide content scroll instead of clipping.

## Accessibility Requirements

Every WebDeck must:

- Use semantic headings in slide content.
- Give the active slide an accessible label using its title.
- Ensure links have meaningful text.
- Use visible focus styles.
- Maintain readable color contrast.
- Avoid dark text on dark surfaces and light text on light surfaces.
- Respect `prefers-reduced-motion`.
- Keep controls keyboard accessible.
- Avoid keyboard traps in overlays.
- Use `aria-expanded` for toggle buttons where appropriate.

Dark-surface rule:

Set light text color on every dark slide, dark card, dark prompt block, and dark panel. Nested paragraphs, list items, captions, and links must inherit readable light colors. Do not rely only on a parent slide class if dark cards can appear on light slides.

## Imported Designs and Image Slides

A WebDeck may combine coded slides with imported full-slide designs from Canva, PowerPoint, Keynote, Figma, Illustrator, SVG, PNG, JPEG, or PDF export.

When using image slides:

- Embed images as data URIs. Do not link to image files.
- Prefer 16:9 images at 1920x1080 or 1600x900.
- Compress photographic slides to JPEG or WebP at reasonable quality.
- Keep simple vector art as inline SVG when smaller than raster.
- Use `bg: 'imgslide'`.
- Put a real `title` and useful `notes` on every image slide.
- Use `object-fit: contain` so the entire slide is visible.
- Leave room for the floating control bar so baked-in footers are not covered.
- Add transparent link overlays only when accurate coordinates are known.
- If link coordinates are unknown, list the links in notes or a resources slide instead of guessing.

Warn the user that text baked into imported images is not editable, searchable, or ideal for screen readers.

## PPTX Import Guidance

If a PPTX is supplied, treat it as the primary source for:

- Slide order
- Slide titles
- Visual design
- Speaker notes
- Hyperlinks
- Media

Default import approach:

1. Render each PPTX slide faithfully as a full-slide image.
2. Rasterize to 1920x1080 or equivalent widescreen size.
3. Compress each image.
4. Embed each image as a data URI.
5. Insert each slide into `SLIDES` with `bg: 'imgslide'`.
6. Extract speaker notes from the PPTX notes XML when available.
7. Extract titles from title placeholders; otherwise use `Slide 1`, `Slide 2`, and so on.
8. Preserve hyperlinks as transparent overlays only when coordinates are reliable.
9. Add uncertain links to a resources slide or notes field.

If both PPTX and PDF are supplied, use the PPTX as source of truth. Use the PDF only as a fallback for link recovery or visual verification.

Editable import mode is optional. Use it only for simple decks where text boxes, shapes, and images can be converted cleanly into real HTML. For complex design decks, prioritize visual fidelity with rendered image slides.

## WebDeck Engine Requirements

The generic engine should:

- Render exactly one active slide at a time.
- Update the active slide without reloading the page.
- Keep `currentIndex` in memory.
- Clamp navigation to valid slide bounds.
- Update the URL hash when slides change.
- Avoid recursive hash update loops.
- Update dots, counter, progress, notes, and presenter view on every slide change.
- Pause click navigation while overlays or notes are open.
- Ignore navigation keystrokes when the user is typing in an input, textarea, select, or contenteditable element.
- Cleanly handle decks with 1 slide or many slides.
- Avoid global variable clutter beyond the deck data and engine namespace.

## Validation Checklist

Before calling the deck complete, run or simulate these checks:

- The HTML opens from a local `file://` path.
- The HTML opens from a static web server.
- The HTML works inside an iframe-sized container.
- The console shows no errors on load.
- Every slide renders.
- Every slide advances and retreats with keyboard controls.
- Dots jump to the correct slides.
- The slide counter is correct.
- The progress bar is correct.
- Hash links such as `#1` and `#5` open the right slides.
- Changing the hash while loaded navigates live.
- Left-third and right-third click navigation works.
- Center clicks do not navigate.
- Clicking links, buttons, controls, notes, and overlays does not accidentally navigate.
- Touch swipes work.
- Notes open, close, update, and do not block controls when closed.
- Presenter mode opens or fails gracefully if pop-ups are blocked.
- Fullscreen works or fails gracefully if blocked.
- The control bar is visible and clickable at desktop, tablet, phone, and short landscape sizes.
- Slide content scrolls instead of clipping on small screens.
- No text is hidden behind the control bar.
- Dark slides and dark cards have readable text, including nested lists and links.
- Links open in a new tab with `rel="noopener"`.
- The file uses no external assets except optional Google Fonts.
- The file size is reasonable for the amount of imagery.

## GenAI Build Process

When a user gives source material, the AI should follow this process:

1. Identify the audience, purpose, and desired slide count.
2. Choose a clear arc or framework.
3. Decide which slides should be coded and which, if any, should be image slides.
4. Define the deck title, section breaks, and closing slide.
5. Draft slide titles and speaker notes.
6. Build the single HTML file.
7. Check the slide data syntax.
8. Review responsive behavior and control interactions.
9. Return the finished file or complete HTML.

If the source material is too thin or ambiguous, make conservative assumptions and state them briefly. Do not stop unless a missing answer would materially change the deck.

## Starting Prompt

Paste this prompt into a capable GenAI chatbot with your material:

```text
Build me a WebDeck following WebDeck Project Instructions v3.0.

Output exactly one self-contained HTML file. It must run from file://, static hosting, and inside an iframe. It must work well as a ShowSplat webdeck. Do not use external JavaScript, CSS libraries, remote images, build tools, localStorage, sessionStorage, cookies, service workers, module imports, or asset folders. The only optional external request is Google Fonts.

Put all slide content in a single const SLIDES = [...] array. Keep the engine generic. Every slide needs a concise title, visible HTML, and first-person speaker notes.

Required features: keyboard navigation, swipe navigation, guarded left/right-third click navigation, clickable dots, slide counter, floating rounded-pill control bar above the bottom edge, top progress bar, slide-up speaker notes panel with pointer-events disabled while closed, help overlay, fullscreen button, presenter mode with BroadcastChannel sync, graceful fallback when pop-ups or fullscreen are blocked, and hash deep linking that also responds to live hashchange.

Make it responsive from projector to phone using clamp() type, layered breakpoints, scrollable slides, stacked grids, touch-sized controls, prefers-reduced-motion handling, and a short landscape-screen rule. Keep the control bar visible and clickable at every size.

Use a clean high-contrast visual system with CSS variables, a dark title slide, light content slides, dark section breaks, and a dark closing slide. Use real HTML text unless I explicitly supply finished slide images. Make all links open in a new tab with rel="noopener".

Brand colors: [LIST HEX VALUES OR SAY "choose a clean default"]
Fonts: [LIST FONTS OR SAY "choose a clean default"]
Target slide count: [N OR "choose what fits"]
Audience: [AUDIENCE]
Purpose: [PURPOSE]
Preferred structure: [FRAMEWORK/ARC OR "propose one"]

If I attach a PPTX, treat it as the primary source for slide order, visuals, speaker notes, titles, and links. Render complex PPTX slides as compressed embedded image slides. Extract notes where available. Preserve links as transparent overlays only when coordinates are reliable; otherwise list links in notes or resources. Use any PDF only as fallback for link recovery.

Before finishing, validate: no console errors, all slides render, controls work, notes do not block clicks when closed, hash links work, small screens do not clip content, dark surfaces have readable text, and no required asset is external.

Material:
[PASTE OR ATTACH SOURCE MATERIAL]
```

## Final Delivery Format

When the AI finishes, it should provide:

1. The completed `.html` file or one complete fenced `html` code block.
2. A short note naming any assumptions made.
3. A short validation summary.
4. A warning if any imported slide text is baked into images.
5. A warning if presenter mode requires pop-ups to be allowed.

Do not provide fragments, pseudocode, separate CSS files, separate JS files, or instructions that require the user to assemble the deck manually.
