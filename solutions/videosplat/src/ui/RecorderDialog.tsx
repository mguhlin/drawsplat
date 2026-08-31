import { useEffect, useRef, useState } from "react";
import {
  captureErrorMessage,
  startCapture,
  type CaptureMode,
  type CaptureSession,
} from "../recorder/capture";

interface RecorderDialogProps {
  initialMicrophoneDeviceId?: string;
  onClose(): void;
  onAdd(file: File): Promise<void>;
  onStatus(message: string): void;
}

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export function RecorderDialog({ initialMicrophoneDeviceId = "", onClose, onAdd, onStatus }: RecorderDialogProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const session = useRef<CaptureSession | undefined>(undefined);
  const [mode, setMode] = useState<CaptureMode>("screen-camera");
  const [microphone, setMicrophone] = useState(true);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [microphoneDeviceId, setMicrophoneDeviceId] = useState(initialMicrophoneDeviceId);
  const [systemAudio, setSystemAudio] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [counting, setCounting] = useState<number>();
  const [elapsed, setElapsed] = useState(0);
  const [state, setState] = useState<"setup" | "recording" | "paused" | "saving">("setup");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (state !== "recording") return;
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - session.current!.startedAt) / 1000)),
      250,
    );
    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => () => session.current?.cancel(), []);

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
      await onAdd(new File([blob], `VideoSplat-recording-${stamp}.webm`, { type: blob.type }));
      onStatus("Recording saved locally and added to the timeline");
      session.current = undefined;
      onClose();
    } catch (reason) {
      setError(captureErrorMessage(reason));
      setState("setup");
    }
  };

  const begin = async () => {
    setError(undefined);
    if (countdown) {
      for (let value = countdown; value > 0; value--) {
        setCounting(value);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setCounting(undefined);
    }
    try {
      session.current = await startCapture(
        {
          mode,
          microphone,
          microphoneDeviceId: microphoneDeviceId || undefined,
          systemAudio: mode !== "camera" && systemAudio,
        },
        canvas.current!,
        () => void stop(),
      );
      setElapsed(0);
      setState("recording");
      onStatus("Recording locally — no media is being uploaded");
    } catch (reason) {
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

  return <>
    <button className="dialog-close" onClick={close} aria-label="Close recorder">×</button>
    <h2 id="recorder-title">Record locally</h2>
    <p className="lead">Capture your screen, camera, and audio directly into this project. Permission is requested only when you start; the recording is not uploaded.</p>
    <div className="recorder-preview">
      <canvas ref={canvas} aria-label="Recording preview" />
      {state === "setup" && !counting && <span>Preview appears after permission is granted</span>}
      {counting && <strong className="recorder-countdown" aria-live="assertive">{counting}</strong>}
      {state !== "setup" && <output>{state === "paused" ? "Paused · " : "● "}{clock(elapsed)}</output>}
    </div>
    {error && <p className="recorder-error" role="alert">{error}</p>}
    {state === "setup" && <div className="recorder-settings">
      <label>Record<select aria-label="Recording source" value={mode} onChange={(event) => setMode(event.target.value as CaptureMode)}><option value="screen-camera">Screen + camera</option><option value="screen">Screen only</option><option value="camera">Camera only</option></select></label>
      <label className="check"><input type="checkbox" checked={microphone} onChange={(event) => setMicrophone(event.target.checked)} /> Microphone</label>
      {microphone && <label>Microphone source<select aria-label="Microphone source" value={microphoneDeviceId} onChange={(event) => setMicrophoneDeviceId(event.target.value)}>{microphones.length ? microphones.map((device, index) => <option value={device.deviceId} key={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>) : <option value="">System default microphone</option>}</select></label>}
      <label className="check"><input type="checkbox" disabled={mode === "camera"} checked={mode !== "camera" && systemAudio} onChange={(event) => setSystemAudio(event.target.checked)} /> Shared tab/system audio when available</label>
      <label>Countdown<select aria-label="Recording countdown" value={countdown} onChange={(event) => setCountdown(Number(event.target.value))}><option value="0">None</option><option value="3">3 seconds</option><option value="5">5 seconds</option></select></label>
      <button className="primary wide" disabled={counting !== undefined} onClick={begin}>{counting ? "Get ready…" : "Start recording"}</button>
    </div>}
    {(state === "recording" || state === "paused") && <div className="recorder-actions">
      <button onClick={() => { if (state === "recording") { session.current?.pause(); setState("paused"); } else { session.current?.resume(); setState("recording"); } }}>{state === "recording" ? "Pause" : "Resume"}</button>
      <button className="primary" onClick={stop}>Stop and add to timeline</button>
      <button className="danger" onClick={close}>Cancel</button>
    </div>}
    {state === "saving" && <p role="status">Finishing and importing the recording locally…</p>}
    <p className="hint">Choose your headset under Microphone source. System audio depends on the browser and the surface you share. Chrome and Edge usually offer tab audio; operating-system audio support varies.</p>
  </>;
}
