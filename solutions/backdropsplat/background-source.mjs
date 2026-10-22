// SPDX-License-Identifier: AGPL-3.0-or-later
import { MAX_FILE_BYTES } from './pixels.mjs';
export function onlineImageURL(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Enter a complete HTTPS image URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use an HTTPS image URL without embedded sign-in details.');
  url.hash = ''; return url;
}
export async function fetchBackground(value, { signal } = {}) {
  const url = onlineImageURL(value);
  let response;
  try { response = await fetch(url.href, { signal, mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' }); }
  catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('This image could not be loaded. The host may block browser access. Download the image and upload it here instead.');
  }
  if (!response.ok || response.type === 'opaque') throw new Error('The image host did not allow this download. Check the direct image URL, or download the image and upload it here.');
  if (response.url && new URL(response.url).protocol !== 'https:') throw new Error('The image must stay on HTTPS. Download it and upload a local copy instead.');
  const tooLarge = () => new Error('This background is over 40 MB. Use a smaller copy.');
  if (Number(response.headers.get('content-length')) > MAX_FILE_BYTES) { await response.body?.cancel(); throw tooLarge(); }
  if (!response.body) throw new Error('The host returned an empty image. Choose another URL or upload a file.');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    while (true) {
      const { value: chunk, done } = await reader.read(); if (done) break;
      size += chunk.byteLength;
      if (size > MAX_FILE_BYTES) { await reader.cancel(); throw tooLarge(); }
      chunks.push(chunk);
    }
  } finally { reader.releaseLock(); }
  return new Blob(chunks, { type: response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream' });
}
