const CACHE='gio-business-planner-mobile-test-002';
const CORE=['/','/planner.html','/gio-mobile-pro.css?v=002','/gio-mobile-pro.js?v=002','/gio-v21-rc-testperiode.css','/gio-v21-rc-testperiode.js','/gio-logo-192.png','/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>caches.match(event.request).then(r=>r||caches.match('/planner.html'))))});
