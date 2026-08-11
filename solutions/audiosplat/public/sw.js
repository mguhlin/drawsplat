const CACHE = "audiosplat-v0.1.1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./audiosplat-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method === "POST" &&
    url.pathname.endsWith("/share-target")
  ) {
    event.respondWith(
      (async () => {
        const data = await event.request.formData();
        const files = data
          .getAll("audio")
          .filter(
            (item) => item instanceof File && item.type.startsWith("audio/"),
          );
        const database = await new Promise((resolve, reject) => {
          const request = indexedDB.open("audiosplat-shares", 1);
          request.onupgradeneeded = () =>
            request.result.createObjectStore("files", { autoIncrement: true });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        await new Promise((resolve, reject) => {
          const transaction = database.transaction("files", "readwrite");
          const store = transaction.objectStore("files");
          files.forEach((file) =>
            store.add({ name: file.name, type: file.type, blob: file }),
          );
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
        });
        database.close();
        return Response.redirect(
          new URL("./?shared=1", event.request.url).href,
          303,
        );
      })(),
    );
    return;
  }
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        return (
          cached ??
          (event.request.mode === "navigate"
            ? caches.match("./index.html")
            : new Response("", { status: 504 }))
        );
      }
    })(),
  );
});
