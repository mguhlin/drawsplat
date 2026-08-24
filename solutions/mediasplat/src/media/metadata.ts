export interface MediaInfo { duration?: number; previewable: boolean; url?: string }
export const inspectMedia = async (file: File): Promise<MediaInfo> => {
  const url = URL.createObjectURL(file); const element = document.createElement(file.type.startsWith("audio/") ? "audio" : "video"); element.preload = "metadata";
  try { await new Promise<void>((resolve, reject) => { element.onloadedmetadata = () => resolve(); element.onerror = () => reject(); element.src = url; }); return { duration: Number.isFinite(element.duration) ? element.duration : undefined, previewable: true, url }; }
  catch { URL.revokeObjectURL(url); return { previewable: false }; }
};
export const acceptedMedia = (file: File) => /\.(mp4|m4v|mov|mkv|webm|avi|wmv|ogm|ogg|mp3|m4a|aac|wav|flac|mpeg|mpg|ts|mts|m2ts)$/i.test(file.name) || /^(video|audio)\//.test(file.type);
