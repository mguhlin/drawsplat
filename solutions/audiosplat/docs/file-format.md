# AudioSplat project format

AudioSplat V1 downloads `.audiosplat.json`. The top-level object contains a
validated version-1 `project` and a `sources` array. Each source includes its
audio as a local data URL so the file is portable and opens without a server.

Clips are non-destructive references to immutable sources using `sourceId`,
timeline `start`, `sourceOffset`, and `duration`. Track and clip gain values are
linear multipliers; pan ranges from -1 (left) to 1 (right).

The JSON format favors auditability and simple recovery. Large projects may be
memory-intensive because base64 expands binary audio. A future version may add
a ZIP-based `.audiosplat` container while retaining versioned `project.json`.
Importers must reject unknown app/version combinations, invalid clip bounds,
missing embedded audio, and malformed source lists before replacing workspace
state.
