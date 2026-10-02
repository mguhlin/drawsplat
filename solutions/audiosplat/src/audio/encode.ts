export async function encodeWithMediaRecorder(
  buffer: AudioBuffer,
  mimeType: string,
): Promise<Blob> {
  const context = new AudioContext({ sampleRate: buffer.sampleRate });
  await context.resume();
  const source = context.createBufferSource();
  const destination = context.createMediaStreamDestination();
  source.buffer = buffer;
  source.connect(destination);
  const chunks: Blob[] = [];
  const mediaRecorder = new MediaRecorder(destination.stream, {
    mimeType,
    audioBitsPerSecond: 256000,
  });
  return new Promise((resolve, reject) => {
    let settled = false;
    let startedAt = context.currentTime;
    const cleanup = () => {
      context.removeEventListener("statechange", stateChanged);
      source.onended = null;
      source.disconnect();
      destination.stream.getTracks().forEach(track => track.stop());
      void context.close();
    };
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
      cleanup();
      reject(new Error(message));
    };
    const stateChanged = () => {
      if (context.state !== "running") fail("Audio export was interrupted by the browser. Keep this tab open and retry.");
    };
    context.addEventListener("statechange", stateChanged);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    mediaRecorder.onerror = () => {
      fail("Encoding failed");
    };
    mediaRecorder.onstop = () => {
      if (settled) return;
      if (context.currentTime - startedAt < buffer.duration - 0.1 ||
          context.currentTime - startedAt > buffer.duration + 0.5 || !chunks.some(chunk => chunk.size)) {
        fail("Audio export stopped early. Keep this tab open and retry.");
        return;
      }
      settled = true;
      cleanup();
      resolve(new Blob(chunks, { type: mimeType }));
    };
    source.onended = () => {
      if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
    };
    try {
      mediaRecorder.start(250);
      startedAt = context.currentTime;
      source.start();
    } catch { fail("Audio export could not start."); }
  });
}
