import { framework } from "./webdeck-runtime.js";
const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function createWebDeck(title, pages) {
  const slides = pages.map((image, index) => `<section class="slide${index === 0 ? " current" : ""}"><div class="slide-body pdf-page"><img src="${image}" alt="Page ${index + 1} of ${pages.length}" /></div><div class="notes"></div></section>`).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator" content="PDFSplat; Web Deck v5 (https://mguhlin.github.io/webdecks/) — developed by Miguel Guhlin - mguhlin.org"><title>${escape(title)}</title><style>${framework.css}
.pdf-page {padding:0;display:flex;align-items:center;justify-content:center;background:#fff}
.pdf-page img {width:100%;height:100%;object-fit:contain;min-height:0}
.slide::after {display:none}
</style></head><body><main class="deck" aria-label="${escape(title)}">${slides}</main><script>${framework.js.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
}
export function blobDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
