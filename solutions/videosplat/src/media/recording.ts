// Firefox waits for the declared audio codec even when the stream has no audio
// track. Match the codec list to the stream so silent recordings can finalize.
export function supportedRecordingType(includeAudio = true) {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  const audio = includeAudio ? ",opus" : "";
  return [
    `video/webm;codecs=vp9${audio}`,
    `video/webm;codecs=vp8${audio}`,
    "video/webm",
  ].find((type) => MediaRecorder.isTypeSupported(type));
}

/** Firefox can dispatch its final dataavailable just after stop. Allow that
 * queued data to drain before constructing the immutable output Blob. */
export function recordingResult(recorder: MediaRecorder, mimeType: string): Promise<Blob> {
  const result = new Promise<Blob>((resolve, reject) => {
    const chunks: Blob[] = [];
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      clearTimeout(timer);
      recorder.removeEventListener("dataavailable", data);
      recorder.removeEventListener("stop", stop);
      recorder.removeEventListener("error", error);
    };
    const finish = () => {
      cleanup();
      if (chunks.length) resolve(new Blob(chunks, {type:mimeType}));
      else reject(new Error("The recorder produced an empty file."));
    };
    const drain = () => { clearTimeout(timer); timer = setTimeout(finish, 100); };
    const data = (event: BlobEvent) => { if (event.data.size) chunks.push(event.data); if (stopped) drain(); };
    const stop = () => { stopped = true; drain(); };
    const error = () => { cleanup(); reject(new Error("The browser recorder failed.")); };
    recorder.addEventListener("dataavailable", data);
    recorder.addEventListener("stop", stop);
    recorder.addEventListener("error", error);
  });
  void result.catch(() => {});
  return result;
}
