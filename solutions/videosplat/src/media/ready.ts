/** Waits for local decoding without leaving canceled operations or listeners alive. */
export function waitForMedia(
  element: HTMLMediaElement | HTMLImageElement,
  signal?: AbortSignal,
  timeoutMs = 15000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const isImage = element instanceof HTMLImageElement;
    const event = isImage ? "load" : "loadeddata";
    const cleanup = () => {
      clearTimeout(timer);
      element.removeEventListener(event, ready);
      element.removeEventListener("error", error);
      signal?.removeEventListener("abort", abort);
    };
    const finish = (reason?: unknown) => { cleanup(); reason ? reject(reason) : resolve(); };
    const ready = () => finish();
    const error = () => finish(new Error("A media file could not be decoded. Try another file or browser."));
    const abort = () => finish(signal?.reason ?? new DOMException("Canceled", "AbortError"));
    const timer = setTimeout(() => finish(new Error("Media decoding timed out. Try another file or browser.")), timeoutMs);
    element.addEventListener(event, ready);
    element.addEventListener("error", error);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    else if (isImage ? element.complete && element.naturalWidth > 0 : element.readyState >= 2) ready();
    else if (!isImage && element.error) error();
  });
}
