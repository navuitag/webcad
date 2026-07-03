const CACHE_NAME = 'webcad-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/toolbar.css',
  './css/panel.css',
  './js/app.js',
  './js/core/Drawing.js',
  './js/core/LayerManager.js',
  './js/core/SelectionManager.js',
  './js/core/HistoryManager.js',
  './js/core/CommandManager.js',
  './js/geometry/GeometryEngine.js',
  './js/geometry/SnapEngine.js',
  './js/entities/Entity.js',
  './js/entities/Line.js',
  './js/entities/Circle.js',
  './js/entities/Arc.js',
  './js/entities/Polyline.js',
  './js/entities/Rectangle.js',
  './js/entities/Text.js',
  './js/entities/Dimension.js',
  './js/entities/Entity3D.js',
  './js/renderers/CanvasRenderer.js',
  './js/renderers/ThreeRenderer.js',
  './js/tools/Tool.js',
  './js/tools/SelectTool.js',
  './js/tools/DrawTools.js',
  './js/tools/ModifyTools.js',
  './js/tools/MeasureTools.js',
  './js/tools/ViewTools.js',
  './js/tools/Tool3D.js',
  './js/storage/StorageEngine.js',
  './js/exporters/ExportEngine.js',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
