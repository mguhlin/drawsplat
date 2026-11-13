# Equation engine provenance

Equation Studio uses **MathJax 4.1.3** (`@mathjax/src`) and its **New Computer Modern SVG font data 4.1.3** (`@mathjax/mathjax-newcm-font`). The published npm packages declare Apache-2.0 licensing. The Apache license is included in `vendor/MathJax-LICENSE.txt` and `vendor/MathJax-font-LICENSE.txt`. MathJax is copyright the MathJax Consortium. GraphSplat does not claim ownership of this engine or font data.

The browser module is generated locally from the locked dependency tree, includes the base/AMS TeX packages and SVG font ranges, and has no remote loader, external font URLs, analytics, or document upload. The complete engine is loaded when Equation Studio is first opened; ordinary graph creation does not load it. GraphSplat's wrapper permits math notation and excludes document commands, links, styles, custom macro definitions and runtime package loading.

Rebuild from this directory with `npm ci --ignore-scripts` and `npm run build:equations`. `src/equation-engine.js` is the editable integration source; `scripts/build-equations.mjs` bundles it into `vendor/equation-engine.mjs`. Commit the bundle and lockfile with source changes. esbuild is a development dependency and is not needed to run the hosted or extracted application.

[MathJax source](https://github.com/mathjax/MathJax-src) · [MathJax direct-module documentation](https://docs.mathjax.org/en/latest/server/direct.html).
