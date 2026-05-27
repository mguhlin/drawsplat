## Project Mapping: Castles & Catapults

| Letter | Step | What you do for this game |
| --- | --- | --- |
| **V** | **Vision** | Build a standalone, single-page retro artillery siege game. Two grey medieval castles face each other across randomized no-man's-land terrain. Players tune angle, power, and missile type, then trade arcing shots that damage castle HP, scatter armies, crater terrain, and trigger humorous battlefield commentary. |
| **I** | **Instruct** | Specify an HTML/CSS/JavaScript-only implementation with an 800 x 400 pixel-art canvas, responsive controls, rotating splash art, local setup fields, CPU-or-human opponent choice, turn phases, projectile physics, destructible castle segments, soldier units, randomized scenery, procedural sound, and no external dependencies. |
| **B** | **Build** | Implement in layers: 1. splash/setup UI; 2. canvas renderer; 3. terrain and random sky/no-man's-land generation; 4. hollow grey castles with pennants and shields; 5. armies and moats; 6. projectile selection and physics; 7. collisions and HP; 8. CPU turns; 9. quips, insults, retorts, soldier laments, and audio polish. |
| **E** | **Evaluate** | Playtest for readable UI, clear castle silhouettes, fair CPU accuracy, projectile variety, legible soldier formations, useful HP readouts, and satisfying audio. Check desktop and mobile layouts, especially text wrapping, control density, and canvas visibility. |
| **S** | **Ship** | Deliver as `index.html` plus an `assets/` folder. Splash images can be added as `assets/splash.jpg`, `assets/splash-2.jpg`, and `assets/splash-3.jpg`; the game chooses one randomly each reload and falls back gracefully if only one exists. |

## Current Design Priorities

* **Readable siege fantasy:** Castles should feel like grey stone fortifications, not colored blocks. Player colors belong on flags, pennants, shields, and army heraldry.
* **Clean playfield:** Weapon choice is visible in the controls and projectile art, but siege engines are not physically drawn on the castles to avoid clutter.
* **Characterful battlefield:** Random time-of-day skies, constellations, trees, lakes, stakes, moats, armies, quips, insults, retorts, and soldier laments give each match personality.
* **Fair artillery:** CPU should not win immediately. Its first shot is intentionally rough, and later shots remain imperfect.
* **Standalone simplicity:** Everything should run from static files in a browser with no build step, framework, package install, or server requirement beyond ordinary local file/HTTP serving.
