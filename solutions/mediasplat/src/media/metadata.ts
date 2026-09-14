export interface MediaInfo { duration?: number; previewable: boolean; url?: string }

async function readDuration(element: HTMLMediaElement): Promise<number | undefined> {
  const known = () => Number.isFinite(element.duration) && element.duration > 0 ? element.duration : undefined;
  if (known()) return known();
  // Browser-recorded WebM can omit Duration. Seeking to the encoded end lets
  // Chromium discover it; never mistake the requested seek position for length.
  return new Promise(resolve => {
    const finish = (duration?: number) => {
      clearTimeout(timeout);
      element.removeEventListener("durationchange", changed);
      element.removeEventListener("seeked", changed);
      resolve(duration);
    };
    const changed = () => { const duration = known(); if (duration) finish(duration); };
    const timeout = setTimeout(() => finish(), 10000);
    element.addEventListener("durationchange", changed);
    element.addEventListener("seeked", changed);
    try { element.currentTime = Number.MAX_SAFE_INTEGER; } catch { finish(); }
  });
}

export const inspectMedia = async (file: File): Promise<MediaInfo> => {
  const url = URL.createObjectURL(file); const element = document.createElement(file.type.startsWith("audio/") ? "audio" : "video"); element.preload = "metadata";
  try { await new Promise<void>((resolve, reject) => { element.onloadedmetadata = () => resolve(); element.onerror = () => reject(); element.src = url; }); return { duration: await readDuration(element), previewable: true, url }; }
  catch { URL.revokeObjectURL(url); return { previewable: false }; }
  finally { element.removeAttribute("src"); element.load(); }
};
export const acceptedMedia = (file: File) => /\.(mp4|m4v|mov|mkv|webm|avi|wmv|ogm|ogg|mp3|m4a|aac|wav|flac|mpeg|mpg|ts|mts|m2ts)$/i.test(file.name) || /^(video|audio)\//.test(file.type);
