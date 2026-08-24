/* POKEJI historical V38 Service Worker migration bridge. */
const POKEJI_V44_TARGET = '/index.html?sw-migrate=44.0';
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async()=>{
  try{await self.clients.claim()}catch{}
  try{await self.registration.unregister()}catch{}
  try{const keys=await caches.keys();await Promise.all(keys.filter(key=>/^pokeji-v(?:38|42|43)/i.test(key)).map(key=>caches.delete(key)))}catch{}
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  await Promise.all(windows.map(async client=>{
    try{if(client.navigate)await client.navigate(POKEJI_V44_TARGET+'&t='+Date.now());else client.postMessage({type:'POKEJI_LEGACY_SW_RELEASED'})}
    catch{try{client.postMessage({type:'POKEJI_LEGACY_SW_RELEASED'})}catch{}}
  }));
})()));
self.addEventListener('message', event=>{if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting())});
