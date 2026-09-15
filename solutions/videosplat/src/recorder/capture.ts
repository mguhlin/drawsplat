import { createChromaRenderer, type ChromaSettings } from "../render/chroma";
import { FilesetResolver, ImageSegmenter, type ImageSegmenterResult } from "@mediapipe/tasks-vision";
import { supportedRecordingType } from "../media/recording";
export { supportedRecordingType } from "../media/recording";

export type CaptureMode = "screen" | "camera" | "screen-camera";
export type DisplaySurfacePreference = "browser" | "window" | "monitor";

export interface CaptureOptions {
  signal?: AbortSignal;
  mode: CaptureMode;
  microphone: boolean;
  microphoneDeviceId?: string;
  systemAudio: boolean;
  width?: number;
  height?: number;
  frameRate?: number;
  countdownSeconds?: number;
  displaySurface?: DisplaySurfacePreference;
  backgroundImage?: ImageBitmap;
  chroma?: ChromaSettings;
}

export interface CaptureSession {
  previewStream: MediaStream;
  pause(): void;
  resume(): void;
  stop(): Promise<Blob>;
  cancel(): void;
  readonly state: RecordingState;
  readonly startedAt: number;
}

type RecordingState = "recording" | "paused" | "stopped";

export function microphoneConstraints(deviceId?: string): MediaTrackConstraints {
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
}

export function displayCaptureOptions(
  surface: DisplaySurfacePreference = "browser",
  systemAudio = true,
  frameRate = 30,
): DisplayMediaStreamOptions {
  const prefersCurrentTab = surface === "browser";
  const options: DisplayMediaStreamOptions = {
    video: {
      frameRate: { ideal: frameRate },
      displaySurface: surface,
    },
    audio: systemAudio,
  };
  if (prefersCurrentTab)
    Object.assign(options, {
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      surfaceSwitching: "include",
    });
  return options;
}

export const needsCanvasComposition = (mode: CaptureMode, hasBackground = false) =>
  mode === "screen-camera" || (mode === "camera" && hasBackground);

let segmenterPromise: Promise<ImageSegmenter> | undefined;

const getSegmenter = () => segmenterPromise ??= (async () => {
  const vision = await FilesetResolver.forVisionTasks("./mediapipe/wasm");
  return ImageSegmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "./mediapipe/models/selfie_segmenter.tflite" },
    runningMode: "VIDEO",
    outputConfidenceMasks: true,
    outputCategoryMask: false,
  });
})();

const drawCover = (
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const sourceWidth = image instanceof ImageBitmap ? image.width : 1;
  const sourceHeight = image instanceof ImageBitmap ? image.height : 1;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawnWidth = sourceWidth * scale;
  const drawnHeight = sourceHeight * scale;
  context.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight);
};

const createBackgroundCompositor = async (background: ImageBitmap) => {
  const segmenter = await getSegmenter();
  const foreground = document.createElement("canvas");
  const maskCanvas = document.createElement("canvas");
  const foregroundContext = foreground.getContext("2d")!;
  const maskContext = maskCanvas.getContext("2d")!;
  let lastMask: ImageData | undefined;
  let lastSegmentedAt = 0;

  return (context: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, width: number, height: number) => {
    foreground.width = width;
    foreground.height = height;
    foregroundContext.globalCompositeOperation = "source-over";
    foregroundContext.drawImage(video, 0, 0, width, height);

    const now = performance.now();
    if (now - lastSegmentedAt >= 66 || !lastMask) {
      const result: ImageSegmenterResult = segmenter.segmentForVideo(video, now);
      const mask = result.confidenceMasks?.[0];
      if (mask) {
        const values = mask.getAsFloat32Array();
        const pixels = new Uint8ClampedArray(values.length * 4);
        for (let index = 0; index < values.length; index++) {
          const alpha = Math.max(0, Math.min(255, Math.round((values[index] - .15) / .7 * 255)));
          pixels[index * 4] = pixels[index * 4 + 1] = pixels[index * 4 + 2] = 255;
          pixels[index * 4 + 3] = alpha;
        }
        lastMask = new ImageData(pixels, mask.width, mask.height);
        lastSegmentedAt = now;
      }
      result.close();
    }

    if (lastMask) {
      maskCanvas.width = lastMask.width;
      maskCanvas.height = lastMask.height;
      maskContext.putImageData(lastMask, 0, 0);
      foregroundContext.globalCompositeOperation = "destination-in";
      foregroundContext.drawImage(maskCanvas, 0, 0, width, height);
    }
    context.save();
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();
    drawCover(context, background, x, y, width, height);
    context.drawImage(foreground, x, y, width, height);
    context.restore();
  };
};

