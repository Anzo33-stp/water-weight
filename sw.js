/* Water & Weight – offline support.
   Everything is saved on the device; after the first visit the app works with no internet.
   To force an update for everyone after changing files, bump VERSION. */
const VERSION='water-weight-v1';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==VERSION).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(VERSION);
    const hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const res=await net;
    if(res)return res;
    return r.mode==='navigate'?(await c.match('index.html')||Response.error()):Response.error();
  })());
});
