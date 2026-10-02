interface ExportProbe {
  streams?: { codec_type?: string; width?: number; height?: number; start_time?: string; duration?: string; nb_read_packets?: string }[];
}
/** Check actual encoded tracks before exposing a subtitle download. */
export function validateSubtitleExport(metadata: ExportProbe, expectedDuration: number) {
  const video = metadata.streams?.find(stream => stream.codec_type === "video");
  const duration = Number(video?.duration);
  const start = Number(video?.start_time);
  if (!video || !(Number(video.nb_read_packets) > 0) || !(video.width! > 0 && video.height! > 0) ||
      !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(start) || Math.abs(start) > .5 ||
      (expectedDuration > 0 && Math.abs(duration - expectedDuration) > Math.max(.5, expectedDuration * .001))) {
    throw new Error("Subtitle export has missing video or incorrect timing. Retry with the original source file.");
  }
  const audio = metadata.streams?.find(stream => stream.codec_type === "audio");
  if (audio && (!(Number(audio.nb_read_packets) > 0) || !Number.isFinite(Number(audio.duration)) ||
      Math.abs(Number(audio.duration) - duration) > .5 || Math.abs(Number(audio.start_time) - start) > .5)) {
    throw new Error("Subtitle export audio and video are out of sync. Retry with the original source file.");
  }
}