export function captureErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError")
      return "Recording permission was not granted. VideoSplat only asks after you press Start recording.";
    if (error.name === "NotFoundError")
      return "The requested camera or microphone was not found.";
    if (error.name === "NotReadableError")
      return "The camera, microphone, or screen could not be opened. Another application may be using it.";
    if (error.name === "AbortError") return "Screen selection was canceled.";
  }
  return error instanceof Error ? error.message : "Recording could not start.";
}

export const isScreenSelectionCanceled = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

const stopTracks = (stream?: MediaStream) =>
  stream?.getTracks().forEach((track) => track.stop());

export async function startCapture(
  options: CaptureOptions,
  previewCanvas: HTMLCanvasElement,
  onScreenEnded?: () => void,
  onCountdown?: (remaining?: number) => void,
  onProgress?: (message: string) => void,
): Promise<CaptureSession> {
  if (!navigator.mediaDevices || !("MediaRecorder" in window))
    throw new Error("This browser does not support local screen and camera recording.");
  if (!supportedRecordingType()) throw new Error("This browser cannot create a WebM recording.");

  const wantsScreen = options.mode !== "camera";
  const wantsCamera = options.mode !== "screen";
  let screen: MediaStream | undefined;
  let camera: MediaStream | undefined;
  let output: MediaStream | undefined;
  let microphone: MediaStream | undefined;
  let audioContext: AudioContext | undefined;
  let frameTimer = 0;
  let canceled = false;
  const videos: HTMLVideoElement[] = [];
  let stage = "Screen sharing";
  const progress = (message: string) => { stage = message; onProgress?.(message); };
  const ensureActive = () => {
    if (options.signal?.aborted) throw new Error("Recording startup canceled.");
  };
  const clearVideos = () => videos.forEach(video => {
    video.pause(); video.srcObject = null; video.remove();
  });

  try {
    ensureActive();
    if (wantsScreen) {
      progress("Choose a source in the browser sharing dialog…");
      const displayOptions = displayCaptureOptions(
        options.displaySurface,
        options.systemAudio,
        options.frameRate,
      );
      screen = await navigator.mediaDevices.getDisplayMedia(displayOptions);
      ensureActive();
    }
    if (wantsCamera) {
      progress("Opening camera…");
      camera = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: options.frameRate ?? 30 },
        },
        audio: false,
      });
    }
    ensureActive();
    if (options.microphone) {
      progress("Opening microphone — check for a browser permission prompt…");
      microphone = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: microphoneConstraints(options.microphoneDeviceId),
      });
    }

    ensureActive();
    progress("Preparing recording…");
    if (options.microphone && !microphone?.getAudioTracks().some(track => track.readyState === "live"))
      throw new Error("The selected microphone did not provide an audio track. Choose a working microphone or turn Microphone off for a silent recording.");
    const primaryTrack = (screen ?? camera)!.getVideoTracks()[0];
    if (!primaryTrack) throw new Error("No video source was selected.");
    const settings = primaryTrack.getSettings();
    const width = options.width ?? settings.width ?? 1280;
    const height = options.height ?? settings.height ?? 720;
    previewCanvas.width = width;
    previewCanvas.height = height;
    const context = previewCanvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("VideoSplat could not create the recording canvas.");

    const makeVideo = async (stream?: MediaStream) => {
      if (!stream) return undefined;
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      videos.push(video);
      video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none";
      video.setAttribute("aria-hidden", "true");
      document.body.append(video);
      const playback = video.play();
      if (needsCanvasComposition(options.mode, Boolean(options.backgroundImage || options.chroma?.enabled))) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([playback, new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("Preview did not start. Return to VideoSplat and try again.")), 15000);
          })]);
        } finally { clearTimeout(timer); }
        ensureActive();
      } else {
        // Recording uses the live source track, so a delayed preview must not
        // block startup when Chrome focuses the tab selected for sharing.
        void playback.catch(() => {});
      }
      return video;
    };
    const screenVideo = await makeVideo(screen);
    const cameraVideo = await makeVideo(camera);
    const renderChroma = createChromaRenderer();
    const backgroundCompositor = options.chroma?.enabled
      ? (target: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, w: number, h: number) => {
          target.save(); target.beginPath(); target.rect(x, y, w, h); target.clip();
          if (options.backgroundImage) drawCover(target, options.backgroundImage, x, y, w, h);
          target.drawImage(renderChroma(video, w, h, options.chroma!), x, y, w, h); target.restore();
        }
      : options.backgroundImage ? await createBackgroundCompositor(options.backgroundImage) : undefined;
    const draw = () => {
      context.fillStyle = "#050609";
      context.fillRect(0, 0, width, height);
      const primary = screenVideo ?? cameraVideo;
      if (primary && primary.readyState >= 2) {
        if (!screenVideo && cameraVideo && backgroundCompositor)
          backgroundCompositor(context, cameraVideo, 0, 0, width, height);
        else context.drawImage(primary, 0, 0, width, height);
      }
      if (screenVideo && cameraVideo && cameraVideo.readyState >= 2) {
        const bubbleWidth = Math.round(width * 0.22);
        const bubbleHeight = Math.round((bubbleWidth * 9) / 16);
        const margin = Math.round(width * 0.025);
        context.save();
        context.beginPath();
        context.roundRect(
          width - bubbleWidth - margin,
          height - bubbleHeight - margin,
          bubbleWidth,
          bubbleHeight,
          Math.max(8, Math.round(width * 0.012)),
        );
        context.clip();
        if (backgroundCompositor)
          backgroundCompositor(context, cameraVideo, width - bubbleWidth - margin, height - bubbleHeight - margin, bubbleWidth, bubbleHeight);
        else context.drawImage(cameraVideo, width - bubbleWidth - margin, height - bubbleHeight - margin, bubbleWidth, bubbleHeight);
        context.restore();
      }
    };
    draw();
    frameTimer = window.setInterval(draw, 1000 / (options.frameRate ?? 30));

    // Preserve the browser-owned source track whenever no camera overlay is
    // required. Unlike canvas animation, display/camera tracks continue while
    // the VideoSplat tab is hidden and the user works in the tab being recorded.
    output = needsCanvasComposition(options.mode, Boolean(options.backgroundImage || options.chroma?.enabled))
      ? previewCanvas.captureStream(options.frameRate ?? 30)
      : new MediaStream([primaryTrack]);
    const audioStreams = [
      options.systemAudio ? screen : undefined,
      microphone,
    ].filter((item): item is MediaStream => Boolean(item?.getAudioTracks().length));
    if (audioStreams.length === 1) {
      for (const track of audioStreams[0].getAudioTracks()) output.addTrack(track);
    } else if (audioStreams.length > 1) {
      audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      for (const stream of audioStreams)
        audioContext.createMediaStreamSource(stream).connect(destination);
      for (const track of destination.stream.getAudioTracks()) output.addTrack(track);
      await audioContext.resume();
    }

    const chunks: Blob[] = [];
    const mimeType = supportedRecordingType(output.getAudioTracks().length > 0);
    if (!mimeType) throw new Error("This browser cannot encode the selected recording tracks.");
    const recorder = new MediaRecorder(output, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
      audioBitsPerSecond: 128_000,
    });
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    const result = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error("The browser recorder failed."));
      recorder.onstop = () =>
        chunks.length
          ? resolve(new Blob(chunks, { type: mimeType }))
          : reject(new Error("The recorder produced an empty file."));
    });
    // A recorder error can arrive long before the user asks for the result.
    // Keep the rejection handled now; stop() still reports the original error.
    void result.catch(() => {});
    const screenEnded = () => onScreenEnded?.();
    const cleanup = () => {
      primaryTrack.removeEventListener("ended", screenEnded);
      clearInterval(frameTimer);
      clearVideos();
      stopTracks(screen);
      stopTracks(camera);
      stopTracks(microphone);
      stopTracks(output);
      void audioContext?.close();
      options.backgroundImage?.close();
    };
    if (onScreenEnded)
      primaryTrack.addEventListener("ended", screenEnded, { once: true });
    ensureActive();
    for (let value = options.countdownSeconds ?? 0; value > 0; value--) {
      ensureActive();
      progress("Starting recording after countdown…");
      onCountdown?.(value);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    ensureActive();
    if (primaryTrack.readyState !== "live") throw new Error("Sharing ended before recording started. Select the source again and keep sharing enabled.");
    onCountdown?.(undefined);
    recorder.start(1000);
    const startedAt = Date.now();

    return {
      previewStream: output,
      startedAt,
      get state() {
        return recorder.state === "inactive" ? "stopped" : recorder.state;
      },
      pause() {
        if (recorder.state === "recording") recorder.pause();
      },
      resume() {
        if (recorder.state === "paused") recorder.resume();
      },
      async stop() {
        if (recorder.state !== "inactive") recorder.stop();
        try {
          const blob = await result;
          if (canceled) throw new DOMException("Recording canceled", "AbortError");
          return blob;
        } finally {
          cleanup();
        }
      },
      cancel() {
        canceled = true;
        if (recorder.state !== "inactive") recorder.stop();
        cleanup();
      },
    };
  } catch (error) {
    clearVideos();
    clearInterval(frameTimer);
    stopTracks(screen);
    stopTracks(camera);
    stopTracks(microphone);
    stopTracks(output);
    void audioContext?.close();
    options.backgroundImage?.close();
    const detail = error instanceof DOMException && error.name === "AbortError"
      ? `The browser interrupted this step${error.message ? ` (${error.message})` : ""}. Try recording again.`
      : captureErrorMessage(error);
    throw new Error(`${stage.replace(/…$/, "")}: ${detail}`);
  }
}
