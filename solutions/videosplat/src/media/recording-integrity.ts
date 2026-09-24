/** Check saved packet timestamps, never substitute the wall clock for content. */
export async function recordingWarning(blob: Blob, expectedSeconds: number): Promise<string | undefined> {
  if (expectedSeconds < 5) return;
  const { Input, ALL_FORMATS, BlobSource } = await import("mediabunny");
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(blob, { maxCacheSize: 8 * 1024 * 1024 }) });
  try {
    const track = await input.getPrimaryVideoTrack();
    const actual = track ? await track.computeDuration() : 0;
    if (!Number.isFinite(actual) || actual <= 0)
      return "The saved recording has no readable video duration. Download the original recording before closing this window.";
    if (actual < expectedSeconds - Math.max(3, expectedSeconds * .1))
      return `The saved video contains only ${Math.round(actual)} seconds, but recording ran for ${Math.round(expectedSeconds)} seconds. It may be incomplete. Download the original recording before closing this window.`;
  } catch {
    return "The saved recording could not be verified. Play it and download the original recording before closing this window.";
  } finally { input.dispose(); }
}
