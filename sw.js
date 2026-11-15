/* Cüzdan service worker: uygulamayı internetsiz açar.
   HTML önce ağdan alınır (güncellemeler hemen gelsin), ağ yoksa önbellekten açılır.
   - Sadece başarılı (200) yanıtlar önbelleğe yazılır.
   - Sayfa tek anahtarda (index.html) tutulur; ?add=…&amount=… gibi sorgular ayrı kayıt oluşturmaz.
   - Diğer dosyalar önbellekten hemen verilir, arka planda yenilenir; .shortcut ve manifest önce ağdan alınır. */
const CACHE='cuzdan-v27';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./icon-64.png','./icon-512-maskable.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;   // Gemini, Firebase, kur servisleri vb. önbelleğe alınmaz
  const isPage=req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('.html');
  if(isPage){const key=new URL('./index.html',self.registration.scope).href;
    e.respondWith(fetch(req,{cache:'no-cache'}).then(r=>{
        if(r.ok){const cp=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(key,cp)));return r}
        return caches.match(key).then(c=>c||r)})
      .catch(()=>caches.match(key).then(r=>r||caches.match(req,{ignoreSearch:true}))));return}
  if(/\.(shortcut|webmanifest)$/.test(url.pathname)){
    e.respondWith(fetch(req,{cache:'no-cache'}).then(r=>{if(r.ok){const cp=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(req,cp)))}return r})
      .catch(()=>caches.match(req).then(r=>r||Response.error())));return}
  e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req);
    const net=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}const r=await net;return r||Response.error()}));
});
