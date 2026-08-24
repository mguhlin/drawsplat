const CACHE="mediasplat-v1";const ROOT="/solutions/mediasplat/";
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll([ROOT,`${ROOT}manifest.webmanifest`,`${ROOT}icon.svg`])).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;}))) });
