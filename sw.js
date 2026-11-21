// ネットワーク優先（更新が即反映）→ 通信エラー・同一オリジンのHTTPエラー時は自分のキャッシュから完全一致で返す。
// バージョン: dk3-v8（data.js/textbook.js/chapters.js/lessons.js を同梱。フォールバックは自キャッシュ内の完全一致のみ＝
// 古いbare URLエントリや他アプリのキャッシュに誤ヒットしない）。
var CACHE="dk3-v8";
self.addEventListener("install",function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(["./app.html","./data.js","./textbook.js","./chapters.js","./lessons.js","./manifest.webmanifest","./index.html"]);
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
    if(!r.ok&&new URL(req.url).origin===self.location.origin){
      return caches.open(CACHE).then(function(c){return c.match(req)}).then(function(m){return m||r}).catch(function(){return r});
    }
    return r;
  }).catch(function(){
    return caches.open(CACHE).then(function(c){return c.match(req)}).then(function(m){
      return m||new Response("",{status:504,statusText:"Offline"});
    });
  }));
});
