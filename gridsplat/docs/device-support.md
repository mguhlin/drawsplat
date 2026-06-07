# Browser and Device Support

GridSplat targets classroom browsers and school devices.

Official support:

- Chrome and Edge: latest two stable versions.
- Safari: latest two stable versions, with download/upload fallback for local files.
- Firefox: latest two stable versions, with download/upload fallback for local files.
- Mobile browsers on screens 360px wide or larger.
- Chromebooks used in grades 3-8 classrooms.

Test matrix:

- Desktop Chromium Playwright project.
- Mobile Chrome emulation using Pixel 7 dimensions.
- Manual low-end Chromebook check before final release.

Known caveats:

- File System Access API is limited outside Chromium; GridSplat keeps the `.gridsplat.json` download/upload fallback.
- Cloud saving depends on district policy and provider app registration.
- Excel import/export is deferred until a maintained, safe parser is selected.
