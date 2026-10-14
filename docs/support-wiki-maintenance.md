# Maintaining the SplatWorks Wiki

The [SplatWorks Wiki](https://drawsplat.org/wiki/) is the public current documentation reference. Original guide and policy URLs remain valid and use the shared wiki navigation.

## Edit the source, then rebuild

- Edit HTML articles at their existing `guides/`, `legal/`, or `pages/` paths. District classroom, compliance overview, and licensing articles live in `wiki/`.
- Edit technical Markdown in `docs/`. `scripts/build-support-wiki.py` renders its registered articles into `wiki/`; do not edit those generated HTML files.
- Edit `docs/district-selfhost.md` for installation instructions, then run `scripts/build-district-guide.py`. The Quick Start form remains in `selfhost/district/quickstart.html`.
- The combined policy packet is generated from individual policy articles. Correct those articles rather than editing the packet.
- Update the title, description, and category registry in `scripts/build-support-wiki.py` when adding a public reference. Historical release notes and development roadmaps retain their context; they are not current setup instructions.

Install the build dependency with `python3 -m pip install markdown-it-py` in a development virtual environment. Run:

```bash
python3 scripts/build-district-guide.py
python3 scripts/build-support-wiki.py
npx playwright test tests/support-wiki.spec.js tests/district-quickstart.spec.js
```

The wiki generator writes shared static sidebar navigation, article outlines, generated technical pages, the policy packet, and `assets/js/support-index.js`. Search matches all entered words across titles, descriptions, and full article text, ranking title matches first. It runs in the browser without a search service, tracking, or API credentials. Articles and topic links remain readable without JavaScript. Markdown source is preserved for offline use and repository review.

## Article illustrations

Guide images preserve their complete aspect ratio on desktop and mobile. The
generator adds the decorative `assets/brand/splatworks-school-guides.png` hero to
wiki and guide articles that have no image, excluding licensing and privacy policy
sections. Do not add that generated image to Markdown; rebuilding inserts it once.
See [artwork provenance](splatworks-artwork.md) for its generation prompt.

## Verify and publish

Check local links, source-to-HTML consistency, mobile navigation, keyboard access, search, and print. Keep licensing notices and agreement execution status accurate. Separate shipped behavior from proposals and district procedures; never label documentation or an unsigned template as a compliance certification.

Commit generated files with their sources. Refresh downloadable packages after changing bundled setup instructions. Verify the public wiki, an old guide URL, a deep-linked search, download checksums, and the separately maintained mGuhlin.org article references after deployment.

## Shared site navigation

The five top-level items are Apps (including Whiteboard), SplatWorks, Blog, Guestbook, and Wiki. `scripts/site_navigation.py` defines the links; `scripts/build-site-navigation.py` applies them to public site headers. The Wiki builder runs this step automatically. Typing Games belongs in the Games directory. Educator resources belong in the Wiki’s For educators section. Do not add independent copies of the old Support, Technical, or For Educators top menus.
