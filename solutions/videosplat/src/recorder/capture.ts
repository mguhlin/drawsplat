export type CaptureMode = "screen" | "camera" | "screen-camera";

export interface CaptureOptions {
  mode: CaptureMode;
  microphone: boolean;
  microphoneDeviceId?: string;
  systemAudio: boolean;
  width?: number;
  height?: number;
  frameRate?: number;
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

export function supportedRecordingType() {
  return [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ].find((type) => MediaRecorder.isTypeSupported(type));
}

export function microphoneConstraints(deviceId?: string): MediaTrackConstraints {
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
}

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

const stopTracks = (stream?: MediaStream) =>
  stream?.getTracks().forEach((track) => track.stop());

export async function startCapture(
  options: CaptureOptions,
  previewCanvas: HTMLCanvasElement,
  onScreenEnded?: () => void,
): Promise<CaptureSession> {
  if (!navigator.mediaDevices || !("MediaRecorder" in window))
    throw new Error("This browser does not support local screen and camera recording.");
  const mimeType = supportedRecordingType();
  if (!mimeType) throw new Error("This browser cannot create a WebM recording.");

  const wantsScreen = options.mode !== "camera";
  const wantsCamera = options.mode !== "screen";
  let screen: MediaStream | undefined;
  let camera: MediaStream | undefined;
  let microphone: MediaStream | undefined;
  let audioContext: AudioContext | undefined;
  let frame = 0;
  let canceled = false;

  try {
    if (wantsScreen) {
      screen = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: options.frameRate ?? 30 } },
        audio: options.systemAudio,
      });
    }
    if (wantsCamera) {
      camera = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: options.frameRate ?? 30 },
        },
        audio: false,
      });
    }
    if (options.microphone) {
      microphone = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: microphoneConstraints(options.microphoneDeviceId),
      });
    }

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
      await video.play();
      return video;
    };
    const screenVideo = await makeVideo(screen);
    const cameraVideo = await makeVideo(camera);
    const draw = () => {
      context.fillStyle = "#050609";
      context.fillRect(0, 0, width, height);
      const primary = screenVideo ?? cameraVideo;
      if (primary) context.drawImage(primary, 0, 0, width, height);
      if (screenVideo && cameraVideo) {
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
        context.drawImage(
          cameraVideo,
          width - bubbleWidth - margin,
          height - bubbleHeight - margin,
          bubbleWidth,
          bubbleHeight,
        );
        context.restore();
      }
      frame = requestAnimationFrame(draw);
    };
    draw();

    const output = previewCanvas.captureStream(options.frameRate ?? 30);
    const audioStreams = [
      options.systemAudio ? screen : undefined,
      microphone,
    ].filter((item): item is MediaStream => Boolean(item?.getAudioTracks().length));
    if (audioStreams.length === 1) {
      audioStreams[0].getAudioTracks().forEach((track) => output.addTrack(track));
    } else if (audioStreams.length > 1) {
      audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      for (const stream of audioStreams)
        audioContext.createMediaStreamSource(stream).connect(destination);
      destination.stream.getAudioTracks().forEach((track) => output.addTrack(track));
      await audioContext.resume();
    }

    const chunks: Blob[] = [];
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
    const screenTrack = screen?.getVideoTracks()[0];
    const screenEnded = () => onScreenEnded?.();
    const cleanup = () => {
      screenTrack?.removeEventListener("ended", screenEnded);
      cancelAnimationFrame(frame);
      screenVideo?.pause();
      cameraVideo?.pause();
      stopTracks(screen);
      stopTracks(camera);
      stopTracks(microphone);
      stopTracks(output);
      void audioContext?.close();
    };
    if (screenTrack && onScreenEnded)
      screenTrack.addEventListener("ended", screenEnded, { once: true });
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
        const blob = await result;
        cleanup();
        if (canceled) throw new DOMException("Recording canceled", "AbortError");
        return blob;
      },
      cancel() {
        canceled = true;
        if (recorder.state !== "inactive") recorder.stop();
        cleanup();
      },
    };
  } catch (error) {
    cancelAnimationFrame(frame);
    stopTracks(screen);
    stopTracks(camera);
    stopTracks(microphone);
    void audioContext?.close();
    throw error;
  }
}
