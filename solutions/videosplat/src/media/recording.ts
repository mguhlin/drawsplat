// Firefox waits for the declared audio codec even when the stream has no audio
// track. Match the codec list to the stream so silent recordings can finalize.
export function supportedRecordingType(includeAudio = true) {
  const audio = includeAudio ? ",opus" : "";
  return [
    `video/webm;codecs=vp9${audio}`,
    `video/webm;codecs=vp8${audio}`,
    "video/webm",
  ].find((type) => MediaRecorder.isTypeSupported(type));
}
