import "./style.css";
import { FRAME_OPTIONS, drawPanelFrame, loadIllustratedFrame, isIllustratedFrame } from "./panel-frames.js";
import logoUrl from "../icon.svg";
import { translate as tr, initializeLanguage } from "./i18n.js";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { PRESETS, timeline, videoFilter, retainedSegments, selectionCuts, sourceTimeAt, editedTimeAt, composeSequence } from "./model.js";
import { IMAGE_CARDS_MARKUP, createImageCardsEditor, readCardImage } from "./image-cards.js";
import { TIMELINE_MARKUP, createTimelineEditor } from "./timeline-editor.js";
const $ = (id) => document.getElementById(id);
$("app").innerHTML = `
<header><a class="brand" href="./"><img src="${logoUrl}" alt="">ClipSplat<sup>™</sup></a><span>LOCAL VIDEO STUDIO \xB7 BY DRAWSPLAT</span><div class="header-actions"><label class="language-control"><select id="language" aria-label="Language"></select></label><a href="../../pages/tools.html">All tools \u2197</a></div></header>
<main><div class="intro"><div><div class="eyebrow">A little video. A clear message.</div><h1>Record. Bookend. Share.</h1><p>Make short videos for Instagram with an opening and a closing title panel.</p></div><span class="tag">Private by design \xB7 No account needed</span></div>
<div class="workspace"><div class="preview-column"><section class="stage" aria-label="Video preview"><div class="stage-top"><strong>YOUR VIDEO</strong><span id="dimensions">1080 \xD7 1920 \xB7 9:16</span></div><div class="preview" id="preview"><canvas id="canvas" width="1080" height="1920" aria-label="Composition preview"></canvas><div class="guides" id="guides"><span>Keep key content here</span></div></div><div class="stage-controls"><button id="intro-preview">Opening</button><button id="clip-preview">Video</button><button id="outro-preview">Closing</button><button id="play" disabled>\u25B6 Preview all</button></div><label class="check hint"><input id="safe" type="checkbox" checked>Show approximate safe area (preview only)</label><p class="hint" id="summary">Add a video to get started.</p><p class="hint" id="recording" aria-live="polite"></p></section>${TIMELINE_MARKUP}</div>
<div id="settings"><section class="panel"><h2><span class="step">01</span>Your video</h2><div class="row"><button class="primary" id="camera">Enable camera</button><label class="file" id="choose-file" tabindex="0" role="button">Choose video<input id="file" type="file" accept="video/*"></label></div><div class="row" style="margin-top:12px"><label>Camera<select id="facing"><option value="user">Front camera</option><option value="environment">Rear camera</option></select></label><label class="check"><input type="checkbox" id="mic" checked>Microphone</label></div><div class="row"><button id="record" disabled>\u25CF Record</button><button id="stop" disabled>\u25A0 Stop</button><button id="close-camera" disabled>Close camera</button></div><p class="source-name" id="source-name">Camera and microphone require your browser permission.</p><a id="original" hidden>Save original recording</a><div class="row"><label>Trim start (seconds)<input id="start" type="number" min="0" step="0.1" value="0" disabled></label><label>Trim end (seconds)<input id="end" type="number" min="0" step="0.1" value="0" disabled></label></div></section>
<section class="panel"><h2><span class="step">02</span>Format & framing</h2><div class="row"><label>Format<select id="preset"><option value="reel">Reel \xB7 9:16 \xB7 up to 3 min</option><option value="story">Story \xB7 9:16 \xB7 up to 60 sec</option><option value="feed">Feed portrait \xB7 4:5 \xB7 up to 3 min</option></select></label><label>Video framing<select id="fit"><option value="contain">Fit entire video</option><option value="crop">Fill \xB7 center crop</option></select></label></div><small>MP4 \xB7 H.264 video \xB7 AAC audio \xB7 30 fps. Reel and Story: 1080 \xD7 1920. Feed: 1080 \xD7 1350.</small></section>
<section class="panel"><h2><span class="step">03</span>Opening & closing panels</h2><div class="row"><label>Creator name<input id="creator" maxlength="70" placeholder="Your name"></label><label>Panel color<input id="color" type="color" value="#4720a4"></label></div><fieldset class="title-panel"><legend>Opening Panel</legend><label>Panel frame<select id="intro-frame">${FRAME_OPTIONS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label><div class="panel-image-controls"><button id="intro-choose-image" type="button">Add image</button><input id="intro-image" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden aria-label="Opening panel image"><button id="intro-remove-image" type="button" hidden>Remove image</button></div><div id="intro-image-details" class="panel-image-details" hidden><img id="intro-image-thumbnail" alt=""><span id="intro-image-name"></span></div><small class="image-hint">Optional photo or logo. Fits above your title without cropping.</small><label>Opening title<textarea id="intro-text" maxlength="180">Welcome to this video</textarea></label><div class="row"><label>Opening seconds \xB7 0 to skip<input id="intro-duration" type="number" min="0" max="10" step="0.5" value="3"></label><button id="show-opening">Preview opening</button></div></fieldset><fieldset class="title-panel"><legend>Closing Panel</legend><label>Panel frame<select id="outro-frame">${FRAME_OPTIONS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label><div class="panel-image-controls"><button id="outro-choose-image" type="button">Add image</button><input id="outro-image" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden aria-label="Closing panel image"><button id="outro-remove-image" type="button" hidden>Remove image</button></div><div id="outro-image-details" class="panel-image-details" hidden><img id="outro-image-thumbnail" alt=""><span id="outro-image-name"></span></div><small class="image-hint">Optional photo or logo. Fits above your title without cropping.</small><label>Closing title<textarea id="outro-text" maxlength="180">Thanks for watching!</textarea></label><div class="row"><label>Closing seconds \xB7 0 to skip<input id="outro-duration" type="number" min="0" max="10" step="0.5" value="3"></label><button id="show-closing">Preview closing</button></div></fieldset><small>Creator appears as \u201Cby [name]\u201D on both panels. Titles stay inside a conservative safe area.</small></section>
${IMAGE_CARDS_MARKUP}<section class="panel"><h2><span class="step">05</span>Ready to share</h2><p class="notice">Download your finished video, then upload it in Instagram. Export includes both panels and your trimmed clip.</p><button id="export" class="dark export" disabled>Create MP4</button><button id="cancel">Cancel export</button><progress id="progress" value="0" max="1" hidden></progress><p id="status" role="status" aria-live="polite">Your videos stay on this device.</p><a id="download" class="file" download="clipsplat.mp4">Download MP4 \u2193</a><button id="share" hidden>Share video</button><video id="result" controls playsinline hidden style="width:100%;max-height:320px;margin-top:12px"></video></section></div></div>
<details class="details"><summary>Format notes, privacy & sources</summary><p>These are conservative short-video presets, not every upload limit Instagram supports. ClipSplat™ limits Reels and feed videos to 3 minutes and Stories to 60 seconds, including panels. Account features and upload limits can vary. The guide is approximate: Instagram\u2019s interface and cropping differ across placements. Check the upload preview before posting.</p><p>The first export downloads the local video encoder from DrawSplat (about 32 MB). Recording, trimming and encoding happen in your browser. No video is uploaded, and projects are not automatically saved. Save your original recording before leaving. Longer or high-resolution clips may exceed a mobile device\u2019s available memory; this tool accepts source files up to 200 MB.</p><p>ClipSplat™ is an independent DrawSplat tool for Instagram; it is not affiliated with or endorsed by Meta. <a href="https://help.instagram.com/1038071743007909" target="_blank" rel="noopener">Instagram aspect ratio guidance</a> \xB7 <a href="https://github.com/fbsamples/reels_publishing_apis/tree/main/insta_reels_publishing_api_sample" target="_blank" rel="noopener">Meta video specifications</a> \xB7 <a href="https://www.meta.com/brand/resources/instagram/instagram-brand/" target="_blank" rel="noopener">Meta branding guidance</a></p></details></main><footer>ClipSplat™ 1.1 \xB7 Part of the <a href="../../">DrawSplat</a> family \xB7 <a href="https://github.com/mguhlin/drawsplat/tree/main/solutions/clipsplat">Source code</a> \xB7 AGPL-3.0-or-later</footer>`;
const canvas = $("canvas"), ctx = canvas.getContext("2d", { alpha: false });
const video = document.createElement("video");
video.playsInline = true;
video.preload = "auto";
video.className = "source";
document.body.append(video);
let source, sourceURL, outputURL, originalURL, stream, recorder, recordTimer, duration = 0, mode = "intro", busy = false, playing = false, playbackStart = 0, currentPlan, engine, cancelled = false;
const panelImages = { intro: null, outro: null };
let imagesLoading = 0, cuts = [], cutHistory = [], editor, cardsEditor;
let imageCards = [], nextCardId = 1, previewItems = [];
let previewSegment = 0;
const number = (id) => Number($(id).value), preset = () => PRESETS[$("preset").value];
const plan = () => timeline(duration, number("start"), number("end"), number("intro-duration"), number("outro-duration"), $("preset").value, cuts, imageCards);
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
    $("summary").textContent = imageCards.some(card=>card.seconds > 0)
      ? tr("{intro}s opening + {clip}s video + {cards}s image cards + {outro}s closing = {total}s", {intro:t.intro,clip:t.clipDuration.toFixed(1),cards:t.cardDuration.toFixed(1),outro:t.outro,total:t.total.toFixed(1)})
      : tr("{intro}s opening + {clip}s video + {outro}s closing = {total}s", {intro:t.intro,clip:t.clipDuration.toFixed(1),outro:t.outro,total:t.total.toFixed(1)});
    $("export").disabled = busy || imagesLoading > 0 || !source;
    $("play").disabled = busy || imagesLoading > 0 || !source;
  } catch (error) {
    $("summary").textContent = tr(source ? error.message : "Add a video to get started.");
    $("export").disabled = true;
    $("play").disabled = true;
  }
  for (const kind of ["intro","outro"]) $(kind+"-frame").disabled = busy || imagesLoading > 0;
  editor?.update();
  cardsEditor?.update();
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
  const card = imageCards.find(item=>item.id === kind);
  const w = canvas.width, h = canvas.height, bg = card?.color || $("color").value;
  const rtl = document.documentElement.dir === "rtl";
  const frame = card ? card.frame : $(kind + "-frame").value;
  const illustrated = isIllustratedFrame(frame);
  const textX = rtl ? w * (illustrated ? .74 : .80) : w * (illustrated ? .26 : .12);
  const textWidth = w * (illustrated ? .48 : .68);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const rgb = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16)), light = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 150;
  const fg = light ? "#4720a4" : "#faf8ff", accent = light ? "#4720a4" : "#f5b942";
  drawPanelFrame(ctx, w, h, frame, fg, accent);
  const image = card ? card.image : panelImages[kind]?.image;
  const title = card ? card.title.trim() : $(kind + "-text").value.trim() || tr(kind === "intro" ? "Welcome" : "Thanks for watching");
  if (image) {
    const scale = Math.min(textWidth / image.naturalWidth, h * (card && !title ? (illustrated ? .42 : .48) : illustrated ? .22 : .23) / image.naturalHeight);
    const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
    ctx.drawImage(image, w * (illustrated ? .5 : .46) - iw / 2, h * (card && !title ? (illustrated ? .43 : .40) : illustrated ? .32 : .275) - ih / 2, iw, ih);
  }
  ctx.fillStyle = accent;
  if (title) ctx.fillRect(w * (illustrated ? .26 : .12), h * (image ? (illustrated ? .445 : .415) : .24), w * 0.1, 8);
  let size = 76, lines = wrap(title, textWidth, size);
  while (lines.length * size * 1.22 > h * (image ? (illustrated ? .16 : .18) : .28) && size > (illustrated ? 20 : 34)) {
    size -= 2;
    lines = wrap(title, textWidth, size);
  }
  ctx.fillStyle = fg;
  ctx.font = `750 ${size}px system-ui`;
  ctx.textBaseline = "top";
  const top = h * (image ? .54 : .43) - lines.length * size * 1.22 / 2;
  lines.forEach((line, i) => ctx.fillText(line, textX, top + i * size * 1.22));
  const creator = $("creator").value.trim();
  if (creator) {
    ctx.fillStyle = accent;
    let nameSize = 35, names = wrap(tr("by {name}",{name:creator}), textWidth, nameSize);
    while (illustrated && names.length * nameSize * 1.25 > h * .065 && nameSize > 18) {
      nameSize--; names = wrap(tr("by {name}",{name:creator}), textWidth, nameSize);
    }
    ctx.font = `500 ${nameSize}px system-ui`;
    names.forEach((line, i) => ctx.fillText(line, textX, h * (image ? (illustrated ? .69 : .70) : .64) + i * (illustrated ? nameSize * 1.25 : 44)));
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
  if (kind === "clip" && source && !stream) video.currentTime = sourceTimeAt(retainedSegments(duration, number("start"), number("end"), cuts), 0);
}
function beginPreviewItem(index) {
  previewSegment = index;
  if (index >= previewItems.length) { stopPreview(); return; }
  const item = previewItems[index];
  if (item.kind === "video") {
    mode = "clip";
    video.currentTime = item.start;
    video.play().catch(error=>{stopPreview(); message(error.message);});
  } else {
    video.pause();
    mode = item.id;
    playbackStart = performance.now();
  }
}
function render() {
  if (playing && currentPlan) {
    const item = previewItems[previewSegment];
    if (item?.kind === "video") {
      if (!video.seeking && (video.currentTime >= item.end - .015 || video.ended)) beginPreviewItem(previewSegment + 1);
    } else if (item && (performance.now() - playbackStart) / 1000 >= item.seconds) beginPreviewItem(previewSegment + 1);
  }
  if (mode === "clip") drawVideo();
  else panel(mode);
  if (source && !stream) {
    const card = imageCards.find(item=>item.id === mode);
    editor?.setPlayhead(card ? card.at : mode === "intro" ? number("start") : mode === "outro" ? number("end") : video.currentTime);
  }
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
  cuts = [];
  cutHistory = [];
  editor?.resetSelection();
  update();
  if (sourceURL) URL.revokeObjectURL(sourceURL);
  sourceURL = URL.createObjectURL(blob);
  const ready = waitMetadata();
  video.src = sourceURL;
  await ready;
  source = blob;
  duration = video.duration;
  for (const card of imageCards) card.at = Math.min(card.at, duration);
  $("start").value = "0";
  $("end").value = Math.min(duration, Math.max(.1, preset().max - number("intro-duration") - number("outro-duration") - imageCards.reduce((sum,card)=>sum+card.seconds,0))).toFixed(2);
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
    update();
    message("Camera ready. Frame your shot and press Record.");
  } catch (error) {
    closeCamera();
    message("Camera unavailable: {error}",{error:error.message});
  }
};
$("close-camera").onclick = () => {
  closeCamera();
  update();
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
      const max = preset().max - number("intro-duration") - number("outro-duration") - imageCards.reduce((sum,card)=>sum+card.seconds,0);
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
    video.currentTime = currentPlan.segments[0].start;
    await video.play();
    video.pause();
    playing = true;
    playbackStart = performance.now();
    $("play").textContent = tr("■ Stop preview");
    previewItems = [
      ...(currentPlan.intro ? [{kind:"panel",id:"intro",seconds:currentPlan.intro}] : []),
      ...currentPlan.sequence,
      ...(currentPlan.outro ? [{kind:"panel",id:"outro",seconds:currentPlan.outro}] : [])
    ];
    beginPreviewItem(0);
  } catch (error) {
    message(error.message);
  }
};
for (const [id, kind] of [["intro-preview", "intro"], ["show-opening", "intro"], ["clip-preview", "clip"], ["outro-preview", "outro"], ["show-closing", "outro"]]) $(id).onclick = () => show(kind);
for (const id of ["start", "end", "preset", "fit", "creator", "color", "intro-text", "outro-text", "intro-duration", "outro-duration"]) $(id).addEventListener("input", () => {
  stopPreview();
  invalidate();
  if (id === "start" || id === "end") editor.resetSelection();
  update();
});
async function ensureIllustratedFrame(style) {
  if (!isIllustratedFrame(style)) return;
  imagesLoading++; update(); message("Loading illustrated frame…");
  try { await loadIllustratedFrame(style); message("Illustrated frame ready."); }
  catch(error) { message("This frame could not be loaded. Please select it again to retry."); throw error; }
  finally { imagesLoading--; update(); }
}
for (const kind of ["intro", "outro"]) {
  $(kind + "-frame").oninput = async () => {
    stopPreview(); invalidate(); show(kind); update();
    try { await ensureIllustratedFrame($(kind+"-frame").value); }
    catch { $(kind+"-frame").value = "none"; update(); }
  };
  const input = $(kind + "-image"), choose = $(kind + "-choose-image"), remove = $(kind + "-remove-image");
  choose.onclick = () => input.click();
  remove.onclick = () => {
    stopPreview();
    URL.revokeObjectURL(panelImages[kind].url);
    panelImages[kind] = null;
    $(kind + "-image-thumbnail").removeAttribute("src");
    $(kind + "-image-details").hidden = true;
    remove.hidden = true;
    invalidate();
    show(kind);
  };
  input.onchange = async () => {
    const file = input.files[0];
    input.value = "";
    if (!file || busy) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
      message("This image could not be opened. Try a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      message("Choose an image smaller than 15 MB.");
      return;
    }
    imagesLoading++;
    choose.disabled = remove.disabled = true;
    update();
    const url = URL.createObjectURL(file), image = new Image();
    image.src = url;
    try {
      await image.decode();
      if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error("large-image");
      if (panelImages[kind]) URL.revokeObjectURL(panelImages[kind].url);
      panelImages[kind] = { image, url };
      $(kind + "-image-thumbnail").src = url;
      $(kind + "-image-name").textContent = file.name;
      $(kind + "-image-details").hidden = false;
      remove.hidden = false;
      stopPreview();
      invalidate();
      show(kind);
      message("Image added. Preview the panel to see it with your title.");
    } catch (error) {
      URL.revokeObjectURL(url);
      message(error.message === "large-image" ? "Choose an image with fewer than 40 million pixels." : "This image could not be opened. Try a PNG, JPEG or WebP image.");
    } finally {
      imagesLoading--;
      choose.disabled = remove.disabled = busy;
      update();
    }
  };
}
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
  if (imagesLoading || busy) return;
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
    await Promise.all([$("intro-frame").value,$("outro-frame").value,...imageCards.map(card=>card.frame)].map(loadIllustratedFrame));
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
      await run(["-loop", "1", "-framerate", "30", "-i", image, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", String(seconds), "-vf", "setsar=1", ...codec, "-y", output2], output2, kind === "intro" ? "Creating opening panel…" : kind === "outro" ? "Creating closing panel…" : "Creating image card…");
    }
    await title("intro", t.intro);
    $("progress").value = 0.15;
    for (const [index, part] of t.sequence.entries()) {
      if (part.kind === "card") {
        await title(part.id, part.seconds);
        $("progress").value = .15 + .6 * (index + 1) / t.sequence.length;
        continue;
      }
      const clip = `clip-${index}.mp4`;
      files.push(clip);
      const args = ["-ss", String(part.start), "-i", input];
      if (!hasAudio) args.push("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo");
      args.push("-t", String(part.end - part.start), "-map", "0:v:0", "-map", hasAudio ? "0:a:0" : "1:a:0", "-vf", videoFilter(width, height, $("fit").value), "-af", "apad", ...codec, "-y", clip);
      await run(args, clip, "Encoding your video… Keep this tab open.");
      $("progress").value = .15 + .6 * (index + 1) / t.sequence.length;
    }
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
editor = createTimelineEditor({
  getState: () => ({
    segments: source ? retainedSegments(duration, number("start"), number("end"), cuts) : [],
    intro: number("intro-duration"), outro: number("outro-duration"),
    locked: busy || imagesLoading > 0 || !!stream || !source,
    canUndo: cutHistory.length > 0, hasCuts: cuts.length > 0,
    sequence: composeSequence(source ? retainedSegments(duration, number("start"), number("end"), cuts) : [], imageCards), cards: imageCards
  }),
  onCardPreview: id => show(id),
  onSeek: time => {
    if (busy || stream || !source) return;
    stopPreview();
    mode = "clip";
    const parts = retainedSegments(duration, number("start"), number("end"), cuts);
    video.currentTime = sourceTimeAt(parts, time);
  },
  onDelete: (start, end) => {
    try {
      if (busy || stream || !source) return;
      const parts = retainedSegments(duration, number("start"), number("end"), cuts);
      const nextCuts = [...cuts, ...selectionCuts(parts, start, end)];
      if (!retainedSegments(duration, number("start"), number("end"), nextCuts).length) throw new Error("Keep at least one frame of video.");
      cutHistory.push(cuts);
      cuts = nextCuts;
      stopPreview();
      invalidate();
      editor.resetSelection();
      show("clip");
      update();
      message("Selection deleted. Undo restores it; the original recording is unchanged.");
    } catch (error) { message(error.message); editor.notify(error.message); }
  },
  onUndo: () => {
    if (busy || stream || !cutHistory.length) return;
    cuts = cutHistory.pop();
    stopPreview(); invalidate(); editor.resetSelection(); show("clip"); update();
    message("Last cut undone.");
  },
  onReset: () => {
    if (busy || stream || !cuts.length) return;
    cutHistory.push(cuts);
    cuts = [];
    stopPreview(); invalidate(); editor.resetSelection(); show("clip"); update();
    message("All deleted sections restored.");
  }
});
cardsEditor = createImageCardsEditor({
  getState: () => {
    const parts = retainedSegments(duration, number("start"), number("end"), cuts);
    return {cards:imageCards,positionOf:card=>editedTimeAt(parts,card.at),maxPosition:parts.reduce((sum,part)=>sum+part.end-part.start,0),locked:busy || imagesLoading > 0,hasSource:!!source};
  },
  onChange: async (id,field,value) => {
    if (busy || imagesLoading) return;
    const card = imageCards.find(item=>item.id===id);
    if (!card) return;
    if (field === "at") card.at = sourceTimeAt(retainedSegments(duration, number("start"), number("end"), cuts), Number(value));
    else card[field] = field === "seconds" ? Number(value) : value;
    stopPreview(); invalidate(); show(id); update();
    if (field === "frame") {
      try { await ensureIllustratedFrame(value); }
      catch { card.frame = "none"; update(); }
    }
  },
  onPreview: id => show(id),
  onRemove: id => {
    if (busy || imagesLoading) return;
    const card = imageCards.find(item=>item.id===id);
    URL.revokeObjectURL(card.url);
    imageCards = imageCards.filter(item=>item.id!==id);
    stopPreview(); invalidate(); show("clip"); update();
  },
  onReplace: async (id,file) => {
    if (busy || imagesLoading) return;
    imagesLoading++; update();
    try {
      const image = await readCardImage(file), card = imageCards.find(item=>item.id===id);
      URL.revokeObjectURL(card.url);
      Object.assign(card,image);
      stopPreview(); invalidate(); show(id);
      message("Image added. Preview the panel to see it with your title.");
    } catch(error) { message(error.message); }
    finally { imagesLoading--; update(); }
  }
});
$("add-image-cards").onclick = () => $("image-cards-file").click();
$("image-cards-file").onchange = async () => {
  const files = [...$("image-cards-file").files];
  $("image-cards-file").value = "";
  if (!files.length || busy || imagesLoading) return;
  const anchor = source ? video.currentTime : 0;
  imagesLoading++; stopPreview(); update();
  let added = 0;
  try {
    for (const file of files) {
      try {
        const image = await readCardImage(file);
        const card = {id:`card-${nextCardId++}`,at:anchor,seconds:3,title:"",frame:"none",color:$("color").value,...image};
        imageCards.push(card); added++;
        mode = card.id; invalidate();
      } catch(error) { message(error.message); }
    }
    if (added === files.length) message("Image cards added. Set their positions and preview the sequence.");
  } finally { imagesLoading--; update(); }
};
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
