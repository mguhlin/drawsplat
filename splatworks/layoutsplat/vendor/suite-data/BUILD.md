# Native suite merge calculation bundle

`suite-data.mjs` uses the actual GridSplat and ListSplat calculation engines.
LayoutSplat and these local suite sources are GPL-3.0-only. The unmodified
HyperFormula 3.3.0 source archive and GPL license accompany this bundle.

Pinned dependencies (locked in GridSplat package-lock.json): HyperFormula 3.3.0
(GPL-3.0-only), Chevrotain 6.5.0 (Apache-2.0), regexp-to-ast 0.4.0 (MIT),
and tiny-emitter 2.1.0 (MIT). Individual licenses are in this directory.
HyperFormula upstream: https://github.com/handsontable/hyperformula/tree/3.3.0
Other dependencies' matching source distributions are downloadable from
https://registry.npmjs.org/chevrotain/-/chevrotain-6.5.0.tgz,
https://registry.npmjs.org/regexp-to-ast/-/regexp-to-ast-0.4.0.tgz, and
https://registry.npmjs.org/tiny-emitter/-/tiny-emitter-2.1.0.tgz.

Rebuild from the repository root (Node 20 or later):

```
npm ci --prefix splatworks/gridsplat
npm ci --prefix splatworks/writesplat
node scripts/build-layoutsplat-suite-data.mjs
```

The build uses WriteSplat's locked Rolldown, resolves GridSplat's formula
engine and number formatter, and ListSplat's formula/relationship sources.
The compact standalone archive includes these suite sources, lockfiles,
this build script, and the matching HyperFormula source archive. Browser
execution requires no npm, desktop office suite, or conversion service.
