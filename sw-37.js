/* Cüzdan service worker: uygulamayı internetsiz açar.
   HTML önce ağdan alınır (güncellemeler hemen gelsin), ağ yoksa önbellekten açılır. */
const CACHE='cuzdan-v6';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;   // Gemini, kur servisleri vb. önbelleğe alınmaz
  const isPage=req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('.html');
  if(isPage){e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));return r})
    .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));return}
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));return res})));
});
