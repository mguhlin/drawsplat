// Inverse projective mapping from a rectangular scan to four photo corners.
export function validateCorners(points) {
  if (
    points.length !== 4 ||
    points.some(
      (p) =>
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        p.x < 0 ||
        p.x > 1 ||
        p.y < 0 ||
        p.y > 1,
    )
  )
    throw new Error("Keep all four corners inside the photo.");
  const cross = points.map((p, i) => {
    const q = points[(i + 1) % 4],
      r = points[(i + 2) % 4];
    return (q.x - p.x) * (r.y - q.y) - (q.y - p.y) * (r.x - q.x);
  });
  if (cross.some((v) => v < 0.0001))
    throw new Error(
      "Corners must surround the page clockwise without crossing or overlapping.",
    );
}
export function rectify(source, corners, filter = "color", rotation = 0) {
  validateCorners(corners);
  const [a, b, c, d] = corners.map((p) => ({
    x: p.x * (source.width - 1),
    y: p.y * (source.height - 1),
  }));
  const distance = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  const width = Math.max(
    2,
    Math.round(Math.max(distance(a, b), distance(d, c))),
  );
  const height = Math.max(
    2,
    Math.round(Math.max(distance(a, d), distance(b, c))),
  );
  const dx1 = b.x - c.x,
    dx2 = d.x - c.x,
    dx3 = a.x - b.x + c.x - d.x;
  const dy1 = b.y - c.y,
    dy2 = d.y - c.y,
    dy3 = a.y - b.y + c.y - d.y;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det,
    h = (dx1 * dy3 - dx3 * dy1) / det;
  const ax = b.x - a.x + g * b.x,
    bx = d.x - a.x + h * d.x;
  const ay = b.y - a.y + g * b.y,
    by = d.y - a.y + h * d.y;
  const input = source
    .getContext("2d")
    .getImageData(0, 0, source.width, source.height).data;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d"),
    output = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1),
        v = y / (height - 1),
        divisor = g * u + h * v + 1;
      const sx = Math.max(
        0,
        Math.min(source.width - 1, (ax * u + bx * v + a.x) / divisor),
      );
      const sy = Math.max(
        0,
        Math.min(source.height - 1, (ay * u + by * v + a.y) / divisor),
      );
      const x0 = Math.floor(sx),
        y0 = Math.floor(sy),
        x1 = Math.min(x0 + 1, source.width - 1),
        y1 = Math.min(y0 + 1, source.height - 1);
      const fx = sx - x0,
        fy = sy - y0,
        dest = (y * width + x) * 4;
      for (let ch = 0; ch < 3; ch++)
        output.data[dest + ch] =
          input[(y0 * source.width + x0) * 4 + ch] * (1 - fx) * (1 - fy) +
          input[(y0 * source.width + x1) * 4 + ch] * fx * (1 - fy) +
          input[(y1 * source.width + x0) * 4 + ch] * (1 - fx) * fy +
          input[(y1 * source.width + x1) * 4 + ch] * fx * fy;
      const gray =
        0.299 * output.data[dest] +
        0.587 * output.data[dest + 1] +
        0.114 * output.data[dest + 2];
      if (filter === "gray" || filter === "bw")
        output.data.fill(
          filter === "bw" ? (gray >= 160 ? 255 : 0) : gray,
          dest,
          dest + 3,
        );
      if (filter === "clean")
        for (let ch = 0; ch < 3; ch++)
          output.data[dest + ch] = Math.max(
            0,
            Math.min(255, ((output.data[dest + ch] - 30) * 255) / 200),
          );
      output.data[dest + 3] = 255;
    }
  ctx.putImageData(output, 0, 0);
  if (!rotation) return canvas;
  const turned = document.createElement("canvas");
  turned.width = rotation % 180 ? height : width;
  turned.height = rotation % 180 ? width : height;
  const t = turned.getContext("2d");
  t.translate(turned.width / 2, turned.height / 2);
  t.rotate((rotation * Math.PI) / 180);
  t.drawImage(canvas, -width / 2, -height / 2);
  return turned;
}
export async function readPhoto(blob) {
  if (blob.size > 40 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 40 MB.");
  let image;
  try {
    image = await createImageBitmap(blob);
  } catch {
    throw new Error("This photo cannot be opened. Try JPEG, PNG, or WebP.");
  }
  try {
    const scale = Math.min(1, 2200 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(image.width * scale));
    canvas.height = Math.max(2, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    image.close();
  }
}
export const jpeg = (canvas) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("The scan could not be saved.")),
      "image/jpeg",
      0.92,
    ),
  );
