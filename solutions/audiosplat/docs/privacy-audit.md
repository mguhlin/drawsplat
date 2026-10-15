# AudioSplat privacy and safety audit

- Local AudioSplat work needs no account or project-upload backend. Optional Google Drive saving is a separate, user-selected workflow.
- Google Identity Services loads only after the user selects Drive saving, not on app startup. Connection opt-out blocks starting that workflow. Drive uses drive.file and keeps its access token in memory; public-link sharing requires a separate user choice.
- Microphone access is requested only after the user chooses Record and accepts
  an explanatory dialog.
- Captured and imported audio stays in browser storage unless the user explicitly saves an exported mix to Drive or shares/downloads it.
- MediaStream tracks stop after recording, errors, and page unload.
- Project files are parsed as data; names are escaped before insertion in HTML.
- Object download URLs are revoked after use.
- Audio can be evicted by the browser. The downloadable project is the durable
  backup, and private/incognito browsing is not durable storage.

Release review still requires real-browser permission-revocation tests,
malformed/oversized project fixtures, and confirmation of the deployed Content
Security Policy.
