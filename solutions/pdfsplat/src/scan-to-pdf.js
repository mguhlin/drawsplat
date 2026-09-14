import { readPhoto, rectify, jpeg } from "./scan-image.js";

export function setupScanner({ addPdf }) {
  const dialog = document.getElementById("scanDialog");
  const $ = (id) => dialog.querySelector(`#${id}`);
  const pages = [];
  let current = -1,
    source,
    busy = false,
    stream,
    cameraRequest = 0;
  const defaultCorners = () => [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  const message = (text) => {
    $("scanStatus").textContent = text;
  };
  const stopCamera = () => {
    cameraRequest++;
    stream?.getTracks().forEach((t) => t.stop());
    stream = undefined;
    $("scanVideo").srcObject = null;
    $("scanCameraPanel").hidden = true;
    $("scanCamera").disabled = false;
  };
  const releasePage = (p) => {
    URL.revokeObjectURL(p.url);
    if (p.preview) URL.revokeObjectURL(p.preview);
  };
  const reset = () => {
    stopCamera();
    pages.forEach(releasePage);
    pages.length = 0;
    current = -1;
    source = undefined;
    $("scanEditor").hidden = true;
    $("scanResult").hidden = true;
    $("scanResult").removeAttribute("src");
    renderList();
    message("Choose photos or open your camera to start.");
  };
  const lock = (value) => {
    busy = value;
    $("scanControls").disabled = value;
    $("scanClose").disabled = value;
  };
  async function run(task) {
    if (busy) return;
    lock(true);
    try {
      await task();
    } catch (error) {
      message(error.message || "The scan could not be processed.");
      $("scanStatus").scrollIntoView({ block: "nearest" });
    } finally {
      lock(false);
    }
  }
  function renderList() {
    $("scanPages").replaceChildren();
    pages.forEach((p, index) => {
      const li = document.createElement("li");
      const img = document.createElement("img");
      img.src = p.preview || p.url;
      img.alt = "";
      li.append(img);
      const select = document.createElement("button");
      select.type = "button";
      select.textContent = `Page ${index + 1}${p.blob ? "" : " · needs review"}`;
      select.setAttribute("aria-pressed", String(index === current));
      select.onclick = () => run(() => selectPage(index));
      li.append(select);
      for (const [label, delta] of [
        ["Move up", -1],
        ["Move down", 1],
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.setAttribute("aria-label", `${label} page ${index + 1}`);
        button.disabled = index + delta < 0 || index + delta >= pages.length;
        button.onclick = () => {
          const active = pages[current];
          [pages[index], pages[index + delta]] = [
            pages[index + delta],
            pages[index],
          ];
          current = pages.indexOf(active);
          renderList();
        };
        li.append(button);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove page ${index + 1}`);
      remove.onclick = () =>
        run(async () => {
          const active = pages[current];
          releasePage(p);
          pages.splice(index, 1);
          if (pages.length)
            await selectPage(
              active === p
                ? Math.min(index, pages.length - 1)
                : pages.indexOf(active),
            );
          else {
            current = -1;
            source = undefined;
            $("scanEditor").hidden = true;
            $("scanResult").hidden = true;
          }
          renderList();
        });
      li.append(remove);
      $("scanPages").append(li);
    });
    const ready = pages.length > 0 && pages.every((p) => p.blob);
    $("scanDownload").disabled = !ready;
    $("scanAdd").disabled = !ready;
  }
  function drawCorners() {
    const p = pages[current];
    if (!p) return;
    $("scanOutline").setAttribute(
      "points",
      p.corners.map((c) => `${c.x * 100},${c.y * 100}`).join(" "),
    );
    dialog.querySelectorAll(".scan-corner").forEach((button, i) => {
      button.style.left = `${p.corners[i].x * 100}%`;
      button.style.top = `${p.corners[i].y * 100}%`;
    });
  }
  function dirty() {
    const p = pages[current];
    p.blob = undefined;
    if (p.preview) URL.revokeObjectURL(p.preview);
    p.preview = undefined;
    $("scanResult").hidden = true;
    renderList();
    drawCorners();
  }
  async function selectPage(index) {
    const p = pages[index];
    source = await readPhoto(p.original);
    current = index;
    $("scanPhoto").src = p.url;
    $("scanEditor").hidden = false;
    $("scanFilter").value = p.filter;
    $("scanResult").hidden = !p.preview;
    if (p.preview) $("scanResult").src = p.preview;
    drawCorners();
    renderList();
    message(
      `Editing page ${index + 1}. Move the four corners to the paper edges, then save the page.`,
    );
  }
  async function addPhotos(files) {
    if (pages.length + files.length > 20)
      throw new Error(
        "Use up to 20 photos per scan. Create another PDF for additional pages.",
      );
    const first = pages.length;
    for (const file of files) {
      const canvas = await readPhoto(file),
        original = await jpeg(canvas);
      pages.push({
        original,
        url: URL.createObjectURL(original),
        corners: defaultCorners(),
        filter: "color",
        rotation: 0,
      });
      renderList();
    }
    if (pages.length > first) await selectPage(first);
  }
  for (const id of ["scanFiles", "scanCapture"])
    $(id).onchange = () => {
      const files = [...$(id).files];
      $(id).value = "";
      void run(() => addPhotos(files));
    };
  dialog.addEventListener("dragover", (event) => event.preventDefault());
  dialog.addEventListener("drop", (event) => {
    event.preventDefault();
    void run(() => addPhotos([...event.dataTransfer.files]));
  });
  $("scanUpload").onclick = () => $("scanFiles").click();
  $("scanTakePhoto").onclick = () => $("scanCapture").click();
  $("scanCamera").onclick = async () => {
    const request = ++cameraRequest;
    $("scanCamera").disabled = true;
    message("Allow camera access in your browser.");
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Camera access is unavailable. Use Take a photo or Choose photos.",
        );
      const opened = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      if (request !== cameraRequest || !dialog.open) {
        opened.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = opened;
      $("scanVideo").srcObject = stream;
      $("scanCameraPanel").hidden = false;
      await $("scanVideo").play();
      message("Position the paper in view, then capture a page.");
    } catch (error) {
      if (request === cameraRequest) {
        stopCamera();
        message(
          `Camera could not start: ${error.message}. You can choose an existing photo instead.`,
        );
      }
    }
  };
  $("scanStopCamera").onclick = stopCamera;
  $("scanSnapshot").onclick = () =>
    run(async () => {
      const video = $("scanVideo");
      if (!video.videoWidth)
        throw new Error("Wait for the camera preview before capturing.");
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      await addPhotos([await jpeg(canvas)]);
    });
  $("scanFilter").onchange = () => {
    pages[current].filter = $("scanFilter").value;
    dirty();
  };
  $("scanRotate").onclick = () => {
    pages[current].rotation = (pages[current].rotation + 90) % 360;
    dirty();
    message(
      `Output rotation: ${pages[current].rotation}°. Save page to preview.`,
    );
  };
  $("scanResetCorners").onclick = () => {
    pages[current].corners = defaultCorners();
    dirty();
  };
  dialog.querySelectorAll(".scan-corner").forEach((button, index) => {
    let dragging = false;
    const update = (x, y) => {
      pages[current].corners[index] = {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      };
      dirty();
    };
    button.onpointerdown = (e) => {
      if (busy) return;
      e.preventDefault();
      dragging = true;
      button.setPointerCapture(e.pointerId);
    };
    button.onpointermove = (e) => {
      if (!dragging) return;
      const rect = $("scanPhotoStage").getBoundingClientRect();
      update(
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height,
      );
    };
    button.onpointerup = button.onpointercancel = () => {
      dragging = false;
    };
    button.onkeydown = (e) => {
      const shifts = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      if (!shifts[e.key]) return;
      e.preventDefault();
      const [dx, dy] = shifts[e.key],
        p = pages[current].corners[index],
        step = e.shiftKey ? 0.02 : 0.005;
      update(p.x + dx * step, p.y + dy * step);
    };
  });
  $("scanSave").onclick = () =>
    run(async () => {
      message("Correcting perspective…");
      await new Promise((resolve) => setTimeout(resolve, 0));
      const p = pages[current],
        corrected = rectify(source, p.corners, p.filter, p.rotation);
      p.blob = await jpeg(corrected);
      p.width = corrected.width;
      p.height = corrected.height;
      if (p.preview) URL.revokeObjectURL(p.preview);
      p.preview = URL.createObjectURL(p.blob);
      $("scanResult").src = p.preview;
      $("scanResult").hidden = false;
      $("scanResult").scrollIntoView({ block: "nearest" });
      renderList();
      message(
        `Page ${current + 1} saved. Review the corrected image below; choose another page or create your PDF.`,
      );
    });
  async function makePdf() {
    if (!pages.length || pages.some((p) => !p.blob))
      throw new Error("Save every page before creating the PDF.");
    stopCamera();
    message("Creating PDF on this device…");
    const pdf = await globalThis.PDFLib.PDFDocument.create();
    for (const p of pages) {
      const image = await pdf.embedJpg(await p.blob.arrayBuffer());
      let width = p.width * 0.36,
        height = p.height * 0.36;
      const size = $("scanPaper").value;
      if (size !== "photo") {
        [width, height] = size === "letter" ? [612, 792] : [595.28, 841.89];
        if (p.width > p.height) [width, height] = [height, width];
      }
      const page = pdf.addPage([width, height]),
        scale = Math.min(width / p.width, height / p.height);
      page.drawImage(image, {
        x: (width - p.width * scale) / 2,
        y: (height - p.height * scale) / 2,
        width: p.width * scale,
        height: p.height * scale,
      });
    }
    pdf.setTitle("Scanned document");
    return new File([await pdf.save()], "scanned-document.pdf", {
      type: "application/pdf",
    });
  }
  $("scanDownload").onclick = () =>
    run(async () => {
      const file = await makePdf(),
        url = URL.createObjectURL(file),
        a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      message("PDF downloaded. You can also add the scans to the editor.");
    });
  $("scanAdd").onclick = () =>
    run(async () => {
      const file = await makePdf();
      await addPdf(file);
      dialog.close();
    });
  $("scanClose").onclick = () => {
    stopCamera();
    dialog.close();
  };
  dialog.addEventListener("cancel", (event) => {
    if (busy) event.preventDefault();
    else stopCamera();
  });
  dialog.addEventListener("close", reset);
  window.addEventListener("pagehide", stopCamera);
  for (const id of ["scanButton", "scanStartButton"])
    document.getElementById(id).onclick = () => {
      dialog.showModal();
      message("Choose photos or open your camera to start.");
    };
  renderList();
}
