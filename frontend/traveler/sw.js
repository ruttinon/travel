const CACHE='unfold-v2.7-readiness';
const ASSETS=['./','./index.html','./app.js','./styles.css','./manifest.webmanifest','./assets/icon-192.png','./assets/hero-forest.webp','./assets/terraced-fields.webp','./assets/misty-cabin.webp'];
self.addEventListener('install', event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate', event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch', event=>{
 const req=event.request,u=new URL(req.url);
 if(req.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/')||u.pathname.startsWith('/admin')||u.pathname.startsWith('/uploads/')||u.pathname.startsWith('/review-media/'))return;
 if(req.mode==='navigate'||/\.(?:js|css|html|webmanifest)$/.test(u.pathname)){
   event.respondWith(fetch(req).catch(()=>caches.match(req)));return;
 }
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok&&/\.(?:webp|png|jpg|svg)$/.test(u.pathname)){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})));
});
