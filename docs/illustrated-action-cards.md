# Illustrated action-card menus

DrawSplat’s shared menu style combines an illustration, an action name, and a short explanation in a rounded violet card. Explanations should tell people what will happen, where work is saved, or what a choice affects.

- `assets/css/action-cards.css` styles shared cards, menus, setup panels, and dialogs.
- `assets/js/action-cards.js` supplies descriptions for existing menu controls. Add specific actions or labels here when introducing a new menu item. Keep the original control and handler.
- `assets/js/tool-launcher.js` displays each app’s description from `data/drawsplat-tools.json`.
- Whiteboard-specific cards and dialog explanations live in `assets/js/app.js` and `assets/css/app.css`.

Load the shared CSS and deferred script from each entry page, including Vite source entry pages. Keep game board cells, drawing controls, and formatting controls compact; put explanations in their menus or help panels. Menus close on an outside click or Escape and scroll within the viewport on phones.

Descriptions are exposed with `aria-description`; the visible CSS description has empty alternative text so it does not change the action’s accessible name. Icons are decorative. Respect reduced-motion preferences and provide a visible keyboard focus ring.

## Labelled action symbols

Splat toolbars and menus also use a compact symbol set from
`assets/icons/actions/`. The existing action-card script applies decorative CSS
masks to recognised actions such as Undo, Redo, Export, Copy, Save, Crop, and
Rotate. Visible labels, accessible names, disabled states, and click handlers
remain owned by each app. Existing SVG/image icons and canvas controls are
excluded from this enhancement. Formatting symbols retain their visible labels.

`assets/css/action-icons.css` supplies the compact styles and is imported by the
shared card stylesheet. Vite apps also include it in both their source and
published entry pages. The self-host bundle builders include the stylesheet and
symbols. Use `data-no-action-icon` to exclude a control when its own presentation
already communicates its action.

Validation: `npx playwright test --config=playwright.icons.config.js
 action-icons.spec.js action-cards.spec.js imagesplat-adjustments.spec.js`.
Set `TOOLS_URL=https://drawsplat.org` to check the hosted site.
