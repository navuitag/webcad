const CACHE_NAME = 'webcad-v45';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/toolbar.css',
  './css/panel.css',
  './css/phase5.css',
  './css/responsive.css',
  './js/app.js',
  './js/core/Drawing.js',
  './js/core/UnitEngine.js',
  './js/core/LayerManager.js',
  './js/core/SelectionManager.js',
  './js/core/HistoryManager.js',
  './js/core/CommandManager.js',
  './js/core/BlockManager.js',
  './js/core/LayoutManager.js',
  './js/core/cad/GeometryKernel.js',
  './js/core/cad/StyleManager.js',
  './js/core/cad/XrefManager.js',
  './js/core/cad/TemplateManager.js',
  './js/core/cad/PlotEngine.js',
  './js/core/cad/LayerBlockManager.js',
  './js/core/cad/EntitySystem.js',
  './js/core/cad/ConstraintSolver.js',
  './js/core/cad/ParametricEngine.js',
  './js/core/cad/DimensionEngine.js',
  './js/core/cad/FormatRegistry.js',
  './js/core/cad/FileFormatEngine.js',
  './js/core/cad/CommandSystem.js',
  './js/core/cad/CadCore.js',
  './js/geometry/SnapEngine.js',
  './js/entities/Entity.js',
  './js/entities/Line.js',
  './js/entities/Circle.js',
  './js/entities/Arc.js',
  './js/entities/Polyline.js',
  './js/entities/Rectangle.js',
  './js/entities/Text.js',
  './js/entities/Dimension.js',
  './js/entities/Hatch.js',
  './js/entities/Entity3D.js',
  './js/core3d/MaterialManager3D.js',
  './js/core3d/CameraManager3D.js',
  './js/core3d/LightingManager3D.js',
  './js/core3d/MeshFactory3D.js',
  './js/core3d/ExtrudeEngine3D.js',
  './js/core3d/BooleanEngine3D.js',
  './js/core3d/SectionEngine3D.js',
  './js/core3d/Viewer3D.js',
  './js/core3d/three-bootstrap.js',
  './js/renderers/CanvasRenderer.js',
  './js/renderers/ThreeRenderer.js',
  './js/tools/LiveMeasureOverlay.js',
  './js/tools/DirectInput.js',
  './js/tools/Tool.js',
  './js/tools/SelectTool.js',
  './js/tools/DrawTools.js',
  './js/tools/ModifyTools.js',
  './js/tools/MeasureTools.js',
  './js/tools/ViewTools.js',
  './js/tools/Tool3D.js',
  './js/tools/AdvancedTools.js',
  './js/tools/ProTools.js',
  './js/features/ArchPlanStyle.js',
  './js/features/ArchDrawEngine.js',
  './js/features/ArchitecturalTemplates.js',
  './js/tools/ArchDrawTools.js',
  './js/tools/Tools3D.js',
  './js/storage/StorageEngine.js',
  './js/exporters/ExportEngine.js',
  './js/exporters/ImportEngine.js',
  './js/exporters/DxfEngine.js',
  './js/viewer/CadViewer.js',
  './js/storage/CloudStorageEngine.js',
  './js/collab/CollaborationEngine.js',
  './js/plugins/PluginManager.js',
  './js/plugins/PluginHost.js',
  './js/platform/WebCADPlatform.js',
  './js/engine/cad/GeometryKernelWASM.js',
  './js/engine/cad/CadEngine.js',
  './js/engine/file/DwgAdapter.js',
  './js/engine/file/FileEngine.js',
  './js/engine/collab/WorkspaceEngine.js',
  './js/engine/collab/VersionHistoryEngine.js',
  './js/engine/collab/CommentEngine.js',
  './js/engine/collab/CollabPlatform.js',
  './docs/ARCHITECTURE.md',
  './js/ai/AiAssistant.js',
  './js/features/BlockLibrary.js',
  './js/features/interior/InteriorMaterialLibrary.js',
  './js/features/interior/InteriorStyleEngine.js',
  './js/features/interior/InteriorAssetManager.js',
  './js/features/interior/InteriorPlacementEngine.js',
  './js/features/interior/InteriorEngine.js',
  './js/features/interior/InteriorEstimationEngine.js',
  './js/features/interior/InteriorSceneGenerator.js',
  './js/features/interior/InteriorLightingEngine.js',
  './js/features/interior/InteriorDecorTemplates.js',
  './js/features/interior/InteriorAiDesigner.js',
  './js/features/interior/InteriorAutoDecorator.js',
  './js/features/interior/InteriorSketchEngine.js',
  './js/features/interior/InteriorSupplierLibrary.js',
  './js/features/interior/InteriorLifecycleEngine.js',
  './js/features/interior/InteriorMaintenanceEngine.js',
  './js/features/interior/InteriorBimEngine.js',
  './js/features/interior/InteriorBoqEngine.js',
  './js/features/interior/InteriorCommercialAssets.js',
  './js/features/interior/InteriorMarketplace.js',
  './js/features/interior/InteriorCloudLibrary.js',
  './js/features/interior/InteriorCollabEngine.js',
  './js/features/EntityDimensionOverlay.js',
  './js/features/EntityDimensionEngine.js',
  './js/features/AutoDimensionEngine.js',
  './js/features/DrawingQaEngine.js',
  './js/features/FloorPlanGenerator.js',
  './js/features/TechnicalPdfEngine.js',
  './js/features/ModeConversionEngine.js',
  './js/features/PlanConversionEngine.js',
  './js/features/FeaturesHub.js',
  './js/ai/AiDrawingEngine.js',
  './js/ai/AiVisionEngine.js',
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
