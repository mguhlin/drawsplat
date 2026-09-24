# Short recording follow-up — September 24, 2026

Report: a twenty-minute recording became a very short, unplayable editor clip after **Use full recording**, in Chrome and Firefox. The original file was not available for inspection, so the native capture failure is not established as resolved.

A controlled regression reproduced one matching failure: finite but incorrect browser WebM duration was trusted without checking encoded timestamps. A forced 0.05-second browser duration shortened the editor clip. WebM imports now inspect encoded timestamps even when browser metadata is finite. This supplements the earlier missing/Infinity metadata fix.

Recording review now compares encoded video duration with active recording time (excluding pauses). Substantially short or unverifiable recordings display a warning. The original WebM remains downloadable from review, including after an import/storage failure. This check detects timestamp truncation; it cannot prove that every frame or audio sample is correct or restore bytes never captured.

Also fixed an independent long-file limitation: video imports no longer reject files over 512 MB. SHA-256 hashing uses bounded chunks above 8 MB and retains compatibility with saved project hashes. Audio/image import and caption limits are unchanged. Full-frame crop uses the original file without another real-time encoding pass.

Validation includes unit tests for bounded hashing, short-recording warnings, and full-frame preservation; Chrome/Firefox checks for finite incorrect duration, recording-to-editor audio, failure recovery and original-file download; and import/reopen of a playable twenty-minute MP4 padded with a valid free box to 513 MB. That fixture checks file size, duration, and storage, not twenty minutes of live screen capture or physical devices.

Checks: 105 unit tests passed; 78 Chrome/Firefox integration checks passed, including the 513 MB import/reopen cases. A final two-browser regression verifies that **File → Download original media** retrieves byte-identical source media from an existing project. Production verification follows publication.
