import { supportedRecordingType } from "./capture";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropPixels(
  rect: CropRect,
  sourceWidth: number,
  sourceHeight: number,
) {
  const x = Math.round(Math.max(0, Math.min(1, rect.x)) * sourceWidth);
  const y = Math.round(Math.max(0, Math.min(1, rect.y)) * sourceHeight);
  const width = Math.max(
    2,
    Math.round(Math.max(0.02, Math.min(1 - rect.x, rect.width)) * sourceWidth),
  );
  const height = Math.max(
    2,
    Math.round(Math.max(0.02, Math.min(1 - rect.y, rect.height)) * sourceHeight),
  );
  return { x, y, width, height };
}

const loaded = (video: HTMLVideoElement) =>
  new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("The recording could not be opened for cropping."));
  });

export async function cropRecording(
  file: File,
  rect: CropRect,
  onProgress: (ratio: number) => void,
): Promise<Blob> {
  const mimeType = supportedRecordingType();
  if (!mimeType || !("captureStream" in HTMLCanvasElement.prototype))
    throw new Error("This browser cannot crop the recording locally.");
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.preload = "auto";
  video.playsInline = true;
  await loaded(video);
  const source = cropPixels(rect, video.videoWidth, video.videoHeight);
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas rendering is unavailable.");
  const output = canvas.captureStream(30);
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  audioContext.createMediaElementSource(video).connect(destination);
  destination.stream.getAudioTracks().forEach((track) => output.addTrack(track));
  await audioContext.resume();
  const recorder = new MediaRecorder(output, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
    audioBitsPerSecond: 128_000,
  });
  const chunks: Blob[] = [];
  const result = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    recorder.onerror = () => reject(new Error("The local crop failed."));
    recorder.onstop = () => chunks.length
      ? resolve(new Blob(chunks, { type: mimeType }))
      : reject(new Error("The crop produced an empty recording."));
  });
  let frame = 0;
  try {
    recorder.start(1000);
    video.currentTime = 0;
    await video.play();
    await new Promise<void>((resolve) => {
      const draw = () => {
        context.drawImage(
          video,
          source.x,
          source.y,
          source.width,
          source.height,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        onProgress(video.duration ? Math.min(1, video.currentTime / video.duration) : 0);
        if (video.ended) {
          recorder.stop();
          resolve();
        } else frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    });
    const blob = await result;
    onProgress(1);
    return blob;
  } finally {
    cancelAnimationFrame(frame);
    video.pause();
    output.getTracks().forEach((track) => track.stop());
    await audioContext.close();
    URL.revokeObjectURL(url);
  }
}
