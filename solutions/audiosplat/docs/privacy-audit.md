# AudioSplat privacy and safety audit

- AudioSplat has no account, backend, analytics, advertising, or tracker.
- Microphone access is requested only after the user chooses Record and accepts
  an explanatory dialog.
- Captured and imported audio stays in browser storage until the user downloads
  a project or WAV file.
- MediaStream tracks stop after recording, errors, and page unload.
- Project files are parsed as data; names are escaped before insertion in HTML.
- Object download URLs are revoked after use.
- Audio can be evicted by the browser. The downloadable project is the durable
  backup, and private/incognito browsing is not durable storage.

Release review still requires real-browser permission-revocation tests,
malformed/oversized project fixtures, and confirmation of the deployed Content
Security Policy.
