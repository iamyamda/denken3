// ネットワーク優先（更新が即反映）→ 通信できない時だけキャッシュで再生。
// dk3- プレフィックスのキャッシュだけ管理する（他アプリのキャッシュには触らない）。
var CACHE="dk3-v3";
self.addEventListener("install",function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(["./","./app.html","./data.js","./manifest.webmanifest"]);
  }));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return /^dk3-/.test(k)&&k!==CACHE}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener("fetch",function(e){
  var req=e.request;
  if(req.method!=="GET")return;
  e.respondWith(fetch(req).then(function(r){
    if(r&&r.ok&&new URL(req.url).origin===self.location.origin){
      var cp=r.clone();
      return caches.open(CACHE).then(function(c){return c.put(req,cp)}).then(function(){return r}).catch(function(){return r});
    }
    return r;
  }).catch(function(){
    return caches.match(req,{ignoreSearch:true});
  }));
});
