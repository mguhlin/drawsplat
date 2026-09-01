import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  captureErrorMessage,
  isScreenSelectionCanceled,
  startCapture,
  type CaptureMode,
  type CaptureSession,
  type DisplaySurfacePreference,
} from "../recorder/capture";
import { cropRecording, type CropRect } from "../recorder/crop";

interface RecorderDialogProps {
  initialMicrophoneDeviceId?: string;
  permissionsPrepared?: boolean;
  onClose(): void;
  onAdd(file: File): Promise<void>;
  onStatus(message: string): void;
}

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export function RecorderDialog({ initialMicrophoneDeviceId = "", permissionsPrepared = false, onClose, onAdd, onStatus }: RecorderDialogProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const session = useRef<CaptureSession | undefined>(undefined);
  const [mode, setMode] = useState<CaptureMode>("screen");
  const [displaySurface, setDisplaySurface] = useState<DisplaySurfacePreference>("browser");
  const [microphone, setMicrophone] = useState(true);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [microphoneDeviceId, setMicrophoneDeviceId] = useState(initialMicrophoneDeviceId);
  const [systemAudio, setSystemAudio] = useState(true);
  const [backgroundFile, setBackgroundFile] = useState<File>();
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [counting, setCounting] = useState<number>();
  const [elapsed, setElapsed] = useState(0);
  const [state, setState] = useState<"setup" | "recording" | "paused" | "saving" | "review" | "cropping">("setup");
  const [error, setError] = useState<string>();
  const [recording, setRecording] = useState<File>();
  const [recordingUrl, setRecordingUrl] = useState("");
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 1, height: 1 });
  const [cropProgress, setCropProgress] = useState(0);

  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - session.current!.startedAt) / 1000)),
      250,
    );
    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => () => {
    session.current?.cancel();
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  }, [recordingUrl]);

  useEffect(() => () => {
    if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
  }, [backgroundUrl]);

  useEffect(() => {
    const refresh = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === "audioinput",
      );
      setMicrophones(devices);
      setMicrophoneDeviceId((current) =>
        current && devices.some((device) => device.deviceId === current)
          ? current
          : devices[0]?.deviceId ?? "",
      );
    };
    void refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
  }, []);

  const stop = async () => {
    if (!session.current || state === "saving") return;
    setState("saving");
    try {
      const blob = await session.current.stop();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const file = new File([blob], `VideoSplat-recording-${stamp}.webm`, { type: blob.type });
      const url = URL.createObjectURL(file);
      setRecording(file);
      setRecordingUrl(url);
      setCrop({ x: 0, y: 0, width: 1, height: 1 });
      session.current = undefined;
      setState("review");
      onStatus("Recording finished — select the portion to keep");
    } catch (reason) {
      setError(captureErrorMessage(reason));
      setState("setup");
    }
  };

  const begin = async () => {
    setError(undefined);
    try {
      const backgroundImage = mode !== "screen" && backgroundFile
        ? await createImageBitmap(backgroundFile)
        : undefined;
      session.current = await startCapture(
        {
          mode,
          microphone,
          microphoneDeviceId: microphoneDeviceId || undefined,
          systemAudio: mode !== "camera" && displaySurface === "browser" && systemAudio,
          countdownSeconds: countdown,
          displaySurface,
          backgroundImage,
        },
        canvas.current!,
        () => void stop(),
        setCounting,
      );
      setElapsed(0);
      setState("recording");
      onStatus("Recording locally — no media is being uploaded");
    } catch (reason) {
      if (isScreenSelectionCanceled(reason)) {
        setError(undefined);
        onStatus("Screen selection canceled; no recording was started");
        setState("setup");
        return;
      }
      setError(captureErrorMessage(reason));
      setState("setup");
    }
  };

  const close = () => {
    session.current?.cancel();
    session.current = undefined;
    onStatus("Recording canceled; no recording was saved");
    onClose();
  };

  const addRecording = async (file: File, message: string) => {
    await onAdd(file);
    onStatus(message);
    onClose();
  };

  const applyCrop = async () => {
    if (!recording) return;
    setState("cropping");
    setCropProgress(0);
    setError(undefined);
    try {
      const blob = await cropRecording(recording, crop, setCropProgress);
      const cropped = new File(
        [blob],
        recording.name.replace(/\.webm$/i, "-cropped.webm"),
        { type: blob.type },
      );
      await addRecording(cropped, "Cropped recording saved locally and added to the timeline");
    } catch (reason) {
      setError(captureErrorMessage(reason));
      setState("review");
    }
  };

  const beginCropSelection = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = (clientX: number, clientY: number) => ({
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    });
    const start = point(event.clientX, event.clientY);
    setCrop({ ...start, width: .02, height: .02 });
    const move = (moveEvent: PointerEvent) => {
      const end = point(moveEvent.clientX, moveEvent.clientY);
      setCrop({
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.max(.02, Math.abs(end.x - start.x)),
        height: Math.max(.02, Math.abs(end.y - start.y)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  return <>
    <button className="dialog-close" onClick={close} aria-label="Close recorder">×</button>
    <h2 id="recorder-title">Record locally</h2>
    <p className="lead">Capture your screen, camera, and audio directly into this project. Permission is requested only when you start; the recording is not uploaded.</p>
    {state !== "review" && state !== "cropping" && <div className="recorder-preview">
      <canvas ref={canvas} aria-label="Recording preview" />
      {state === "setup" && !counting && <span>Preview appears after permission is granted</span>}
      {counting && <strong className="recorder-countdown" aria-live="assertive">{counting}</strong>}
      {state !== "setup" && <output>{state === "paused" ? "Paused · " : "● "}{clock(elapsed)}</output>}
    </div>}
    {(state === "review" || state === "cropping") && recording && <div className="crop-review">
      <p>Drag over the preview to select the part of the recorded tab you want to keep.</p>
      <div className="crop-stage" onPointerDown={state === "review" ? beginCropSelection : undefined}>
        <video src={recordingUrl} playsInline muted aria-label="Recorded screen crop preview" />
        <i className="crop-selection" style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` }} />
      </div>
      <div className="crop-presets" aria-label="Crop presets">
        <button onClick={() => setCrop({ x: 0, y: 0, width: 1, height: 1 })}>Full frame</button>
        <button onClick={() => setCrop({ x: .125, y: 0, width: .75, height: 1 })}>Center</button>
        <button onClick={() => setCrop({ x: 0, y: 0, width: .5, height: 1 })}>Left half</button>
        <button onClick={() => setCrop({ x: .5, y: 0, width: .5, height: 1 })}>Right half</button>
      </div>
      {state === "review" && <div className="recorder-actions">
        <button className="primary" onClick={applyCrop}>Crop and add to timeline</button>
        <button onClick={() => addRecording(recording, "Full recording saved locally and added to the timeline")}>Use full recording</button>
        <button className="danger" onClick={close}>Discard</button>
      </div>}
      {state === "cropping" && <><progress max="1" value={cropProgress} /><p role="status">Cropping locally… {Math.round(cropProgress * 100)}%</p></>}
    </div>}
    {error && <p className="recorder-error" role="alert">{error}</p>}
    {state === "setup" && <div className={`recorder-permission-state ${permissionsPrepared ? "ready" : "pending"}`} role="status">
      <strong>{permissionsPrepared ? "✓ Camera and microphone ready for this session" : "Camera and microphone setup was skipped"}</strong>
      <span>{permissionsPrepared ? "Your selected microphone is remembered. The browser will only ask you to choose which screen or tab to share." : "The browser may request camera or microphone access when recording starts."}</span>
    </div>}
    {state === "setup" && <div className="recorder-settings">
      <label>Record<select aria-label="Recording source" value={mode} onChange={(event) => setMode(event.target.value as CaptureMode)}><option value="screen">Screen only · best for switching tabs</option><option value="screen-camera">Screen + camera overlay</option><option value="camera">Camera only</option></select></label>
      <label className="check"><input type="checkbox" checked={microphone} onChange={(event) => setMicrophone(event.target.checked)} /> Microphone</label>
      {mode !== "camera" && <fieldset className="surface-choices">
        <legend>What do you want to share?</legend>
        {([
          ["browser", "▣", "Browser tab", "Best for a website or video"],
          ["window", "▤", "Application window", "One open application"],
          ["monitor", "▧", "Entire screen", "Everything on one display"],
        ] as const).map(([value, icon, title, detail]) => <button
          type="button"
          key={value}
          className={displaySurface === value ? "selected" : ""}
          aria-pressed={displaySurface === value}
          onClick={() => setDisplaySurface(value)}
        ><b aria-hidden="true">{icon}</b><strong>{title}</strong><small>{detail}</small></button>)}
        <p>The browser's secure chooser opens next and makes the final selection.</p>
      </fieldset>}
      {microphone && <label>Microphone source<select aria-label="Microphone source" value={microphoneDeviceId} onChange={(event) => setMicrophoneDeviceId(event.target.value)}>{microphones.length ? microphones.map((device, index) => <option value={device.deviceId} key={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>) : <option value="">System default microphone</option>}</select></label>}
      {mode !== "screen" && <div className="camera-background-setting">
        <label>Virtual background<input
          aria-label="Virtual background image"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
            setBackgroundFile(file);
            setBackgroundUrl(file ? URL.createObjectURL(file) : "");
          }}
        /></label>
        {backgroundUrl && <div className="camera-background-preview">
          <img src={backgroundUrl} alt="Selected virtual background" />
          <button type="button" onClick={() => {
            URL.revokeObjectURL(backgroundUrl);
            setBackgroundFile(undefined);
            setBackgroundUrl("");
          }}>Remove</button>
        </div>}
        <small>Your image and person-segmentation processing stay on this device.</small>
      </div>}
      <label className="check"><input
        type="checkbox"
        disabled={mode === "camera" || displaySurface !== "browser"}
        checked={mode !== "camera" && displaySurface === "browser" && systemAudio}
        onChange={(event) => setSystemAudio(event.target.checked)}
      /> Shared browser-tab audio when available</label>
      {mode !== "camera" && displaySurface !== "browser" && <small className="audio-capture-note">Chrome on this system only offers shared audio when you select a browser tab.</small>}
      <label>Countdown<select aria-label="Recording countdown" value={countdown} onChange={(event) => setCountdown(Number(event.target.value))}><option value="0">None</option><option value="3">3 seconds</option><option value="5">5 seconds</option></select></label>
      <button className="primary wide" disabled={counting !== undefined} onClick={begin}>{counting ? "Get ready…" : "Start recording"}</button>
    </div>}
    {(state === "recording" || state === "paused") && <div className="recorder-actions">
      <button onClick={() => { if (state === "recording") { session.current?.pause(); setState("paused"); } else { session.current?.resume(); setState("recording"); } }}>{state === "recording" ? "Pause" : "Resume"}</button>
      <button className="primary" onClick={stop}>Stop and choose crop</button>
      <button className="danger" onClick={close}>Cancel</button>
    </div>}
    {state === "saving" && <p role="status">Finishing the recording locally…</p>}
    <p className="hint">Choose your headset under Microphone source. Browsers require the screen/tab chooser for every new screen capture; VideoSplat cannot bypass it. For recording another tab, use Screen only and select that tab in the chooser. Keep VideoSplat visible when using the camera-overlay compositor.</p>
  </>;
}
