# DrawSplatTM v3.1.10 Release Notes

DrawSplatTM v3.1.10 refreshes the self-host bundle with Super Star Trek, the latest Squirrel Run game polish, and the current classroom tools set.

## Highlights

- **Super Star Trek browser edition.** Added `games/super-star-trek/`, a static browser version of the classic command-driven quadrant strategy game with command buttons, live sector display, status panel, options, instructions, and local assets.
- **Squirrel Run sound feedback.** Added low-volume movement sounds, a splat sound when the squirrel loses a life, and a sound toggle in the game header.
- **Squirrel Run collision remarks.** When the squirrel gets run over, caught, or otherwise stopped, a speech bubble appears from the squirrel's point of view with a short classroom-friendly joke.
- **Squirrel Run tree celebration.** Reaching the tree now triggers a short congratulatory dance before the next level starts.
- **Mobile smoke test.** Verified a phone-sized Playwright run covering page load, start, touch movement, sound toggle, pause/resume, and browser error checks.
- **Raindrop/blog refresh.** Checked the Raindrop feed, added the new Squirrel Run and SketchSpace VR posts, kept the newer SplatImage Studio article, and added a local Super Star Trek release item.
- **Self-host refresh.** Updated the README, blog RSS snapshot, HTML release notes, Download for Self-Hosting page, admin game access list, and self-host ZIP for the current build.

## Self-Host Bundle

The self-host ZIP is labeled `drawsplat-selfhost-v3.1.10.zip`. It includes the static site, Apps Script backend, MySQL backend, documentation, legal/compliance pages, standalone classroom tools, DrawSplat Games including Super Star Trek and Squirrel Run, SplatImage Studio, SketchSpace VR, and the generic DrawSplat Hub dashboard with the `hubcampus` demo instance.

Real Hub campus folders are intentionally excluded from self-host bundles.
