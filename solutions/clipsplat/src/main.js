import "./style.css";
import { translate as tr, initializeLanguage } from "./i18n.js";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { PRESETS, timeline, videoFilter } from "./model.js";
const $ = (id) => document.getElementById(id);
$("app").innerHTML = `
<header><a class="brand" href="./"><img src="./icon.svg" alt="">ClipSplat<sup>™</sup></a><span>LOCAL VIDEO STUDIO \xB7 BY DRAWSPLAT</span><div class="header-actions"><label class="language-control"><select id="language" aria-label="Language"></select></label><a href="../../pages/tools.html">All tools \u2197</a></div></header>
<main><div class="intro"><div><div class="eyebrow">A little video. A clear message.</div><h1>Record. Bookend. Share.</h1><p>Make short videos for Instagram with an opening and a closing title panel.</p></div><span class="tag">Private by design \xB7 No account needed</span></div>
<div class="workspace"><section class="stage" aria-label="Video preview"><div class="stage-top"><strong>YOUR VIDEO</strong><span id="dimensions">1080 \xD7 1920 \xB7 9:16</span></div><div class="preview" id="preview"><canvas id="canvas" width="1080" height="1920" aria-label="Composition preview"></canvas><div class="guides" id="guides"><span>Keep key content here</span></div></div><div class="stage-controls"><button id="intro-preview">Opening</button><button id="clip-preview">Video</button><button id="outro-preview">Closing</button><button id="play" disabled>\u25B6 Preview all</button></div><label class="check hint"><input id="safe" type="checkbox" checked>Show approximate safe area (preview only)</label><p class="hint" id="summary">Add a video to get started.</p><p class="hint" id="recording" aria-live="polite"></p></section>
<div id="settings"><section class="panel"><h2><span class="step">01</span>Your video</h2><div class="row"><button class="primary" id="camera">Enable camera</button><label class="file" id="choose-file" tabindex="0" role="button">Choose video<input id="file" type="file" accept="video/*"></label></div><div class="row" style="margin-top:12px"><label>Camera<select id="facing"><option value="user">Front camera</option><option value="environment">Rear camera</option></select></label><label class="check"><input type="checkbox" id="mic" checked>Microphone</label></div><div class="row"><button id="record" disabled>\u25CF Record</button><button id="stop" disabled>\u25A0 Stop</button><button id="close-camera" disabled>Close camera</button></div><p class="source-name" id="source-name">Camera and microphone require your browser permission.</p><a id="original" hidden>Save original recording</a><div class="row"><label>Trim start (seconds)<input id="start" type="number" min="0" step="0.1" value="0" disabled></label><label>Trim end (seconds)<input id="end" type="number" min="0" step="0.1" value="0" disabled></label></div></section>
<section class="panel"><h2><span class="step">02</span>Format & framing</h2><div class="row"><label>Format<select id="preset"><option value="reel">Reel \xB7 9:16 \xB7 up to 3 min</option><option value="story">Story \xB7 9:16 \xB7 up to 60 sec</option><option value="feed">Feed portrait \xB7 4:5 \xB7 up to 3 min</option></select></label><label>Video framing<select id="fit"><option value="contain">Fit entire video</option><option value="crop">Fill \xB7 center crop</option></select></label></div><small>MP4 \xB7 H.264 video \xB7 AAC audio \xB7 30 fps. Reel and Story: 1080 \xD7 1920. Feed: 1080 \xD7 1350.</small></section>
<section class="panel"><h2><span class="step">03</span>Opening & closing panels</h2><div class="row"><label>Creator name<input id="creator" maxlength="70" placeholder="Your name"></label><label>Panel color<input id="color" type="color" value="#4720a4"></label></div><label>Opening title<textarea id="intro-text" maxlength="180">Welcome to this video</textarea></label><div class="row"><label>Opening seconds \xB7 0 to skip<input id="intro-duration" type="number" min="0" max="10" step="0.5" value="3"></label><button id="show-opening">Preview opening</button></div><label>Closing title<textarea id="outro-text" maxlength="180">Thanks for watching!</textarea></label><div class="row"><label>Closing seconds \xB7 0 to skip<input id="outro-duration" type="number" min="0" max="10" step="0.5" value="3"></label><button id="show-closing">Preview closing</button></div><small>Creator appears as \u201Cby [name]\u201D on both panels. Titles stay inside a conservative safe area.</small></section>
<section class="panel"><h2><span class="step">04</span>Ready to share</h2><p class="notice">Download your finished video, then upload it in Instagram. Export includes both panels and your trimmed clip.</p><button id="export" class="dark export" disabled>Create MP4</button><button id="cancel">Cancel export</button><progress id="progress" value="0" max="1" hidden></progress><p id="status" role="status" aria-live="polite">Your videos stay on this device.</p><a id="download" class="file" download="clipsplat.mp4">Download MP4 \u2193</a><button id="share" hidden>Share video</button><video id="result" controls playsinline hidden style="width:100%;max-height:320px;margin-top:12px"></video></section></div></div>
<details class="details"><summary>Format notes, privacy & sources</summary><p>These are conservative short-video presets, not every upload limit Instagram supports. ClipSplat™ limits Reels and feed videos to 3 minutes and Stories to 60 seconds, including panels. Account features and upload limits can vary. The guide is approximate: Instagram\u2019s interface and cropping differ across placements. Check the upload preview before posting.</p><p>The first export downloads the local video encoder from DrawSplat (about 32 MB). Recording, trimming and encoding happen in your browser. No video is uploaded, and projects are not automatically saved. Save your original recording before leaving. Longer or high-resolution clips may exceed a mobile device\u2019s available memory; this tool accepts source files up to 200 MB.</p><p>ClipSplat™ is an independent DrawSplat tool for Instagram; it is not affiliated with or endorsed by Meta. <a href="https://help.instagram.com/1038071743007909" target="_blank" rel="noopener">Instagram aspect ratio guidance</a> \xB7 <a href="https://github.com/fbsamples/reels_publishing_apis/tree/main/insta_reels_publishing_api_sample" target="_blank" rel="noopener">Meta video specifications</a> \xB7 <a href="https://www.meta.com/brand/resources/instagram/instagram-brand/" target="_blank" rel="noopener">Meta branding guidance</a></p></details></main><footer>ClipSplat™ 1.1 \xB7 Part of the <a href="../../">DrawSplat</a> family \xB7 <a href="https://github.com/mguhlin/drawsplat/tree/main/solutions/clipsplat">Source code</a> \xB7 AGPL-3.0-or-later</footer>`;
const canvas = $("canvas"), ctx = canvas.getContext("2d", { alpha: false });
const video = document.createElement("video");
video.playsInline = true;
video.preload = "auto";
video.className = "source";
document.body.append(video);
let source, sourceURL, outputURL, originalURL, stream, recorder, recordTimer, duration = 0, mode = "intro", busy = false, playing = false, playbackStart = 0, currentPlan, engine, cancelled = false;
const number = (id) => Number($(id).value), preset = () => PRESETS[$("preset").value];
const plan = () => timeline(duration, number("start"), number("end"), number("intro-duration"), number("outro-duration"), $("preset").value);
let statusState = { text: "Your videos stay on this device.", params: {} }, sourceName;
const message = (text, params = {}) => {
  statusState = { text, params };
  $("status").textContent = tr(text, params);
};
function invalidate() {
  if (outputURL) URL.revokeObjectURL(outputURL);
  outputURL = void 0;
  $("download").style.display = "none";
  $("share").hidden = true;
  $("result").pause();
  $("result").removeAttribute("src");
  $("result").hidden = true;
}
function update() {
  const p = preset();
  canvas.width = p.width;
  canvas.height = p.height;
  $("preview").style.aspectRatio = `${p.width}/${p.height}`;
  $("dimensions").textContent = `${p.width} \xD7 ${p.height} \xB7 ${$("preset").value === "feed" ? "4:5" : "9:16"}`;
  $("guides").style.display = $("safe").checked ? "block" : "none";
  try {
    const t = plan();
    $("summary").textContent = tr("{intro}s opening + {clip}s video + {outro}s closing = {total}s", {intro:t.intro,clip:(t.end-t.start).toFixed(1),outro:t.outro,total:t.total.toFixed(1)});
    $("export").disabled = busy || !source;
    $("play").disabled = busy || !source;
  } catch (error) {
    $("summary").textContent = tr(source ? error.message : "Add a video to get started.");
    $("export").disabled = true;
    $("play").disabled = true;
  }
}
function wrap(text, maxWidth, fontSize) {
  ctx.font = `750 ${fontSize}px system-ui`;
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (ctx.measureText(line + (line ? " " : "") + word).width <= maxWidth) {
        line += (line ? " " : "") + word;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      for (const character of word) {
        if (ctx.measureText(line + character).width > maxWidth) {
          lines.push(line);
          line = character;
        } else line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}
function panel(kind) {
  const w = canvas.width, h = canvas.height, bg = $("color").value;
  const rtl = document.documentElement.dir === "rtl";
  const textX = rtl ? w * .80 : w * .12;
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const rgb = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16)), light = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 150;
  const fg = light ? "#4720a4" : "#faf8ff", accent = light ? "#4720a4" : "#f5b942";
  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.12, h * 0.24, w * 0.1, 8);
  const title = $(kind + "-text").value.trim() || tr(kind === "intro" ? "Welcome" : "Thanks for watching");
  let size = 76, lines = wrap(title, w * 0.68, size);
  while (lines.length * size * 1.22 > h * 0.28 && size > 34) {
    size -= 2;
    lines = wrap(title, w * 0.68, size);
  }
  ctx.fillStyle = fg;
  ctx.font = `750 ${size}px system-ui`;
  ctx.textBaseline = "top";
  const top = h * 0.43 - lines.length * size * 1.22 / 2;
  lines.forEach((line, i) => ctx.fillText(line, textX, top + i * size * 1.22));
  const creator = $("creator").value.trim();
  if (creator) {
    ctx.fillStyle = accent;
    const names = wrap(tr("by {name}",{name:creator}), w * 0.68, 35);
    ctx.font = "500 35px system-ui";
    names.forEach((line, i) => ctx.fillText(line, textX, h * 0.64 + i * 44));
  }
}
function drawVideo() {
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#4720a4";
  ctx.fillRect(0, 0, w, h);
  if (!video.videoWidth) {
    ctx.fillStyle = "#f5b942";
    ctx.font = "650 44px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(tr("Your video goes here"), w / 2, h / 2);
    ctx.textAlign = "left";
    return;
  }
  const scale = ($("fit").value === "crop" ? Math.max : Math.min)(w / video.videoWidth, h / video.videoHeight), dw = video.videoWidth * scale, dh = video.videoHeight * scale;
  ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
function stopPreview() {
  playing = false;
  if (!stream) video.pause();
  $("play").textContent = tr("▶ Preview all");
}
function show(kind) {
  stopPreview();
  mode = kind;
  if (kind === "clip" && stream) video.play().catch((error) => message(error.message));
  if (kind === "clip" && source && !stream) video.currentTime = number("start");
}
function render() {
  if (playing && currentPlan) {
    const elapsed = (performance.now() - playbackStart) / 1e3;
    if (elapsed < currentPlan.intro) mode = "intro";
    else if (elapsed < currentPlan.intro + currentPlan.end - currentPlan.start) {
      mode = "clip";
      if (video.paused) {
        video.currentTime = currentPlan.start;
        video.play().catch((error) => {
          stopPreview();
          message(error.message);
        });
      }
    } else if (elapsed < currentPlan.total) {
      mode = "outro";
      video.pause();
    } else stopPreview();
  }
  if (mode === "clip") drawVideo();
  else panel(mode);
  requestAnimationFrame(render);
}
function controls(locked) {
  busy = locked;
  $("language").disabled = locked;
  for (const el of $("settings").querySelectorAll("input,textarea,select,button")) el.disabled = locked;
  $("cancel").disabled = false;
  $("cancel").style.display = locked ? "inline-block" : "none";
  if (!locked) {
    $("record").disabled = !stream;
    $("stop").disabled = true;
    $("close-camera").disabled = !stream;
    $("start").disabled = !source;
    $("end").disabled = !source;
  }
  for (const id of ["intro-preview", "clip-preview", "outro-preview"]) $(id).disabled = locked;
  update();
}
function closeCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = void 0;
  video.srcObject = null;
  if (sourceURL) video.src = sourceURL;
  else video.removeAttribute("src");
  $("record").disabled = true;
  $("close-camera").disabled = true;
}
async function waitMetadata() {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => done(new Error("This video could not be read. Try an MP4 or WebM file.")), 15e3);
    function done(error) {
      clearTimeout(timer);
      video.removeEventListener("loadedmetadata", loaded);
      video.removeEventListener("error", failed);
      error ? reject(error) : resolve();
    }
    function loaded() {
      done();
    }
    function failed() {
      done(new Error("This browser cannot decode this video. Try an MP4 or WebM file."));
    }
    video.addEventListener("loadedmetadata", loaded, { once: true });
    video.addEventListener("error", failed, { once: true });
  });
  if (!Number.isFinite(video.duration)) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        video.removeEventListener("seeked", done);
        reject(new Error("Could not determine video length. Save the recording and retry."));
      }, 1e4);
      function done() {
        clearTimeout(timer);
        video.currentTime = 0;
        resolve();
      }
      video.addEventListener("seeked", done, { once: true });
      video.currentTime = 1e10;
    });
  }
  if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error("Could not determine video length.");
}
async function load(blob, name) {
  if (blob.size > 200 * 1024 * 1024) throw new Error("Choose a source video smaller than 200 MB.");
  stopPreview();
  closeCamera();
  invalidate();
  source = void 0;
  duration = 0;
  update();
  if (sourceURL) URL.revokeObjectURL(sourceURL);
  sourceURL = URL.createObjectURL(blob);
  const ready = waitMetadata();
  video.src = sourceURL;
  await ready;
  source = blob;
  duration = video.duration;
  $("start").value = "0";
  $("end").value = Math.min(duration, preset().max - number("intro-duration") - number("outro-duration")).toFixed(2);
  sourceName = name;
  $("source-name").textContent = tr("{name} · {duration} seconds",{name:sourceName === "Camera recording" ? tr(sourceName) : sourceName,duration:duration.toFixed(1)});
  $("start").disabled = false;
  $("end").disabled = false;
  mode = "clip";
  update();
  message("Video ready. Adjust the panels, then create your MP4.");
}
$("choose-file").onkeydown = event => {
  if ((event.key === "Enter" || event.key === " ") && !$("file").disabled) {
    event.preventDefault();
    $("file").click();
  }
};
$("file").onchange = async () => {
  const file = $("file").files[0];
  if (!file) return;
  try {
    await load(file, file.name);
  } catch (error) {
    message(error.message);
  } finally {
    $("file").value = "";
  }
};
$("camera").onclick = async () => {
  try {
    stopPreview();
    closeCamera();
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera recording requires HTTPS and a current browser. You can also choose an existing video.");
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: $("facing").value, width: { ideal: 1080 }, height: { ideal: 1920 }, frameRate: { ideal: 30 } }, audio: $("mic").checked });
    video.removeAttribute("src");
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    mode = "clip";
    $("record").disabled = false;
    $("close-camera").disabled = false;
    message("Camera ready. Frame your shot and press Record.");
  } catch (error) {
    closeCamera();
    message("Camera unavailable: {error}",{error:error.message});
  }
};
$("close-camera").onclick = () => {
  closeCamera();
  message("Camera closed.");
};
$("record").onclick = () => {
  try {
    const mime = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : void 0);
    const chunks = [];
    let bytes = 0;
    recorder.ondataavailable = (e) => {
      if (e.data.size) {
        chunks.push(e.data);
        bytes += e.data.size;
      }
      if (bytes > 190 * 1024 * 1024 && recorder.state === "recording") recorder.stop();
    };
    recorder.onerror = () => {
      message("Recording failed. Please try again.");
      recorder.state !== "inactive" && recorder.stop();
    };
    recorder.onstop = async () => {
      clearInterval(recordTimer);
      $("recording").textContent = "";
      // Let any final queued dataavailable event drain, as in VideoSplat.
      await new Promise(resolve => setTimeout(resolve, 100));
      const blob = new Blob(chunks, { type: recorder.mimeType });
      if (originalURL) URL.revokeObjectURL(originalURL);
      originalURL = URL.createObjectURL(blob);
      $("original").href = originalURL;
      $("original").download = `clipsplat-original.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
      $("original").hidden = false;
      try {
        if (!blob.size) throw new Error("No video was captured. Try recording again.");
        await load(blob, "Camera recording");
      } catch (error) {
        closeCamera();
        message(tr(error.message) + " " + tr("You can save the original recording."));
      } finally {
        controls(false);
      }
    };
    recorder.start(500);
    controls(true);
    $("cancel").style.display = "none";
    $("stop").disabled = false;
    $("close-camera").disabled = true;
    const began = performance.now();
    recordTimer = setInterval(() => {
      const seconds = (performance.now() - began) / 1e3;
      $("recording").textContent = tr("● Recording · {seconds}s",{seconds:seconds.toFixed(0)});
      const max = preset().max - number("intro-duration") - number("outro-duration");
      if (seconds >= max && recorder.state === "recording") recorder.stop();
    }, 200);
    message("Recording. Press Stop when finished.");
  } catch (error) {
    controls(false);
    message(error.message);
  }
};
$("stop").onclick = () => {
  if (recorder?.state === "recording") recorder.stop();
};
$("play").onclick = async () => {
  if (playing) {
    stopPreview();
    return;
  }
  if (stream) closeCamera();
  try {
    currentPlan = plan();
    video.muted = false;
    video.currentTime = currentPlan.start;
    await video.play();
    video.pause();
    playing = true;
    playbackStart = performance.now();
    $("play").textContent = tr("■ Stop preview");
  } catch (error) {
    message(error.message);
  }
};
for (const [id, kind] of [["intro-preview", "intro"], ["show-opening", "intro"], ["clip-preview", "clip"], ["outro-preview", "outro"], ["show-closing", "outro"]]) $(id).onclick = () => show(kind);
for (const id of ["start", "end", "preset", "fit", "creator", "color", "intro-text", "outro-text", "intro-duration", "outro-duration"]) $(id).addEventListener("input", () => {
  stopPreview();
  invalidate();
  update();
});
$("safe").onchange = update;
async function getEngine() {
  message("Loading local MP4 encoder\u2026");
  const ffmpeg = new FFmpeg();
  engine = ffmpeg;
  const responses = await Promise.all([1, 2].map((n) => fetch(`/solutions/mediasplat/ffmpeg/ffmpeg-core.part-0${n}`)));
  if (responses.some((r) => !r.ok)) throw new Error("The video encoder could not be downloaded. Check your connection and retry.");
  const chunks = await Promise.all(responses.map((r) => r.arrayBuffer()));
  if (cancelled) throw new Error("Export cancelled.");
  const wasmURL = URL.createObjectURL(new Blob(chunks, { type: "application/wasm" }));
  try {
    await ffmpeg.load({ coreURL: "/solutions/mediasplat/ffmpeg/ffmpeg-core.js", wasmURL });
  } finally {
    URL.revokeObjectURL(wasmURL);
  }
  return ffmpeg;
}
async function png(kind) {
  panel(kind);
  return new Uint8Array(await (await new Promise((resolve) => canvas.toBlob(resolve, "image/png"))).arrayBuffer());
}
$("cancel").onclick = () => {
  cancelled = true;
  engine?.terminate();
  message("Export cancelled. Your source video is still available.");
};
$("export").onclick = async () => {
  let ffmpeg;
  stopPreview();
  if (stream) closeCamera();
  invalidate();
  cancelled = false;
  let files = [];
  try {
    const t = plan(), { width, height } = preset();
    controls(true);
    $("progress").hidden = false;
    $("progress").value = 0;
    ffmpeg = await getEngine();
    if (cancelled) throw new Error("Export cancelled.");
    let hasAudio = false;
    const probeAudio = ({ message: line }) => {
      if (/Stream #.*Audio:/.test(line)) hasAudio = true;
    };
    ffmpeg.on("log", probeAudio);
    const extension = source.type.includes("mp4") ? "mp4" : source.type.includes("quicktime") ? "mov" : "webm", input = `source.${extension}`;
    files.push(input);
    await ffmpeg.writeFile(input, new Uint8Array(await source.arrayBuffer()));
    await ffmpeg.exec(["-i", input, "-t", "0", "-f", "null", "-"]);
    ffmpeg.off("log", probeAudio);
    const segments = [], codec = ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "22", "-pix_fmt", "yuv420p", "-r", "30", "-g", "60", "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2", "-threads", "2"];
    async function run(args2, name, label) {
      message(label);
      const code2 = await ffmpeg.exec(args2);
      if (cancelled) throw new Error("Export cancelled.");
      if (code2 !== 0) throw new Error("MP4 encoding failed. Try a shorter clip or a smaller source file.");
      segments.push(name);
    }
    async function title(kind, seconds) {
      if (!seconds) return;
      const image = `${kind}.png`, output2 = `${kind}.mp4`;
      files.push(image, output2);
      await ffmpeg.writeFile(image, await png(kind));
      await run(["-loop", "1", "-framerate", "30", "-i", image, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", String(seconds), "-vf", "setsar=1", ...codec, "-y", output2], output2, kind === "intro" ? "Creating opening panel…" : "Creating closing panel…");
    }
    await title("intro", t.intro);
    $("progress").value = 0.15;
    const clip = "clip.mp4";
    files.push(clip);
    const args = ["-ss", String(t.start), "-i", input];
    if (!hasAudio) args.push("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo");
    args.push("-t", String(t.end - t.start), "-map", "0:v:0", "-map", hasAudio ? "0:a:0" : "1:a:0", "-vf", videoFilter(width, height, $("fit").value), "-af", "apad", ...codec, "-y", clip);
    await run(args, clip, "Encoding your video\u2026 Keep this tab open.");
    $("progress").value = 0.75;
    await title("outro", t.outro);
    $("progress").value = 0.9;
    const list = "segments.txt", output = "clipsplat.mp4";
    files.push(list, output);
    await ffmpeg.writeFile(list, new TextEncoder().encode(segments.map((name) => `file '${name}'`).join("\n")));
    message("Joining panels and video\u2026");
    const code = await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", "-y", output]);
    if (code !== 0) throw new Error("Could not join the video segments.");
    const data = await ffmpeg.readFile(output);
    if (cancelled) throw new Error("Export cancelled.");
    const blob = new Blob([data], { type: "video/mp4" });
    if (blob.size > 300 * 1024 * 1024) throw new Error("The finished MP4 is too large. Shorten your video and retry.");
    outputURL = URL.createObjectURL(blob);
    $("download").href = outputURL;
    $("download").style.display = "inline-block";
    $("result").src = outputURL;
    $("result").hidden = false;
    $("share").hidden = !navigator.canShare?.({ files: [new File([blob], "clipsplat.mp4", { type: "video/mp4" })] });
    $("share").onclick = async () => {
      try {
        await navigator.share({ files: [new File([blob], "clipsplat.mp4", { type: "video/mp4" })] });
      } catch (error) {
        if (error.name !== "AbortError") message("Sharing unavailable. Use Download MP4 instead.");
      }
    };
    $("progress").value = 1;
    message("MP4 ready · {duration}s · {size} MB. Download, then upload in Instagram.",{duration:t.total.toFixed(1),size:(blob.size/1024/1024).toFixed(1)});
  } catch (error) {
    message(cancelled ? "Export cancelled. Your video is still available." : error.message);
  } finally {
    for (const file of files) {
      try {
        await ffmpeg?.deleteFile(file);
      } catch {
      }
    }
    engine?.terminate();
    engine = void 0;
    controls(false);
    mode = "clip";
    $("progress").hidden = true;
  }
};
window.addEventListener("beforeunload", (event) => {
  if (source || busy) {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("pagehide", () => {
  stream?.getTracks().forEach((t) => t.stop());
  engine?.terminate();
});
initializeLanguage(({titlesChanged}) => {
  stopPreview();
  if(titlesChanged) invalidate();
  update();
  message(statusState.text,statusState.params);
  if(sourceName) $("source-name").textContent = tr("{name} · {duration} seconds",{name:sourceName === "Camera recording" ? tr(sourceName) : sourceName,duration:duration.toFixed(1)});
  else $("source-name").textContent = tr("Camera and microphone require your browser permission.");
});
update();
render();
