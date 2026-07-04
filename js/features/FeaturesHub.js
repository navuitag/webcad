/**
 * FeaturesHub — tính năng tạo khác biệt WebCAD
 */
class FeaturesHub {
  constructor(app) {
    this.app = app;
    this.vision = new AiVisionEngine(app);
  }

  // AI
  aiDraw(text) { return AiDrawingEngine.parse(this.app, text); }
  aiCheck() {
    const r = DrawingQaEngine.check(this.app);
    return { ...r, message: DrawingQaEngine.formatReport(r) };
  }

  // Thư viện
  insertTemplate(id, point, options) { return BlockLibrary.insert(this.app, id, point, options); }
  startInsertTemplate(id) { this.app.startInsertTemplate(id); }
  listTemplates(cat) { return BlockLibrary.list(cat); }
  listTemplateCategories() { return BlockLibrary.categories; }

  // Interior Design Module (SDD Interior_Design_Module)
  detectRooms() {
    const rooms = InteriorEngine.detectRooms(this.app);
    return {
      success: rooms.length > 0,
      rooms,
      count: rooms.length,
      message: rooms.length
        ? `Phát hiện ${rooms.length} phòng trên bản vẽ.`
        : 'Không phát hiện phòng — dùng công cụ Phòng hoặc mẫu kiến trúc.'
    };
  }

  listInteriorStyles() { return InteriorStyleEngine.list(); }
  listInteriorDecorPresets() { return InteriorStyleEngine.listDecorPresets(); }
  listInteriorMaterials(cat) { return InteriorMaterialLibrary.list(cat); }
  listInteriorAssets(filter) { return InteriorAssetManager.list(filter); }
  listInteriorAssetCategories() { return InteriorAssetManager.categories(); }

  applyInteriorStyle(styleId, roomId) {
    return InteriorSceneGenerator.applyStyle(this.app, styleId, roomId);
  }

  furnishRoom(roomId, styleId) {
    return InteriorSceneGenerator.furnishRoom(this.app, roomId, styleId);
  }

  furnishAllRooms(styleId) {
    return InteriorSceneGenerator.furnishAll(this.app, styleId);
  }

  estimateInteriorCost(styleId) {
    const r = InteriorEstimationEngine.estimate(this.app, styleId);
    return { ...r, report: InteriorEstimationEngine.formatReport(r) };
  }

  exportInteriorBoq(format = 'csv', styleId) {
    return InteriorEstimationEngine.downloadBoq(this.app, styleId, format);
  }

  listInteriorLightingPresets() { return InteriorLightingEngine.list(); }
  applyInteriorLighting(presetId) {
    const r = InteriorLightingEngine.apply(this.app, presetId);
    return { ...r, message: `Ánh sáng: ${r.preset}` };
  }

  listDecorTemplates(category) { return InteriorDecorTemplates.list(category); }
  listDecorTemplateCategories() { return InteriorDecorTemplates.categories; }
  applyDecorTemplate(id) { return InteriorDecorTemplates.apply(this.app, id); }

  startInsertInteriorAsset(id) { this.app.startInsertTemplate(id); }

  // Tự động
  autoDimension(all = true) {
    return all ? AutoDimensionEngine.dimensionAll(this.app) : AutoDimensionEngine.dimensionSelection(this.app);
  }
  generateFloorPlan(w, d, preset) { return FloorPlanGenerator.generate(this.app, w, d, preset); }
  listArchTemplates(cat) { return ArchitecturalTemplates.list(cat); }
  applyArchTemplate(id) { return ArchitecturalTemplates.apply(this.app, id); }
  convertToPlanView(selectionOnly = false) {
    return PlanConversionEngine.convert(this.app, { selectionOnly });
  }

  async importSketch(file, opts = {}) {
    await this.vision.loadImage(file);
    const apiKey = this.app.aiAssistant?.apiKey;
    if (opts.useAi && apiKey) {
      return this.vision.analyzeWithAI(file, apiKey, this.app.aiAssistant?.apiUrl);
    }
    const refPx = opts.refPixels || 100;
    const refMm = opts.refMm || 1000;
    return this.vision.traceToDrawing(refPx, refMm);
  }

  // Xuất
  exportTechnicalPdf(opts) { return TechnicalPdfEngine.export(this.app, opts); }

  // Chia sẻ & Collab
  shareLink() { return this.app.createShareLink(); }
  collabStatus() { return this.app.platform?.collab?.getStatus() || this.app.collaboration?.getStatus?.(); }

  // Offline
  isOfflineCapable() {
    return 'serviceWorker' in navigator && 'indexedDB' in window;
  }

  getOfflineStatus() {
    return { online: navigator.onLine, pwa: this.isOfflineCapable(), cached: !!navigator.serviceWorker?.controller };
  }
}
